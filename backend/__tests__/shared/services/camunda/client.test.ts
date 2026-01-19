import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { CamundaClient } from '../../../../src/shared/services/camunda/client.js';
import { getDataSource } from '../../../../src/shared/db/data-source.js';
import { Engine } from '../../../../src/shared/db/entities/Engine.js';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('undici', () => ({
  fetch: vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
  }),
}));

describe('CamundaClient', () => {
  let client: CamundaClient;

  beforeEach(() => {
    client = new CamundaClient();
    vi.clearAllMocks();

    const engineRepo = {
      findOneBy: vi.fn().mockResolvedValue({
        baseUrl: 'http://localhost:8080/engine-rest',
        active: true,
        authType: 'none',
      }),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === Engine) return engineRepo;
        throw new Error('Unexpected repository');
      },
    });
  });

  it('creates instance', () => {
    expect(client).toBeDefined();
  });

  it('makes GET request', async () => {
    const result = await client.get('/process-definition');
    expect(result).toBeDefined();
  });
});
