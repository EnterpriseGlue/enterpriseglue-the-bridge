import { MoreThan } from 'typeorm';
import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { AuditLog } from '@enterpriseglue/shared/infrastructure/persistence/entities/AuditLog.js';

export interface AuditLogQuery {
  limit?: number;
  offset?: number;
  action?: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: unknown;
  createdAt: number;
}

class AuditQueryServiceImpl {
  async listLogs(query: AuditLogQuery): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const limitNum = query.limit || 100;
    const offsetNum = query.offset || 0;

    const dataSource = await getDataSource();
    const auditRepo = dataSource.getRepository(AuditLog);

    const qb = auditRepo.createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC')
      .skip(offsetNum)
      .take(limitNum);

    if (query.action) qb.andWhere('audit.action = :action', { action: query.action });
    if (query.userId) qb.andWhere('audit.userId = :userId', { userId: query.userId });
    if (query.resourceType) qb.andWhere('audit.resourceType = :resourceType', { resourceType: query.resourceType });
    if (query.resourceId) qb.andWhere('audit.resourceId = :resourceId', { resourceId: query.resourceId });

    const [result, total] = await qb.getManyAndCount();

    const logs = result.map((row) => ({
      id: row.id,
      tenantId: row.tenantId || null,
      tenantSlug: null,
      tenantName: null,
      userId: row.userId,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      details: row.details ? JSON.parse(row.details) : null,
      createdAt: row.createdAt,
    }));

    return { logs, total };
  }

  async getStats() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const dataSource = await getDataSource();
    const auditRepo = dataSource.getRepository(AuditLog);

    const total = await auditRepo.count();

    const byActionQb = auditRepo.createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(10);
    const byAction = await byActionQb.getRawMany();

    const byUserQb = auditRepo.createQueryBuilder('audit')
      .select('audit.userId', 'user_id')
      .addSelect('COUNT(*)', 'count')
      .where('audit.userId IS NOT NULL')
      .groupBy('audit.userId')
      .orderBy('count', 'DESC')
      .limit(10);
    const byUser = await byUserQb.getRawMany();

    const last24Hours = await auditRepo.count({
      where: { createdAt: MoreThan(oneDayAgo) },
    });

    const failedLogins = await auditRepo.count({
      where: { action: 'auth.login.failed', createdAt: MoreThan(oneDayAgo) },
    });

    return { total, last24Hours, failedLogins, byAction, byUser };
  }

  async getDistinctActions(): Promise<string[]> {
    const dataSource = await getDataSource();
    const auditRepo = dataSource.getRepository(AuditLog);

    const qb = auditRepo.createQueryBuilder('audit')
      .select('DISTINCT audit.action', 'action')
      .orderBy('audit.action', 'ASC');

    const result = await qb.getRawMany();
    return result.map((row: any) => row.action);
  }
}

export const auditQueryService = new AuditQueryServiceImpl();
