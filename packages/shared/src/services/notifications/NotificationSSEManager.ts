import type { Request, Response } from 'express';
import { notificationEvents } from './events.js';
import type { TenantResolver, NotificationEvent, SSEManagerOptions } from './types.js';
import { logger } from '@enterpriseglue/shared/utils/logger.js';

const DEFAULT_OPTIONS: SSEManagerOptions = {
  maxConnectionsPerUser: 5,
  keepaliveIntervalMs: 30000,
};

export class NotificationSSEManager {
  private connections = new Map<string, Set<Response>>();
  
  constructor(
    private tenantResolver: TenantResolver,
    private options: SSEManagerOptions = DEFAULT_OPTIONS
  ) {}
  
  handleConnection(req: Request, res: Response): void {
    // Resolve tenant context using injected strategy
    const { userId, tenantId } = this.tenantResolver.resolve({
      req,
      user: req.user,
      query: req.query as Record<string, string>
    });
    
    // SSE headers (reuse from locks.ts pattern)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    
    // Send initial connection confirmation
    res.write(': connected\n\n');
    res.write(`data: ${JSON.stringify({ type: 'connected', userId, tenantId, timestamp: Date.now() })}\n\n`);
    
    // Determine channel key
    const channelKey = tenantId ? `${userId}:${tenantId}` : userId;
    
    // Define event handler
    const eventHandler = (event: NotificationEvent) => {
      try {
        res.write(`id: ${event.id}\n`);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        // Force flush through any proxy/compression buffering
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      } catch (err) {
        // Connection broken, cleanup will handle it
        logger.warn('Failed to write SSE event, connection likely closed', { userId, error: err });
      }
    };
    
    // Subscribe FIRST (mitigation for race condition)
    const unsubscribe = notificationEvents.subscribe(channelKey, eventHandler);
    
    // THEN register connection and enforce limit
    if (!this.connections.has(channelKey)) {
      this.connections.set(channelKey, new Set());
    }
    
    const userConnections = this.connections.get(channelKey)!;
    
    // Enforce connection limit - remove oldest if exceeded
    if (userConnections.size >= this.options.maxConnectionsPerUser) {
      const oldest = userConnections.values().next().value as Response;
      if (oldest) {
        try {
          oldest.end();
        } catch {
          // Already closed
        }
        userConnections.delete(oldest);
        logger.info('Closed oldest SSE connection due to limit', { userId, tenantId });
      }
    }
    
    userConnections.add(res);
    
    logger.info('SSE connection established', { userId, tenantId, channelKey, connections: userConnections.size });
    
    // Keepalive (reuse pattern from locks.ts)
    const keepalive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
        // Force flush
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      } catch {
        clearInterval(keepalive);
      }
    }, this.options.keepaliveIntervalMs);
    
    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(keepalive);
      unsubscribe();
      this.connections.get(channelKey)?.delete(res);
      if (this.connections.get(channelKey)?.size === 0) {
        this.connections.delete(channelKey);
      }
      logger.info('SSE connection closed', { userId, tenantId, channelKey });
    });
  }
  
  getMetrics(): { totalConnections: number; channels: number } {
    const totalConnections = Array.from(this.connections.values())
      .reduce((sum, set) => sum + set.size, 0);
    return {
      totalConnections,
      channels: this.connections.size,
    };
  }
}
