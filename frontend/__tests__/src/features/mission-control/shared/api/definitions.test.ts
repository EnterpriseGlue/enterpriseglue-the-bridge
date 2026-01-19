import { describe, it, expect, vi } from 'vitest';
import { fetchProcessDefinitionXml, fetchDecisionDefinitionDmnXml } from '@src/features/mission-control/shared/api/definitions';

vi.mock('@src/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('definitions api', () => {
  it('fetches process definition XML', async () => {
    const { apiClient } = await import('@src/shared/api/client');
    (apiClient as any).get.mockResolvedValueOnce({ bpmn20Xml: '<bpmn />' });

    const xml = await fetchProcessDefinitionXml('def-1');

    expect(xml).toBe('<bpmn />');
    expect((apiClient as any).get).toHaveBeenCalledWith(
      '/mission-control-api/process-definitions/def-1/xml',
      undefined,
      { credentials: 'include' }
    );
  });

  it('fetches decision definition DMN XML', async () => {
    const { apiClient } = await import('@src/shared/api/client');
    (apiClient as any).get.mockResolvedValueOnce({ dmnXml: '<dmn />' });

    const xml = await fetchDecisionDefinitionDmnXml('decision 1');

    expect(xml).toBe('<dmn />');
    expect((apiClient as any).get).toHaveBeenCalledWith(
      '/mission-control-api/decision-definitions/decision%201/xml',
      undefined,
      { credentials: 'include' }
    );
  });
});
