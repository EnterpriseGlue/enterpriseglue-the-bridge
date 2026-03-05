import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const baseEnv = {
  DATABASE_TYPE: 'postgres',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'postgres',
  POSTGRES_DATABASE: 'postgres',
  POSTGRES_SSL: 'false',
  ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

const quoteIdentifier = (value: string): string => `"${value.replace(/"/g, '""')}"`;

async function createPool() {
  const pgModule = await import('pg');
  const Pool = (pgModule.default?.Pool || pgModule.Pool) as typeof import('pg').Pool;

  return new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

function applyBaseEnv(schema: string) {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_TYPE = baseEnv.DATABASE_TYPE;
  process.env.POSTGRES_HOST = baseEnv.POSTGRES_HOST;
  process.env.POSTGRES_PORT = baseEnv.POSTGRES_PORT;
  process.env.POSTGRES_USER = baseEnv.POSTGRES_USER;
  process.env.POSTGRES_PASSWORD = baseEnv.POSTGRES_PASSWORD;
  process.env.POSTGRES_DATABASE = baseEnv.POSTGRES_DATABASE;
  process.env.POSTGRES_SSL = baseEnv.POSTGRES_SSL;
  process.env.ENCRYPTION_KEY = baseEnv.ENCRYPTION_KEY;
  process.env.POSTGRES_SCHEMA = schema;
}

async function cleanupSchemas(targetSchema: string) {
  const pool = await createPool();
  try {
    await pool.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(targetSchema)} CASCADE`);
    await pool.query('DROP SCHEMA IF EXISTS main CASCADE');
  } finally {
    await pool.end();
  }
}

describe('Postgres schema auto-migration', () => {
  const targetSchema = `schema_migrate_${Date.now()}`;
  const seedPrefix = `schema_migrate_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    applyBaseEnv('main');
    await cleanupSchemas(targetSchema);
  });

  afterAll(async () => {
    await cleanupSchemas(targetSchema);

    // Restore main schema so other integration tests still find main.users
    applyBaseEnv('main');
    vi.resetModules();
    const { runMigrations } = await import('@enterpriseglue/shared/db/run-migrations.js');
    const { closeDataSource } = await import('@enterpriseglue/shared/db/data-source.js');
    await runMigrations();
    await closeDataSource();
  });

  it('moves existing tables/data from main to configured schema', async () => {
    applyBaseEnv('main');
    vi.resetModules();

    const { runMigrations } = await import('@enterpriseglue/shared/db/run-migrations.js');
    const { closeDataSource } = await import('@enterpriseglue/shared/db/data-source.js');
    const { seedUser } = await import('../utils/seed.js');

    await runMigrations();
    const seededUser = await seedUser(seedPrefix);
    await closeDataSource();

    applyBaseEnv(targetSchema);
    vi.resetModules();

    const { runMigrations: runMigrationsNext } = await import('@enterpriseglue/shared/db/run-migrations.js');
    const { closeDataSource: closeDataSourceNext } = await import('@enterpriseglue/shared/db/data-source.js');

    await runMigrationsNext();
    await closeDataSourceNext();

    const pool = await createPool();
    try {
      const result = await pool.query(
        `SELECT count(*)::int AS count FROM ${quoteIdentifier(targetSchema)}.users WHERE email = $1`,
        [seededUser.email]
      );
      expect(result.rows[0]?.count).toBe(1);

      const mainTables = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' AND table_type = 'BASE TABLE'"
      );
      expect(mainTables.rows.length).toBe(0);
    } finally {
      await pool.end();
    }
  });
});
