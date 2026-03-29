import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { versionService } from '@enterpriseglue/shared/services/starbase/VersionService.js';
import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { Version } from '@enterpriseglue/shared/db/entities/Version.js';
import { File } from '@enterpriseglue/shared/db/entities/File.js';

vi.mock('@enterpriseglue/shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

describe('versionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists versions and normalizes string-backed createdAt values', async () => {
    const versionRepo = {
      count: vi.fn().mockResolvedValue(1),
      find: vi.fn().mockResolvedValue([
        { id: 'version-1', author: null, message: null, createdAt: '123' },
      ]),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === Version) return versionRepo;
        if (entity === File) return { findOne: vi.fn() };
        throw new Error('Unexpected repository');
      },
    });

    const result = await versionService.listByFile('file-1');

    expect(result).toEqual([
      {
        id: 'version-1',
        author: 'unknown',
        message: '',
        createdAt: 123,
      },
    ]);
  });

  it('compares versions and normalizes raw query strings', async () => {
    const builderA = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawOne: vi.fn().mockResolvedValue({
        v_id: 'version-1',
        v_fileId: 'file-1',
        v_createdAt: '100',
        xmlLen: '12',
      }),
    };
    const builderB = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawOne: vi.fn().mockResolvedValue({
        v_id: 'version-2',
        v_fileId: 'file-1',
        v_createdAt: '90',
        xmlLen: '7',
      }),
    };
    const versionRepo = {
      createQueryBuilder: vi.fn()
        .mockReturnValueOnce(builderA)
        .mockReturnValueOnce(builderB),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === Version) return versionRepo;
        throw new Error('Unexpected repository');
      },
    });

    const result = await versionService.compare('version-1', 'version-2');

    expect(result).toEqual({
      a: { id: 'version-1', fileId: 'file-1', createdAt: 100, xmlLength: 12 },
      b: { id: 'version-2', fileId: 'file-1', createdAt: 90, xmlLength: 7 },
      lengthDelta: 5,
    });
  });
});
