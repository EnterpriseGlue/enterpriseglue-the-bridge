export interface TestConfig {
  nodeEnv: 'test';
  frontendUrl: string;
  jwtSecret: string;
  jwtAccessTokenExpires: number;
  jwtRefreshTokenExpires: number;
  encryptionKey: string;
  postgresHost: string;
  postgresPort: number;
  postgresUser: string;
  postgresPassword: string;
  postgresDatabase: string;
  postgresSchema: string;
  postgresSsl: boolean;
  postgresSslRejectUnauthorized: boolean;
  port: number;
  trustProxy: string;
  databaseType: 'postgres';
  multiTenant: boolean;
}

export const defaultTestConfig: TestConfig = {
  nodeEnv: 'test',
  frontendUrl: 'http://localhost:5173',
  jwtSecret: 'test-secret-test-secret-test-secret-1234',
  jwtAccessTokenExpires: 900,
  jwtRefreshTokenExpires: 604800,
  encryptionKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  postgresHost: '127.0.0.1',
  postgresPort: 5432,
  postgresUser: 'postgres',
  postgresPassword: 'postgres',
  postgresDatabase: 'postgres',
  postgresSchema: 'main',
  postgresSsl: false,
  postgresSslRejectUnauthorized: false,
  port: 8787,
  trustProxy: '1',
  databaseType: 'postgres',
  multiTenant: false,
};

function envBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  return value === 'true';
}

export function createTestConfig(overrides: Partial<TestConfig> = {}): TestConfig {
  return {
    ...defaultTestConfig,
    frontendUrl: process.env.FRONTEND_URL || defaultTestConfig.frontendUrl,
    jwtSecret: process.env.JWT_SECRET || defaultTestConfig.jwtSecret,
    jwtAccessTokenExpires: process.env.JWT_ACCESS_TOKEN_EXPIRES
      ? Number(process.env.JWT_ACCESS_TOKEN_EXPIRES)
      : defaultTestConfig.jwtAccessTokenExpires,
    jwtRefreshTokenExpires: process.env.JWT_REFRESH_TOKEN_EXPIRES
      ? Number(process.env.JWT_REFRESH_TOKEN_EXPIRES)
      : defaultTestConfig.jwtRefreshTokenExpires,
    encryptionKey: process.env.ENCRYPTION_KEY || defaultTestConfig.encryptionKey,
    postgresHost: process.env.POSTGRES_HOST || defaultTestConfig.postgresHost,
    postgresPort: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : defaultTestConfig.postgresPort,
    postgresUser: process.env.POSTGRES_USER || defaultTestConfig.postgresUser,
    postgresPassword: process.env.POSTGRES_PASSWORD || defaultTestConfig.postgresPassword,
    postgresDatabase: process.env.POSTGRES_DATABASE || defaultTestConfig.postgresDatabase,
    postgresSchema: process.env.POSTGRES_SCHEMA || defaultTestConfig.postgresSchema,
    postgresSsl: envBoolean(process.env.POSTGRES_SSL, defaultTestConfig.postgresSsl),
    postgresSslRejectUnauthorized: envBoolean(
      process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED,
      defaultTestConfig.postgresSslRejectUnauthorized
    ),
    port: process.env.API_PORT ? Number(process.env.API_PORT) : defaultTestConfig.port,
    trustProxy: process.env.TRUST_PROXY || defaultTestConfig.trustProxy,
    databaseType: process.env.DATABASE_TYPE === 'postgres' ? 'postgres' : defaultTestConfig.databaseType,
    multiTenant: envBoolean(process.env.MULTI_TENANT, defaultTestConfig.multiTenant),
    ...overrides,
  };
}
