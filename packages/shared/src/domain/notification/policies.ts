/**
 * Notification Domain Policies
 * 
 * Pure functions for notification business logic.
 */

import type { Notification, NotificationState, CreateNotificationRequest } from './models.js';

/**
 * Validate a notification creation request
 */
export function validateCreateRequest(request: CreateNotificationRequest): boolean {
  // User ID required
  if (!request.userId || request.userId.length === 0) {
    return false;
  }
  
  // Title required and within limits
  if (!request.title || request.title.length === 0) {
    return false;
  }
  
  if (request.title.length > 200) {
    return false;
  }
  
  // Valid state
  const validStates: NotificationState[] = ['success', 'info', 'warning', 'error'];
  if (!validStates.includes(request.state)) {
    return false;
  }
  
  // Subtitle within limits if provided
  if (request.subtitle && request.subtitle.length > 500) {
    return false;
  }
  
  return true;
}

/**
 * Check if a notification is unread
 */
export function isUnread(notification: Notification): boolean {
  return notification.readAt === null;
}

/**
 * Mark a notification as read (returns new notification object)
 */
export function markAsRead(
  notification: Notification, 
  readAt: number = Date.now()
): Notification {
  return {
    ...notification,
    readAt,
  };
}

/**
 * Filter notifications by read status
 */
export function filterByReadStatus(
  notifications: Notification[], 
  unreadOnly: boolean
): Notification[] {
  if (!unreadOnly) {
    return notifications;
  }
  
  return notifications.filter(isUnread);
}

/**
 * Filter notifications by state
 */
export function filterByState(
  notifications: Notification[],
  states: NotificationState[]
): Notification[] {
  if (states.length === 0) {
    return notifications;
  }
  
  return notifications.filter(n => states.includes(n.state));
}

/**
 * Sort notifications by creation date (newest first)
 */
export function sortByDate(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Paginate a list of notifications
 */
export function paginate(
  notifications: Notification[],
  offset: number,
  limit: number
): Notification[] {
  return notifications.slice(offset, offset + limit);
}

/**
 * Count unread notifications
 */
export function countUnread(notifications: Notification[]): number {
  return notifications.filter(isUnread).length;
}

/**
 * Check if notification is stale (older than threshold)
 */
export function isStale(
  notification: Notification,
  maxAgeMs: number = 5 * 24 * 60 * 60 * 1000 // 5 days
): boolean {
  const now = Date.now();
  return now - notification.createdAt > maxAgeMs;
}

/**
 * Get notifications to purge (stale and read)
 */
export function getNotificationsToPurge(
  notifications: Notification[],
  maxAgeMs?: number
): Notification[] {
  return notifications.filter(
    n => !isUnread(n) && isStale(n, maxAgeMs)
  );
}

/**
 * Validate notification ID list for batch operations
 */
export function validateNotificationIds(ids: string[]): boolean {
  if (!Array.isArray(ids)) {
    return false;
  }
  
  if (ids.length === 0) {
    return false;
  }
  
  // All IDs should be non-empty strings
  return ids.every(id => typeof id === 'string' && id.length > 0);
}

/**
 * Determine if a user can access a notification
 */
export function canAccessNotification(
  notification: Notification,
  userId: string,
  tenantId: string | null
): boolean {
  // Must match user
  if (notification.userId !== userId) {
    return false;
  }
  
  // If notification has tenant, must match (or user must be in that tenant)
  if (notification.tenantId !== null && notification.tenantId !== tenantId) {
    return false;
  }
  
  return true;
}

/**
 * Create a notification summary for display
 */
export function createSummary(notifications: Notification[]): string {
  const unread = countUnread(notifications);
  const total = notifications.length;
  
  if (unread === 0) {
    return `No new notifications (${total} total)`;
  }
  
  if (unread === 1) {
    return '1 new notification';
  }
  
  return `${unread} new notifications`;
}
