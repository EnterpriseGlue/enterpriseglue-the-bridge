import { QueryRunner } from 'typeorm';
import { getDataSource, adapter } from './data-source.js';
import { EnvironmentTag } from './entities/EnvironmentTag.js';
import { PlatformSettings } from './entities/PlatformSettings.js';
import { User } from './entities/User.js';
// Tenant entities removed - multi-tenancy is EE-only
import { EmailTemplate } from './entities/EmailTemplate.js';
import { SsoClaimsMapping } from './entities/SsoClaimsMapping.js';
import { SsoProvider } from './entities/SsoProvider.js';
import { RefreshToken } from './entities/RefreshToken.js';
import { GitProvider } from './entities/GitProvider.js';
import { GitCredential } from './entities/GitCredential.js';

/**
 * Ensure schema exists using TypeORM QueryRunner APIs (no raw SQL)
 */
async function ensureSchemaExistsWithRunner(queryRunner: QueryRunner, schemaName: string): Promise<void> {
  const hasSchema = await queryRunner.hasSchema(schemaName);
  if (!hasSchema) {
    await queryRunner.createSchema(schemaName, true);
  }
}

export async function ensureSchemaExists(schemaName: string): Promise<void> {
  const dataSource = await getDataSource();
  const queryRunner = dataSource.createQueryRunner();

  try {
    await ensureSchemaExistsWithRunner(queryRunner, schemaName);
  } finally {
    await queryRunner.release();
  }
}

const quoteIdentifier = (value: string): string => `"${value.replace(/"/g, '""')}"`;

async function listSchemaTables(queryRunner: QueryRunner, schemaName: string): Promise<string[]> {
  const rows: Array<{ table_name: string }> = await queryRunner.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE'",
    [schemaName]
  );
  return rows.map((row) => row.table_name);
}

async function listSchemaSequences(queryRunner: QueryRunner, schemaName: string): Promise<string[]> {
  const rows: Array<{ sequence_name: string }> = await queryRunner.query(
    'SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = $1',
    [schemaName]
  );
  return rows.map((row) => row.sequence_name);
}

async function listSchemaEnums(queryRunner: QueryRunner, schemaName: string): Promise<string[]> {
  const rows: Array<{ type_name: string }> = await queryRunner.query(
    "SELECT t.typname AS type_name FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = $1 AND t.typtype = 'e'",
    [schemaName]
  );
  return rows.map((row) => row.type_name);
}

async function autoMigratePostgresSchema(queryRunner: QueryRunner, schemaName: string): Promise<void> {
  const sourceSchema = 'main';
  const targetSchema = schemaName;

  if (!targetSchema || targetSchema === sourceSchema || targetSchema === 'public') {
    return;
  }

  const sourceTables = await listSchemaTables(queryRunner, sourceSchema);
  if (sourceTables.length === 0) {
    return;
  }

  const targetTables = await listSchemaTables(queryRunner, targetSchema);
  if (targetTables.length > 0) {
    throw new Error(
      `Detected tables in both "${sourceSchema}" and "${targetSchema}" schemas. ` +
      'Manual cleanup is required before automatic migration can run.'
    );
  }

  await ensureSchemaExistsWithRunner(queryRunner, targetSchema);

  console.log(
    `  🔁 Migrating ${sourceTables.length} table(s) from "${sourceSchema}" to "${targetSchema}"...`
  );

  const enums = await listSchemaEnums(queryRunner, sourceSchema);

  await queryRunner.startTransaction();
  try {
    for (const typeName of enums) {
      await queryRunner.query(
        `ALTER TYPE ${quoteIdentifier(sourceSchema)}.${quoteIdentifier(typeName)} SET SCHEMA ${quoteIdentifier(targetSchema)}`
      );
    }

    for (const tableName of sourceTables) {
      await queryRunner.query(
        `ALTER TABLE ${quoteIdentifier(sourceSchema)}.${quoteIdentifier(tableName)} SET SCHEMA ${quoteIdentifier(targetSchema)}`
      );
    }

    const sequences = await listSchemaSequences(queryRunner, sourceSchema);
    for (const sequenceName of sequences) {
      await queryRunner.query(
        `ALTER SEQUENCE ${quoteIdentifier(sourceSchema)}.${quoteIdentifier(sequenceName)} SET SCHEMA ${quoteIdentifier(targetSchema)}`
      );
    }

    await queryRunner.commitTransaction();
    console.log(`  ✅ Schema migration completed to "${targetSchema}".`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  }
}

/**
 * Run database migrations using TypeORM
 * Database-agnostic implementation supporting PostgreSQL, Oracle, MySQL, SQL Server, Spanner
 */
export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  const dbType = adapter.getDatabaseType();
  const schemaName = adapter.getSchemaName();
  
  // Ensure schema exists BEFORE DataSource init (migrations need the schema)
  if (schemaName && schemaName !== 'public') {
    try {
      await ensureSchemaExists(schemaName);
      console.log(`  ✅ Schema "${schemaName}" ensured`);
    } catch (error: any) {
      if (dbType === 'oracle') {
        console.log(`  ℹ️  Oracle schema "${schemaName}" should be created by DBA`);
      } else {
        console.log(`  Note: Schema creation: ${error.message}`);
      }
    }
  }

  try {
    // Initialize TypeORM DataSource (runs pending migrations if any)
    const dataSource = await getDataSource();

    const queryRunner = dataSource.createQueryRunner();
    try {
      if (dbType === 'postgres' && schemaName) {
        try {
          await autoMigratePostgresSchema(queryRunner, schemaName);
        } catch (error) {
          console.error('❌ Schema auto-migration failed. Aborting startup.');
          throw error;
        }
      }

      const coreBootstrapEntities = [
        User,
        SsoProvider,
        RefreshToken,
        EnvironmentTag,
        PlatformSettings,
        EmailTemplate,
        SsoClaimsMapping,
        GitProvider,
        GitCredential,
      ];

      const missingTables: string[] = [];
      for (const entity of coreBootstrapEntities) {
        const tablePath = dataSource.getMetadata(entity).tablePath;
        const hasTable = await queryRunner.hasTable(tablePath);
        if (!hasTable) {
          missingTables.push(tablePath);
        }
      }

      if (missingTables.length > 0) {
        console.log(
          `  ℹ️  Database bootstrap required (missing ${missingTables.length} core table(s): ${missingTables.join(', ')}). Running TypeORM synchronize().`
        );
        await dataSource.synchronize();
      }
    } finally {
      await queryRunner.release();
    }

    // Run pending migrations
    const pendingMigrations = await dataSource.showMigrations();
    if (pendingMigrations) {
      console.log('  Running pending migrations...');
      await dataSource.runMigrations();
    }
    
    console.log('✅ Database migrations complete');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

/**
 * Seed initial data required for the application
 * Uses TypeORM upsert for database-agnostic seeding
 */
export async function seedInitialData() {
  console.log('🌱 Seeding initial data...');
  
  const dataSource = await getDataSource();
  const now = Date.now();
  
  // Seed default environment tags using TypeORM upsert
  try {
    const envTagRepo = dataSource.getRepository(EnvironmentTag);
    await envTagRepo.upsert([
      { id: 'env-dev', name: 'Dev', color: '#22c55e', manualDeployAllowed: true, sortOrder: 0, isDefault: true, createdAt: now, updatedAt: now },
      { id: 'env-test', name: 'Test', color: '#eab308', manualDeployAllowed: true, sortOrder: 1, isDefault: false, createdAt: now, updatedAt: now },
      { id: 'env-staging', name: 'Staging', color: '#f97316', manualDeployAllowed: false, sortOrder: 2, isDefault: false, createdAt: now, updatedAt: now },
      { id: 'env-production', name: 'Production', color: '#ef4444', manualDeployAllowed: false, sortOrder: 3, isDefault: false, createdAt: now, updatedAt: now },
    ], { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true });
    console.log('  ✅ environment_tags seeded');
  } catch (error: any) {
    console.log('  Note: environment_tags:', error.message);
  }
  
  // Seed default platform settings
  try {
    const platformSettingsRepo = dataSource.getRepository(PlatformSettings);
    await platformSettingsRepo.upsert(
      { id: 'default', updatedAt: now },
      { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true }
    );
    console.log('  ✅ platform_settings seeded');
  } catch (error: any) {
    console.log('  Note: platform_settings:', error.message);
  }
  
  // Tenant seeding removed - multi-tenancy is EE-only
  // OSS runs in single-tenant mode without tenant tables
  console.log('  ℹ️  OSS single-tenant mode (no tenant tables)');
  
  // Seed default email templates
  try {
    const emailTemplateRepo = dataSource.getRepository(EmailTemplate);
    await emailTemplateRepo.upsert([
      {
        id: 'tpl-invite',
        type: 'invite',
        name: 'User Invitation',
        subject: "You've been invited to {{platformName}}",
        htmlTemplate: '<h1>Welcome to {{platformName}}</h1><p>You have been invited by {{inviterName}} to join {{platformName}}.</p><p><a href="{{inviteLink}}">Accept Invitation</a></p><p>This invitation expires in {{expiresIn}}.</p>',
        textTemplate: 'Welcome to {{platformName}}\n\nYou have been invited by {{inviterName}} to join {{platformName}}.\n\nAccept your invitation: {{inviteLink}}\n\nThis invitation expires in {{expiresIn}}.',
        variables: '["platformName", "inviterName", "inviteLink", "expiresIn"]',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tpl-password-reset',
        type: 'password_reset',
        name: 'Password Reset',
        subject: 'Reset your {{platformName}} password',
        htmlTemplate: '<h1>Password Reset Request</h1><p>We received a request to reset your password for {{platformName}}.</p><p><a href="{{resetLink}}">Reset Password</a></p><p>If you didn\'t request this, you can safely ignore this email.</p><p>This link expires in {{expiresIn}}.</p>',
        textTemplate: 'Password Reset Request\n\nWe received a request to reset your password for {{platformName}}.\n\nReset your password: {{resetLink}}\n\nIf you didn\'t request this, you can safely ignore this email.\n\nThis link expires in {{expiresIn}}.',
        variables: '["platformName", "resetLink", "expiresIn"]',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tpl-welcome',
        type: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to {{platformName}}!',
        htmlTemplate: '<h1>Welcome to {{platformName}}!</h1><p>Hi {{userName}},</p><p>Your account has been created successfully.</p><p><a href="{{loginLink}}">Login to get started</a></p>',
        textTemplate: 'Welcome to {{platformName}}!\n\nHi {{userName}},\n\nYour account has been created successfully.\n\nLogin to get started: {{loginLink}}',
        variables: '["platformName", "userName", "loginLink"]',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tpl-email-verification',
        type: 'email_verification',
        name: 'Email Verification',
        subject: 'Verify your email for {{platformName}}',
        htmlTemplate: '<h1>Verify Your Email</h1><p>Hi {{userName}},</p><p>Please verify your email address by clicking the link below:</p><p><a href="{{verifyLink}}">Verify Email</a></p><p>This link expires in {{expiresIn}}.</p>',
        textTemplate: 'Verify Your Email\n\nHi {{userName}},\n\nPlease verify your email address: {{verifyLink}}\n\nThis link expires in {{expiresIn}}.',
        variables: '["platformName", "userName", "verifyLink", "expiresIn"]',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ], { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true });
    console.log('  ✅ email_templates seeded');
  } catch (error: any) {
    console.log('  Note: email_templates:', error.message);
  }
  
  // Seed default SSO claims mappings
  try {
    const ssoMappingRepo = dataSource.getRepository(SsoClaimsMapping);
    await ssoMappingRepo.upsert([
      { id: 'default-admin-group', providerId: null, claimType: 'group', claimKey: 'groups', claimValue: 'Platform Admins', targetRole: 'admin', priority: 100, isActive: true, createdAt: now, updatedAt: now },
      { id: 'default-developer-group', providerId: null, claimType: 'group', claimKey: 'groups', claimValue: 'Developers', targetRole: 'developer', priority: 50, isActive: true, createdAt: now, updatedAt: now },
      { id: 'default-all-users', providerId: null, claimType: 'group', claimKey: 'groups', claimValue: '*', targetRole: 'user', priority: 0, isActive: true, createdAt: now, updatedAt: now },
    ], { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true });
    console.log('  ✅ sso_claims_mappings seeded');
  } catch (error: any) {
    console.log('  Note: sso_claims_mappings:', error.message);
  }
  
  console.log('✅ Initial data seeding complete');
}

/**
 * Initialize database - run migrations and seed data
 */
export async function initializeDatabase() {
  await runMigrations();
  await seedInitialData();
}
