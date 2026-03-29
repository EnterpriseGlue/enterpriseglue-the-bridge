import { IsNull } from 'typeorm';
import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { Notification } from '@enterpriseglue/shared/db/entities/Notification.js';
import { notificationEvents } from './events.js';
import type { NotificationEvent } from './types.js';
import { isFeatureEnabled } from '@enterpriseglue/shared/config/features.js';

export interface NotificationListOptions {
  userId: string;
  tenantId: string | null;
  limit: number;
  offset: number;
  unreadOnly?: boolean;
  states?: string[];
}

export interface NotificationListResult {
  notifications: Array<{
    id: string;
    userId: string;
    tenantId: string | null;
    state: string;
    title: string;
    subtitle: string | null;
    readAt: number | null;
    createdAt: number;
  }>;
  total: number;
  unreadCount: number;
}

export interface CreateNotificationInput {
  userId: string;
  tenantId: string | null;
  state: 'success' | 'info' | 'warning' | 'error';
  title: string;
  subtitle?: string | null;
}

export interface NotificationUpdatedResult {
  updated: number;
}

export interface NotificationDeletedResult {
  deleted: number;
}

class NotificationService {
  /** Purge notifications older than 5 days, then return a paginated list. */
  async list(options: NotificationListOptions): Promise<NotificationListResult> {
    const { userId, tenantId, limit, offset, unreadOnly, states } = options;
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(Notification);

    // Auto-purge stale notifications
    const cutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
    await repo.createQueryBuilder()
      .delete()
      .where('createdAt < :cutoff', { cutoff })
      .execute();

    const qb = repo.createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (tenantId) {
      qb.andWhere('n.tenantId = :tenantId', { tenantId });
    }
    if (states && states.length > 0) {
      qb.andWhere('n.state IN (:...states)', { states });
    }
    if (unreadOnly) {
      qb.andWhere('n.readAt IS NULL');
    }

    const [rows, total] = await qb.getManyAndCount();

    const unreadCount = await repo.count({
      where: {
        userId,
        ...(tenantId ? { tenantId } : {}),
        readAt: IsNull(),
      },
    });

    return {
      notifications: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        tenantId: row.tenantId,
        state: row.state,
        title: row.title,
        subtitle: row.subtitle,
        readAt: row.readAt,
        createdAt: row.createdAt,
      })),
      total,
      unreadCount,
    };
  }

  async create(input: CreateNotificationInput) {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(Notification);
    const now = Date.now();

    const notification = repo.create({
      userId: input.userId,
      tenantId: input.tenantId,
      state: input.state,
      title: input.title,
      subtitle: input.subtitle ?? null,
      readAt: null,
      createdAt: now,
    });

    const saved = await repo.save(notification);

    // Emit SSE event (safely - feature flag protected)
    if (isFeatureEnabled('sseNotifications') && notificationEvents) {
      const event: NotificationEvent = {
        id: saved.id,
        type: 'notification',
        userId: saved.userId,
        tenantId: saved.tenantId,
        payload: {
          id: saved.id,
          state: saved.state,
          title: saved.title,
          subtitle: saved.subtitle,
          createdAt: saved.createdAt,
        },
        timestamp: Date.now(),
      };
      notificationEvents.emit(event);
    }

    return {
      id: saved.id,
      userId: saved.userId,
      tenantId: saved.tenantId,
      state: saved.state,
      title: saved.title,
      subtitle: saved.subtitle,
      readAt: saved.readAt,
      createdAt: saved.createdAt,
    };
  }

  async markRead(userId: string, tenantId: string | null, ids?: string[]): Promise<NotificationUpdatedResult> {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(Notification);
    const now = Date.now();

    const qb = repo.createQueryBuilder()
      .update(Notification)
      .set({ readAt: now })
      .where('userId = :userId', { userId });

    if (tenantId) {
      qb.andWhere('tenantId = :tenantId', { tenantId });
    }
    if (ids && ids.length > 0) {
      qb.andWhere('id IN (:...ids)', { ids });
    }

    const result = await qb.execute();

    // Emit SSE event (safely - feature flag protected)
    if (isFeatureEnabled('sseNotifications') && notificationEvents && result.affected && result.affected > 0) {
      const event: NotificationEvent = {
        id: `ack-${Date.now()}`,
        type: 'mark-read',
        userId,
        tenantId,
        payload: { ids, updated: result.affected },
        timestamp: Date.now(),
      };
      notificationEvents.emit(event);
    }

    return { updated: result.affected || 0 };
  }

  async deleteAll(userId: string, tenantId: string | null): Promise<NotificationDeletedResult> {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(Notification);

    const qb = repo.createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId });

    if (tenantId) {
      qb.andWhere('tenantId = :tenantId', { tenantId });
    }

    const result = await qb.execute();
    return { deleted: result.affected || 0 };
  }

  async deleteOne(id: string, userId: string, tenantId: string | null): Promise<NotificationDeletedResult> {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(Notification);

    const qb = repo.createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .andWhere('userId = :userId', { userId });

    if (tenantId) {
      qb.andWhere('tenantId = :tenantId', { tenantId });
    }

    const result = await qb.execute();
    return { deleted: result.affected || 0 };
  }
}

export const notificationService = new NotificationService();
