/**
 * Application Layer
 * 
 * Use cases and service orchestration.
 * Coordinates between domain logic and infrastructure adapters.
 * 
 * Note: During migration, services remain in their legacy locations.
 * This file will be populated as services are refactored to Clean Architecture.
 */

// Domain types available for application services
export type * from '../domain/index.js';

// Legacy service exports (to be migrated incrementally)
// These remain in services/ during the transition period
export { notificationService } from '../services/notifications/NotificationService.js';
export { notificationEvents, createNotificationSSEManager } from '../services/notifications/index.js';
export type { 
  NotificationListOptions,
  CreateNotificationInput,
} from '../services/notifications/NotificationService.js';
