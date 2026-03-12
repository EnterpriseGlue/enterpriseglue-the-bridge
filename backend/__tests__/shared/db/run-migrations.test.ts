import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { runMigrations } from '@enterpriseglue/shared/db/run-migrations.js';
import { getDataSource, adapter } from '@enterpriseglue/shared/db/data-source.js';

vi.mock('@enterpriseglue/shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
  adapter: {
    getDatabaseType: vi.fn().mockReturnValue('oracle'),
    getSchemaName: vi.fn().mockReturnValue('public'),
  },
}));

describe('runMigrations bootstrap behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adapter.getSchemaName as unknown as Mock).mockReturnValue('public');
    (adapter.getDatabaseType as unknown as Mock).mockReturnValue('oracle');
  });

  it('runs synchronize when any core bootstrap table is missing', async () => {
    const queryRunner = {
      hasTable: vi.fn(async (tablePath: string) => tablePath !== 'main.sso_providers'),
      release: vi.fn().mockResolvedValue(undefined),
    };

    const dataSource = {
      createQueryRunner: vi.fn(() => queryRunner),
      getMetadata: vi.fn((entity: any) => {
        const byName: Record<string, string> = {
          User: 'main.users',
          SsoProvider: 'main.sso_providers',
          RefreshToken: 'main.refresh_tokens',
          EnvironmentTag: 'main.environment_tags',
          PlatformSettings: 'main.platform_settings',
          EmailTemplate: 'main.email_templates',
          SsoClaimsMapping: 'main.sso_claims_mappings',
          GitProvider: 'main.git_providers',
        };
        return { tablePath: byName[entity.name] ?? `main.${String(entity.name).toLowerCase()}` };
      }),
      synchronize: vi.fn().mockResolvedValue(undefined),
      showMigrations: vi.fn().mockResolvedValue(false),
      runMigrations: vi.fn().mockResolvedValue(undefined),
    };

    (getDataSource as unknown as Mock).mockResolvedValue(dataSource);

    await runMigrations();

    expect(dataSource.synchronize).toHaveBeenCalledTimes(1);
    expect(dataSource.runMigrations).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('skips synchronize when all core bootstrap tables already exist', async () => {
    const queryRunner = {
      hasTable: vi.fn().mockResolvedValue(true),
      release: vi.fn().mockResolvedValue(undefined),
    };

    const dataSource = {
      createQueryRunner: vi.fn(() => queryRunner),
      getMetadata: vi.fn((entity: any) => ({ tablePath: `main.${String(entity.name).toLowerCase()}` })),
      synchronize: vi.fn().mockResolvedValue(undefined),
      showMigrations: vi.fn().mockResolvedValue(true),
      runMigrations: vi.fn().mockResolvedValue(undefined),
    };

    (getDataSource as unknown as Mock).mockResolvedValue(dataSource);

    await runMigrations();

    expect(dataSource.synchronize).not.toHaveBeenCalled();
    expect(dataSource.runMigrations).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('self-heals a partial bootstrap on first run and remains stable on second run', async () => {
    const queryRunner = {
      hasTable: vi
        .fn()
        // first run: first table missing triggers synchronize path
        .mockResolvedValueOnce(false)
        // first run remaining checks
        .mockResolvedValue(true),
      release: vi.fn().mockResolvedValue(undefined),
    };

    const dataSource = {
      createQueryRunner: vi.fn(() => queryRunner),
      getMetadata: vi.fn((entity: any) => ({ tablePath: `main.${String(entity.name).toLowerCase()}` })),
      synchronize: vi.fn().mockResolvedValue(undefined),
      showMigrations: vi.fn().mockResolvedValue(false),
      runMigrations: vi.fn().mockResolvedValue(undefined),
    };

    (getDataSource as unknown as Mock).mockResolvedValue(dataSource);

    await runMigrations();
    expect(dataSource.synchronize).toHaveBeenCalledTimes(1);

    // second run: everything exists
    queryRunner.hasTable.mockReset();
    queryRunner.hasTable.mockResolvedValue(true);
    dataSource.showMigrations.mockResolvedValue(true);

    await runMigrations();

    expect(dataSource.synchronize).toHaveBeenCalledTimes(1);
    expect(dataSource.runMigrations).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(2);
  });

  it('reconciles mixed postgres schemas when objects are split across main and the configured schema', async () => {
    (adapter.getSchemaName as unknown as Mock).mockReturnValue('onejob_sbx');
    (adapter.getDatabaseType as unknown as Mock).mockReturnValue('postgres');

    const ensureSchemaRunner = {
      hasSchema: vi.fn().mockResolvedValue(true),
      createSchema: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };

    const migrationRunner = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes('information_schema.tables') && params?.[0] === 'main') {
          return [{ table_name: 'users' }, { table_name: 'refresh_tokens' }];
        }
        if (sql.includes('information_schema.tables') && params?.[0] === 'onejob_sbx') {
          return [{ table_name: 'environment_tags' }];
        }
        if (sql.includes('pg_class') && params?.[0] === 'main') {
          return [{ sequence_name: 'orphan_sequence' }];
        }
        if (sql.includes('pg_class') && params?.[0] === 'onejob_sbx') {
          return [];
        }
        if (sql.includes('pg_type')) {
          return [];
        }
        return undefined;
      }),
      startTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      hasTable: vi.fn().mockResolvedValue(true),
      hasSchema: vi.fn().mockResolvedValue(true),
      createSchema: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };

    const dataSource = {
      createQueryRunner: vi
        .fn()
        .mockReturnValueOnce(ensureSchemaRunner)
        .mockReturnValueOnce(migrationRunner),
      getMetadata: vi.fn((entity: any) => ({ tablePath: `onejob_sbx.${String(entity.name).toLowerCase()}` })),
      synchronize: vi.fn().mockResolvedValue(undefined),
      showMigrations: vi.fn().mockResolvedValue(false),
      runMigrations: vi.fn().mockResolvedValue(undefined),
    };

    (getDataSource as unknown as Mock).mockResolvedValue(dataSource);

    await runMigrations();

    expect(migrationRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(migrationRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(migrationRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(migrationRunner.query).toHaveBeenCalledWith(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE'",
      ['main']
    );
    expect(migrationRunner.query).toHaveBeenCalledWith(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE'",
      ['onejob_sbx']
    );
    expect(migrationRunner.query).toHaveBeenCalledWith(
      'ALTER SEQUENCE "main"."orphan_sequence" SET SCHEMA "onejob_sbx"'
    );
    expect(migrationRunner.query).toHaveBeenCalledWith('ALTER TABLE "main"."users" SET SCHEMA "onejob_sbx"');
    expect(migrationRunner.query).toHaveBeenCalledWith('ALTER TABLE "main"."refresh_tokens" SET SCHEMA "onejob_sbx"');
    const moveSequenceIndex = migrationRunner.query.mock.calls.findIndex(
      (call: [string, unknown[]?]) => call[0] === 'ALTER SEQUENCE "main"."orphan_sequence" SET SCHEMA "onejob_sbx"'
    );
    const moveUsersTableIndex = migrationRunner.query.mock.calls.findIndex(
      (call: [string, unknown[]?]) => call[0] === 'ALTER TABLE "main"."users" SET SCHEMA "onejob_sbx"'
    );
    const moveSequenceCall = migrationRunner.query.mock.invocationCallOrder[
      moveSequenceIndex
    ];
    const moveUsersTableCall = migrationRunner.query.mock.invocationCallOrder[
      moveUsersTableIndex
    ];
    expect(moveSequenceCall).toBeLessThan(moveUsersTableCall);
    expect(dataSource.synchronize).not.toHaveBeenCalled();
    expect(dataSource.runMigrations).not.toHaveBeenCalled();
    expect(ensureSchemaRunner.release).toHaveBeenCalledTimes(1);
    expect(migrationRunner.release).toHaveBeenCalledTimes(1);
  });

  it('fails fast when the same postgres object exists in both main and the configured schema', async () => {
    (adapter.getSchemaName as unknown as Mock).mockReturnValue('onejob_sbx');
    (adapter.getDatabaseType as unknown as Mock).mockReturnValue('postgres');

    const ensureSchemaRunner = {
      hasSchema: vi.fn().mockResolvedValue(true),
      createSchema: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };

    const migrationRunner = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes('information_schema.tables') && params?.[0] === 'main') {
          return [{ table_name: 'users' }];
        }
        if (sql.includes('information_schema.tables') && params?.[0] === 'onejob_sbx') {
          return [{ table_name: 'users' }];
        }
        if (sql.includes('pg_class')) {
          return [];
        }
        if (sql.includes('pg_type')) {
          return [];
        }
        return undefined;
      }),
      startTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      hasTable: vi.fn().mockResolvedValue(true),
      hasSchema: vi.fn().mockResolvedValue(true),
      createSchema: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };

    const dataSource = {
      createQueryRunner: vi
        .fn()
        .mockReturnValueOnce(ensureSchemaRunner)
        .mockReturnValueOnce(migrationRunner),
      getMetadata: vi.fn((entity: any) => ({ tablePath: `onejob_sbx.${String(entity.name).toLowerCase()}` })),
      synchronize: vi.fn().mockResolvedValue(undefined),
      showMigrations: vi.fn().mockResolvedValue(false),
      runMigrations: vi.fn().mockResolvedValue(undefined),
    };

    (getDataSource as unknown as Mock).mockResolvedValue(dataSource);

    await expect(runMigrations()).rejects.toThrow(
      'Detected conflicting objects in both "main" and "onejob_sbx" schemas (tables: users)'
    );

    expect(migrationRunner.startTransaction).not.toHaveBeenCalled();
    expect(migrationRunner.commitTransaction).not.toHaveBeenCalled();
    expect(migrationRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(dataSource.synchronize).not.toHaveBeenCalled();
    expect(dataSource.runMigrations).not.toHaveBeenCalled();
    expect(ensureSchemaRunner.release).toHaveBeenCalledTimes(1);
    expect(migrationRunner.release).toHaveBeenCalledTimes(1);
  });
});
