import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNotificationEventEmitter } from '@enterpriseglue/shared/services/notifications/events.js';
import type { NotificationEvent } from '@enterpriseglue/shared/services/notifications/types.js';

describe('NotificationEventEmitter', () => {
  it('isolates channels by key', () => {
    const emitter = createNotificationEventEmitter();
    const userHandler = vi.fn();
    const tenantHandler = vi.fn();
    
    emitter.subscribe('user-1', userHandler);
    emitter.subscribe('user-1:tenant-1', tenantHandler);
    
    emitter.emit({ 
      id: '1', 
      userId: 'user-1', 
      tenantId: null, 
      type: 'notification', 
      payload: {}, 
      timestamp: Date.now() 
    });
    
    expect(userHandler).toHaveBeenCalledTimes(1);
    expect(tenantHandler).not.toHaveBeenCalled();
  });
  
  it('emits to both user and tenant channels when tenantId present', () => {
    const emitter = createNotificationEventEmitter();
    const userHandler = vi.fn();
    const tenantHandler = vi.fn();
    
    emitter.subscribe('user-1', userHandler);
    emitter.subscribe('user-1:tenant-1', tenantHandler);
    
    emitter.emit({ 
      id: '1', 
      userId: 'user-1', 
      tenantId: 'tenant-1', 
      type: 'notification', 
      payload: {}, 
      timestamp: Date.now() 
    });
    
    expect(userHandler).toHaveBeenCalledTimes(1);
    expect(tenantHandler).toHaveBeenCalledTimes(1);
  });
  
  it('cleans up on unsubscribe', () => {
    const emitter = createNotificationEventEmitter();
    const handler = vi.fn();
    const unsubscribe = emitter.subscribe('user-1', handler);
    
    unsubscribe();
    emitter.emit({ 
      id: '1', 
      userId: 'user-1', 
      tenantId: null, 
      type: 'notification', 
      payload: {}, 
      timestamp: Date.now() 
    });
    
    expect(handler).not.toHaveBeenCalled();
  });
  
  it('removeAllListeners clears all handlers', () => {
    const emitter = createNotificationEventEmitter();
    const handler = vi.fn();
    emitter.subscribe('user-1', handler);
    
    emitter.removeAllListeners();
    emitter.emit({ 
      id: '1', 
      userId: 'user-1', 
      tenantId: null, 
      type: 'notification', 
      payload: {}, 
      timestamp: Date.now() 
    });
    
    expect(handler).not.toHaveBeenCalled();
  });
});
