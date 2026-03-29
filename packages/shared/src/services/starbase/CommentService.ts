import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { Comment } from '@enterpriseglue/shared/db/entities/Comment.js';
import { generateId, unixTimestamp } from '@enterpriseglue/shared/utils/id.js';
import { toQueryNumber } from './query-normalization.js';

export interface CommentResult {
  id: string;
  author: string;
  message: string;
  createdAt: number;
}

class CommentServiceImpl {
  /**
   * List comments for a file (seeds stub comments if none exist)
   */
  async listByFile(fileId: string): Promise<CommentResult[]> {
    const dataSource = await getDataSource();
    const commentRepo = dataSource.getRepository(Comment);

    const commentCount = await commentRepo.count({ where: { fileId } });

    // Seed if empty
    if (commentCount === 0) {
      const now = unixTimestamp();
      await commentRepo.insert([
        {
          id: generateId(),
          fileId,
          author: 'system',
          message: 'Initial comment stub',
          createdAt: now,
        },
        {
          id: generateId(),
          fileId,
          author: 'hary',
          message: 'Looks good for now',
          createdAt: now,
        },
      ]);
    }

    const rows = await commentRepo.find({
      where: { fileId },
      select: ['id', 'author', 'message', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    return rows.map((row) => ({
      id: row.id,
      author: row.author || 'unknown',
      message: row.message || '',
      createdAt: toQueryNumber(row.createdAt),
    }));
  }
}

export const commentService = new CommentServiceImpl();
