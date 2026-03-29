/**
 * Infrastructure - Transport Layer
 * 
 * External transport adapters (SSE, Email, etc.)
 */

// SSE Transport (from notification SSE work)
export { NotificationSSEManager } from '../../../services/notifications/NotificationSSEManager.js';
export { notificationEvents, createNotificationEventEmitter } from '../../../services/notifications/events.js';
export { DefaultTenantResolver } from '../../../services/notifications/resolvers.js';
export type { 
  TenantResolver, 
  TenantContext, 
  NotificationEvent,
  NotificationPayload,
  MarkReadPayload,
  DeletePayload
} from '../../../services/notifications/types.js';
