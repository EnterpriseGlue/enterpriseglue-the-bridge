import { EventEmitter } from 'events';
import type { NotificationEvent } from './types.js';

class NotificationEventEmitter {
  private emitter = new EventEmitter();
  
  // Channel key format: "userId" or "userId:tenantId"
  subscribe(channelKey: string, handler: (event: NotificationEvent) => void): () => void {
    const eventName = `notification:${channelKey}`;
    this.emitter.on(eventName, handler);
    
    return () => {
      this.emitter.off(eventName, handler);
    };
  }
  
  emit(event: NotificationEvent): void {
    // Emit to user channel (OSS compatible)
    this.emitter.emit(`notification:${event.userId}`, event);
    
    // Emit to tenant-scoped channel (EE compatible)
    if (event.tenantId) {
      this.emitter.emit(`notification:${event.userId}:${event.tenantId}`, event);
    }
  }
  
  // For test cleanup
  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

// Production singleton
export const notificationEvents = new NotificationEventEmitter();

// Factory for tests
export function createNotificationEventEmitter(): NotificationEventEmitter {
  return new NotificationEventEmitter();
}
