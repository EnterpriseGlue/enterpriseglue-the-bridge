import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessDefinitionService } from '../../../../src/shared/services/camunda/process-definitions.js';

vi.mock('../../../../src/shared/services/camunda/client.js', () => {
  return {
    CamundaClient: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockResolvedValue([]),
    })),
  };
});

describe('ProcessDefinitionService', () => {
  let service: ProcessDefinitionService;

  beforeEach(() => {
    service = new ProcessDefinitionService();
    vi.clearAllMocks();
  });

  it('lists process definitions', async () => {
    const result = await service.list();
    expect(result).toBeDefined();
  });

  it('gets process definition by id', async () => {
    const result = await service.getById('def-1');
    expect(result).toBeDefined();
  });

  it('gets process definition XML', async () => {
    const result = await service.getXml('def-1');
    expect(result).toBeDefined();
  });

  it('gets active activity counts', async () => {
    const result = await service.getActiveActivityCounts('def-1');
    expect(result).toBeDefined();
  });
});
