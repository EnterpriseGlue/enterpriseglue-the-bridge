/**
 * Notification Domain Models
 * 
 * Pure domain types with no external dependencies.
 */

export type NotificationState = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  userId: string;
  tenantId: string | null;
  state: NotificationState;
  title: string;
  subtitle: string | null;
  readAt: number | null;
  createdAt: number;
}

export interface NotificationList {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface CreateNotificationRequest {
  userId: string;
  tenantId: string | null;
  state: NotificationState;
  title: string;
  subtitle?: string | null;
}

export interface MarkReadRequest {
  ids?: string[];
  markAll?: boolean;
}

export interface NotificationEvent {
  id: string;
  type: 'notification' | 'mark-read' | 'delete' | 'connected';
  userId: string;
  tenantId: string | null;
  payload: unknown;
  timestamp: number;
}

export interface NotificationStreamConnection {
  userId: string;
  tenantId: string | null;
  connectedAt: number;
  lastEventId?: string;
}
