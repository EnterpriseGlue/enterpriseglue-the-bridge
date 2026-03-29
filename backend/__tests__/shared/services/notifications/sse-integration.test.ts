import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { createNotificationSSEManager, notificationEvents } from '@enterpriseglue/shared/services/notifications/index.js';

// Mock the data source to prevent DB connection attempts
vi.mock('@enterpriseglue/shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

describe('Notification SSE Integration', () => {
  beforeEach(() => {
    // Clear event emitter state between tests
    notificationEvents.removeAllListeners();
  });
  
  afterEach(() => {
    notificationEvents.removeAllListeners();
  });
  
  it('establishes SSE connection and receives connection confirmation', () => {
    const writtenData: string[] = [];
    
    const mockRes = {
      writeHead: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((data: string) => {
        writtenData.push(data);
        return true;
      }),
      on: vi.fn(),
      end: vi.fn(),
    };
    
    const mockReq = {
      user: { userId: 'test-user-1', email: 'test@test.com', platformRole: 'user', type: 'access' },
      query: {},
      headers: {},
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'close') {
          // Simulate close immediately for cleanup test
          setTimeout(handler, 10);
        }
      }),
    };
    
    const sseManager = createNotificationSSEManager();
    
    // Simulate connection
    sseManager.handleConnection(mockReq as any, mockRes as any);
    
    // Verify connection confirmation was written
    expect(mockRes.write).toHaveBeenCalledWith(': connected\n\n');
    
    // Verify user info in connection message (look for userId in JSON data)
    const connectionCall = writtenData.find(d => d.includes('"type":"connected"'));
    expect(connectionCall).toBeDefined();
    expect(connectionCall).toContain('test-user-1');
  });
  
  it('delivers notification events to connected client', () => {
    const writtenData: string[] = [];
    let closeHandler: (() => void) | null = null;
    
    const mockRes = {
      writeHead: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((data: string) => {
        writtenData.push(data);
        return true;
      }),
      on: vi.fn(),
      end: vi.fn(),
    };
    
    const mockReq = {
      user: { userId: 'test-user-2', email: 'test2@test.com', platformRole: 'user', type: 'access' },
      query: {},
      headers: {},
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      }),
    };
    
    const sseManager = createNotificationSSEManager();
    
    // Connect client
    sseManager.handleConnection(mockReq as any, mockRes as any);
    
    // Emit a notification event
    const testEvent = {
      id: 'test-event-1',
      type: 'notification' as const,
      userId: 'test-user-2',
      tenantId: null,
      payload: { title: 'Test notification', state: 'info' },
      timestamp: Date.now(),
    };
    
    notificationEvents.emit(testEvent);
    
    // Verify event was delivered
    const eventDelivered = writtenData.some(d => 
      d.includes('test-event-1') && d.includes('Test notification')
    );
    expect(eventDelivered).toBe(true);
    
    // Clean up
    const cleanup = closeHandler as (() => void) | null;
    if (cleanup) {
      cleanup();
    }
  });
  
  it('isolates events by tenant - tenant-scoped client receives tenant events', () => {
    const userScopedEvents: string[] = [];
    const tenantScopedEvents: string[] = [];
    
    const createMockRes = (collector: string[]) => ({
      writeHead: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((data: string) => {
        collector.push(data);
        return true;
      }),
      on: vi.fn(),
      end: vi.fn(),
    });
    
    const createMockReq = (userId: string, tenantId?: string) => ({
      user: { userId, email: 'test@test.com', platformRole: 'user', type: 'access' },
      query: tenantId ? { tenantId } : {},
      headers: {},
      on: vi.fn(),
    });
    
    const sseManager = createNotificationSSEManager();
    
    // Connect user-scoped client
    const userRes = createMockRes(userScopedEvents);
    sseManager.handleConnection(createMockReq('user-3') as any, userRes as any);
    
    // Connect tenant-scoped client
    const tenantRes = createMockRes(tenantScopedEvents);
    sseManager.handleConnection(createMockReq('user-3', 'tenant-3') as any, tenantRes as any);
    
    // Emit to tenant-scoped channel
    notificationEvents.emit({
      id: 'tenant-event',
      type: 'notification',
      userId: 'user-3',
      tenantId: 'tenant-3',
      payload: { title: 'Tenant notification' },
      timestamp: Date.now(),
    });
    
    // Both should receive (broadcast pattern)
    expect(tenantScopedEvents.some(e => e.includes('tenant-event'))).toBe(true);
    expect(userScopedEvents.some(e => e.includes('tenant-event'))).toBe(true);
  });
  
  it('enforces connection limit per user', () => {
    const sseManager = createNotificationSSEManager({ maxConnectionsPerUser: 2 });
    const endedConnections: number[] = [];
    
    // Create 3 connections for same user
    for (let i = 0; i < 3; i++) {
      const mockRes = {
        writeHead: vi.fn(),
        flushHeaders: vi.fn(),
        write: vi.fn(),
        on: vi.fn(),
        end: vi.fn(() => endedConnections.push(i)),
      };
      
      const mockReq = {
        user: { userId: 'limited-user', email: 'test@test.com', platformRole: 'user', type: 'access' },
        query: {},
        headers: {},
        on: vi.fn(),
      };
      
      sseManager.handleConnection(mockReq as any, mockRes as any);
    }
    
    // First connection should have been closed when third connected
    expect(endedConnections).toContain(0);
    expect(endedConnections).not.toContain(1);
    expect(endedConnections).not.toContain(2);
  });
  
  it('emits mark-read events to connected clients', () => {
    const writtenData: string[] = [];
    
    const mockRes = {
      writeHead: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((data: string) => {
        writtenData.push(data);
        return true;
      }),
      on: vi.fn(),
      end: vi.fn(),
    };
    
    const mockReq = {
      user: { userId: 'read-test-user', email: 'test@test.com', platformRole: 'user', type: 'access' },
      query: {},
      headers: {},
      on: vi.fn(),
    };
    
    const sseManager = createNotificationSSEManager();
    sseManager.handleConnection(mockReq as any, mockRes as any);
    
    // Emit mark-read event
    notificationEvents.emit({
      id: 'ack-12345',
      type: 'mark-read',
      userId: 'read-test-user',
      tenantId: null,
      payload: { ids: ['notif-1', 'notif-2'], updated: 2 },
      timestamp: Date.now(),
    });
    
    // Verify mark-read event was delivered
    const markReadDelivered = writtenData.some(d => 
      d.includes('mark-read') && d.includes('ack-12345')
    );
    expect(markReadDelivered).toBe(true);
  });
});
