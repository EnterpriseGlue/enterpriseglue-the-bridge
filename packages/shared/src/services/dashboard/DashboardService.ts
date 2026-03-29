import { In } from 'typeorm';
import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { ProjectMember } from '@enterpriseglue/shared/infrastructure/persistence/entities/ProjectMember.js';
import { Project } from '@enterpriseglue/shared/infrastructure/persistence/entities/Project.js';
import { File } from '@enterpriseglue/shared/infrastructure/persistence/entities/File.js';
import { Engine } from '@enterpriseglue/shared/infrastructure/persistence/entities/Engine.js';
import { EngineMember } from '@enterpriseglue/shared/infrastructure/persistence/entities/EngineMember.js';

export interface DashboardStats {
  totalProjects: number;
  totalFiles: number;
  fileTypes: { bpmn: number; dmn: number; form: number };
}

export interface DashboardContext {
  isPlatformAdmin: boolean;
  ownedEngineIds: string[];
  delegatedEngineIds: string[];
  accessibleEngineIds: string[];
  projectMemberships: Array<{
    projectId: string;
    projectName: string;
    role: 'owner' | 'delegate' | 'contributor' | 'viewer';
  }>;
  canViewActiveUsers: boolean;
  canViewAllProjects: boolean;
  canViewEngines: boolean;
  canViewProcessData: boolean;
  canViewDeployments: boolean;
  canViewMetrics: boolean;
}

class DashboardService {
  async getStats(userId: string): Promise<DashboardStats> {
    const dataSource = await getDataSource();
    const projectMemberRepo = dataSource.getRepository(ProjectMember);
    const fileRepo = dataSource.getRepository(File);

    const memberProjects = await projectMemberRepo.find({
      where: { userId },
      select: ['projectId'],
    });

    const projectIds = memberProjects.map((p) => p.projectId);
    const totalProjects = projectIds.length;

    if (projectIds.length === 0) {
      return { totalProjects: 0, totalFiles: 0, fileTypes: { bpmn: 0, dmn: 0, form: 0 } };
    }

    const filesResult = await fileRepo.createQueryBuilder('f')
      .select('f.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('f.projectId IN (:...projectIds)', { projectIds })
      .groupBy('f.type')
      .getRawMany();

    let totalFiles = 0;
    let bpmnCount = 0;
    let dmnCount = 0;
    let formCount = 0;

    for (const row of filesResult) {
      const type = String(row.type).toLowerCase();
      const fileCount = Number(row.count || 0);
      totalFiles += fileCount;

      if (type === 'bpmn') bpmnCount = fileCount;
      else if (type === 'dmn') dmnCount = fileCount;
      else if (type === 'form') formCount = fileCount;
    }

    return { totalProjects, totalFiles, fileTypes: { bpmn: bpmnCount, dmn: dmnCount, form: formCount } };
  }

  async getContext(userId: string, isAdmin: boolean): Promise<DashboardContext> {
    const dataSource = await getDataSource();
    const engineRepo = dataSource.getRepository(Engine);
    const engineMemberRepo = dataSource.getRepository(EngineMember);
    const projectMemberRepo = dataSource.getRepository(ProjectMember);
    const projectRepo = dataSource.getRepository(Project);

    // Get engines where user is owner
    const ownedEngines = await engineRepo.find({ where: { ownerId: userId }, select: ['id'] });
    const ownedEngineIds = ownedEngines.map((e) => e.id);

    // Get engines where user is delegate
    const delegatedEngines = await engineRepo.find({ where: { delegateId: userId }, select: ['id'] });
    const delegatedEngineIds = delegatedEngines.map((e) => e.id);

    // Get engines where user is member
    const engineMemberRows = await engineMemberRepo.find({ where: { userId }, select: ['engineId', 'role'] });
    const memberEngineIds = engineMemberRows.map((m) => m.engineId);
    const accessibleEngineIds = [...new Set([...ownedEngineIds, ...delegatedEngineIds, ...memberEngineIds])];

    // Get project memberships
    const projectMemberRows = await projectMemberRepo.find({ where: { userId }, select: ['projectId', 'role'] });
    const projectIds = projectMemberRows.map((p) => p.projectId);

    let projectNameMap = new Map<string, string>();
    if (projectIds.length > 0) {
      const projectRows = await projectRepo.find({ where: { id: In(projectIds) }, select: ['id', 'name'] });
      for (const p of projectRows) {
        projectNameMap.set(p.id, p.name);
      }
    }

    const projectMemberships = projectMemberRows.map((p) => ({
      projectId: p.projectId,
      projectName: projectNameMap.get(p.projectId) || 'Unknown',
      role: p.role as 'owner' | 'delegate' | 'contributor' | 'viewer',
    }));

    // Compute visibility flags
    const isEngineOperator = engineMemberRows.some((m) => m.role === 'operator');
    const isEngineOwnerOrDelegateOrOperator = ownedEngineIds.length > 0 || delegatedEngineIds.length > 0 || isEngineOperator;
    const hasProjectMemberships = projectMemberships.length > 0;

    return {
      isPlatformAdmin: isAdmin,
      ownedEngineIds,
      delegatedEngineIds,
      accessibleEngineIds,
      projectMemberships,
      canViewActiveUsers: isAdmin,
      canViewAllProjects: isAdmin,
      canViewEngines: isEngineOwnerOrDelegateOrOperator,
      canViewProcessData: isEngineOwnerOrDelegateOrOperator,
      canViewDeployments: isEngineOwnerOrDelegateOrOperator || hasProjectMemberships,
      canViewMetrics: isEngineOwnerOrDelegateOrOperator,
    };
  }
}

export const dashboardService = new DashboardService();
