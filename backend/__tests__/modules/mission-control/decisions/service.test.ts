import { describe, it, expect, vi } from 'vitest';
import {
  listDecisionDefinitions,
  fetchDecisionDefinition,
  fetchDecisionDefinitionXml,
  evaluateDecisionById,
  evaluateDecisionByKey,
} from '../../../../src/modules/mission-control/decisions/service.js';

vi.mock('@shared/services/bpmn-engine-client.js', () => ({
  camundaPost: vi.fn().mockResolvedValue({}),
  getDecisionDefinitions: vi.fn().mockResolvedValue([]),
  getDecisionDefinition: vi.fn().mockResolvedValue({}),
  getDecisionDefinitionXml: vi.fn().mockResolvedValue({ xml: '<dmn/>' }),
  evaluateDecision: vi.fn().mockResolvedValue([]),
}));

describe('decisions service', () => {
  it('lists decision definitions', async () => {
    const result = await listDecisionDefinitions({});
    expect(result).toBeDefined();
  });

  it('fetches decision definition', async () => {
    const result = await fetchDecisionDefinition('def-1');
    expect(result).toBeDefined();
  });

  it('fetches decision definition XML', async () => {
    const result = await fetchDecisionDefinitionXml('def-1');
    expect(result).toBeDefined();
  });

  it('evaluates decision by id', async () => {
    const result = await evaluateDecisionById('def-1', { input: 'test' });
    expect(result).toBeDefined();
  });

  it('evaluates decision by key', async () => {
    const result = await evaluateDecisionByKey('decision-key', { input: 'test' });
    expect(result).toBeDefined();
  });
});
