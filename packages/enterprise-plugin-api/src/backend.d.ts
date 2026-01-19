/**
 * Database-agnostic connection pool interface
 */
export interface ConnectionPool {
  query<T = any>(sql: string, params?: any[] | Record<string, any>): Promise<{ rows: T[]; rowCount: number }>;
  close(): Promise<void>;
  getNativePool(): any;
}

export interface EnterpriseBackendContext {
  connectionPool: ConnectionPool;
  config: unknown;
}

export interface EnterpriseBackendPlugin {
  registerRoutes?: (app: unknown, ctx: EnterpriseBackendContext) => void | Promise<void>;
  migrateEnterpriseDatabase?: (ctx: EnterpriseBackendContext) => void | Promise<void>;
}
