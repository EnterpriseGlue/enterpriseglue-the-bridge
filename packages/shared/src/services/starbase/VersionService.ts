import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { Version } from '@enterpriseglue/shared/db/entities/Version.js';
import { File } from '@enterpriseglue/shared/db/entities/File.js';
import { Errors } from '@enterpriseglue/shared/middleware/errorHandler.js';
import { generateId, unixTimestamp, unixTimestampMs } from '@enterpriseglue/shared/utils/id.js';
import { toQueryNumber, toQueryString } from './query-normalization.js';

export interface VersionResult {
  id: string;
  fileId?: string;
  author: string;
  message: string;
  xml?: string;
  createdAt: number;
}

export interface CreateVersionInput {
  fileId: string;
  userId: string;
  message?: string;
}

function toVersionListItem(row: Pick<Version, 'id' | 'author' | 'message' | 'createdAt'>): VersionResult {
  return {
    id: row.id,
    author: row.author || 'unknown',
    message: row.message || '',
    createdAt: toQueryNumber(row.createdAt),
  };
}

function toVersionDetail(row: Pick<Version, 'id' | 'fileId' | 'author' | 'message' | 'xml' | 'createdAt'>): VersionResult & { xml: string } {
  return {
    id: row.id,
    fileId: row.fileId,
    author: row.author || 'unknown',
    message: row.message || '',
    xml: row.xml,
    createdAt: toQueryNumber(row.createdAt),
  };
}

class VersionServiceImpl {
  /**
   * List versions for a file (seeds an initial version if none exist)
   */
  async listByFile(fileId: string): Promise<VersionResult[]> {
    const dataSource = await getDataSource();
    const versionRepo = dataSource.getRepository(Version);
    const fileRepo = dataSource.getRepository(File);

    const versionCount = await versionRepo.count({ where: { fileId } });

    // Seed if no versions
    if (versionCount === 0) {
      const file = await fileRepo.findOne({
        where: { id: fileId },
        select: ['xml'],
      });

      if (file) {
        const now = unixTimestamp();
        await versionRepo.insert({
          id: generateId(),
          fileId,
          author: 'system',
          message: 'Initial import',
          xml: file.xml,
          createdAt: now,
        });
      }
    }

    const rows = await versionRepo.find({
      where: { fileId },
      select: ['id', 'author', 'message', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    return rows.map((row: Version) => toVersionListItem(row));
  }

  /**
   * Create a new version snapshot for a file
   */
  async create(input: CreateVersionInput): Promise<VersionResult> {
    const dataSource = await getDataSource();
    const versionRepo = dataSource.getRepository(Version);
    const fileRepo = dataSource.getRepository(File);

    const file = await fileRepo.findOne({
      where: { id: input.fileId },
      select: ['id', 'projectId', 'xml'],
    });
    if (!file) {
      throw Errors.notFound('File');
    }

    const now = unixTimestampMs();
    const message = String(input.message || '').trim();
    const id = generateId();

    await versionRepo.insert({
      id,
      fileId: input.fileId,
      author: input.userId,
      message,
      xml: file.xml,
      createdAt: now,
    });

    return {
      id,
      author: input.userId,
      message,
      createdAt: now,
    };
  }

  /**
   * Get a specific version by ID
   */
  async getById(fileId: string, versionId: string): Promise<VersionResult & { xml: string }> {
    const dataSource = await getDataSource();
    const versionRepo = dataSource.getRepository(Version);

    const row = await versionRepo.findOne({
      where: { id: versionId, fileId },
      select: ['id', 'fileId', 'author', 'message', 'xml', 'createdAt'],
    });

    if (!row) {
      throw Errors.notFound('Version');
    }

    return toVersionDetail(row);
  }

  /**
   * Restore a file to a specific version
   */
  async restore(fileId: string, versionId: string, userId: string): Promise<{ restored: boolean; fileId: string; versionId: string; updatedAt: number }> {
    const dataSource = await getDataSource();
    const versionRepo = dataSource.getRepository(Version);
    const fileRepo = dataSource.getRepository(File);

    const [file, version] = await Promise.all([
      fileRepo.findOne({
        where: { id: fileId },
        select: ['id', 'projectId'],
      }),
      versionRepo.findOne({
        where: { id: versionId, fileId },
        select: ['id', 'fileId', 'message', 'xml'],
      }),
    ]);

    if (!file) {
      throw Errors.notFound('File');
    }
    if (!version) {
      throw Errors.notFound('Version');
    }

    const updatedAt = unixTimestamp();
    const versionCreatedAt = unixTimestampMs();

    await fileRepo.update(
      { id: fileId },
      { xml: version.xml, updatedAt }
    );

    await versionRepo.insert({
      id: generateId(),
      fileId,
      author: userId,
      message: `Restored from ${String(version.message || '').trim() || `version ${versionId.substring(0, 8)}`}`,
      xml: version.xml,
      createdAt: versionCreatedAt,
    });

    return { restored: true, fileId, versionId, updatedAt };
  }

  /**
   * Compare two versions (placeholder - returns length delta)
   */
  async compare(versionId: string, otherVersionId: string): Promise<{
    a: { id: string; fileId: string; createdAt: number; xmlLength: number };
    b: { id: string; fileId: string; createdAt: number; xmlLength: number };
    lengthDelta: number;
  }> {
    const dataSource = await getDataSource();
    const versionRepo = dataSource.getRepository(Version);

    const readVersion = async (id: string) => {
      const result = await versionRepo.createQueryBuilder('v')
        .select(['v.id', 'v.fileId', 'v.createdAt'])
        .addSelect('LENGTH(v.xml)', 'xmlLen')
        .where('v.id = :id', { id })
        .getRawOne();
      return result || null;
    };

    const a = await readVersion(versionId);
    const b = await readVersion(otherVersionId);

    if (!a || !b) throw Errors.notFound('Version');

    return {
      a: {
        id: toQueryString(a.v_id || a.id),
        fileId: toQueryString(a.v_fileId || a.fileId),
        createdAt: toQueryNumber(a.v_createdAt || a.createdAt),
        xmlLength: toQueryNumber(a.xmlLen),
      },
      b: {
        id: toQueryString(b.v_id || b.id),
        fileId: toQueryString(b.v_fileId || b.fileId),
        createdAt: toQueryNumber(b.v_createdAt || b.createdAt),
        xmlLength: toQueryNumber(b.xmlLen),
      },
      lengthDelta: toQueryNumber(a.xmlLen) - toQueryNumber(b.xmlLen),
    };
  }
}

export const versionService = new VersionServiceImpl();
