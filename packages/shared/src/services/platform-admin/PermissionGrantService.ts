import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { PermissionGrant } from '@enterpriseglue/shared/db/entities/PermissionGrant.js';
import { generateId } from '@enterpriseglue/shared/utils/id.js';

class PermissionGrantServiceImpl {
  async setProjectDeployAllowed(projectId: string, userId: string, allowed: boolean, grantedById: string): Promise<void> {
    const dataSource = await getDataSource();
    const grantRepo = dataSource.getRepository(PermissionGrant);
    const now = Date.now();

    if (allowed) {
      await grantRepo.createQueryBuilder()
        .insert()
        .values({
          id: generateId(),
          userId,
          permission: 'project:deploy',
          resourceType: 'project',
          resourceId: projectId,
          grantedById,
          createdAt: now,
        })
        .orIgnore()
        .execute();
      return;
    }

    await grantRepo.createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('permission IN (:...perms)', { perms: ['project:deploy', 'project.deploy'] })
      .andWhere('resourceType = :resourceType', { resourceType: 'project' })
      .andWhere('resourceId = :resourceId', { resourceId: projectId })
      .execute();
  }

  async listProjectDeployGrantedUserIds(projectId: string, userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const dataSource = await getDataSource();
    const grantRepo = dataSource.getRepository(PermissionGrant);
    const rows = await grantRepo.createQueryBuilder('pg')
      .select(['pg.userId'])
      .where('pg.userId IN (:...userIds)', { userIds })
      .andWhere('pg.permission IN (:...perms)', { perms: ['project:deploy', 'project.deploy'] })
      .andWhere('pg.resourceType = :resourceType', { resourceType: 'project' })
      .andWhere('pg.resourceId = :resourceId', { resourceId: projectId })
      .getMany();

    return rows.map((row) => String(row.userId));
  }
}

export const permissionGrantService = new PermissionGrantServiceImpl();
