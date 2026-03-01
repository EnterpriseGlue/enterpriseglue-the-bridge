/**
 * Database-agnostic connection pool interface
 */
export interface ConnectionPool {
  query<T = unknown>(
    sql: string,
    params?: ReadonlyArray<unknown> | Record<string, unknown>
  ): Promise<{ rows: T[]; rowCount: number }>;
  close(): Promise<void>;
  getNativePool(): unknown;
}

export interface EnterpriseBackendContext {
  connectionPool: ConnectionPool;
  config: unknown;
}

export interface EnterpriseBackendPlugin {
  registerRoutes?: (app: unknown, ctx: EnterpriseBackendContext) => void | Promise<void>;
  migrateEnterpriseDatabase?: (ctx: EnterpriseBackendContext) => void | Promise<void>;
}
