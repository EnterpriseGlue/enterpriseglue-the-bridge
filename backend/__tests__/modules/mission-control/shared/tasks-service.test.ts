import { describe, it, expect, vi } from 'vitest';
import {
  listTasks,
  getTaskById,
  claimTaskById,
  completeTaskById,
  getTaskCountByQuery,
} from '../../../../src/modules/mission-control/shared/tasks-service.js';

vi.mock('@shared/services/bpmn-engine-client.js', () => ({
  getTasks: vi.fn().mockResolvedValue([]),
  getTask: vi.fn().mockResolvedValue({ id: 't1' }),
  getTaskCount: vi.fn().mockResolvedValue({ count: 1 }),
  claimTask: vi.fn().mockResolvedValue(undefined),
  completeTask: vi.fn().mockResolvedValue(undefined),
  unclaimTask: vi.fn().mockResolvedValue(undefined),
  setTaskAssignee: vi.fn().mockResolvedValue(undefined),
  getTaskVariables: vi.fn().mockResolvedValue({}),
  updateTaskVariables: vi.fn().mockResolvedValue(undefined),
  getTaskForm: vi.fn().mockResolvedValue({ key: 'form-1' }),
}));

describe('tasks-service', () => {
  it('lists tasks', async () => {
    const result = await listTasks({});
    expect(result).toEqual([]);
  });

  it('gets task by id', async () => {
    const result = await getTaskById('t1');
    expect(result).toEqual({ id: 't1' });
  });

  it('gets task count by query', async () => {
    const result = await getTaskCountByQuery({});
    expect(result).toEqual({ count: 1 });
  });

  it('claims task by id', async () => {
    await expect(claimTaskById('t1', { userId: 'u1' })).resolves.toBeUndefined();
  });

  it('completes task by id', async () => {
    await expect(completeTaskById('t1', { variables: {} })).resolves.toBeUndefined();
  });
});
