import { NotificationSSEManager } from './NotificationSSEManager.js';
import { DefaultTenantResolver } from './resolvers.js';
import { notificationEvents, createNotificationEventEmitter } from './events.js';
import type { TenantResolver, SSEManagerOptions, CreateSSEManagerOptions } from './types.js';

export function createNotificationSSEManager(
  options: CreateSSEManagerOptions = {}
): NotificationSSEManager {
  const resolver = options.tenantResolver ?? new DefaultTenantResolver();
  const managerOptions: SSEManagerOptions = {
    maxConnectionsPerUser: options.maxConnectionsPerUser ?? 5,
    keepaliveIntervalMs: options.keepaliveIntervalMs ?? 30000,
  };
  
  return new NotificationSSEManager(resolver, managerOptions);
}

// Re-export for EE wiring
export { NotificationSSEManager } from './NotificationSSEManager.js';
export { notificationEvents, createNotificationEventEmitter } from './events.js';
export { DefaultTenantResolver } from './resolvers.js';
export type { 
  TenantResolver, 
  TenantContext, 
  NotificationEvent,
  NotificationPayload,
  MarkReadPayload,
  DeletePayload,
  SSEManagerOptions,
  CreateSSEManagerOptions
} from './types.js';
