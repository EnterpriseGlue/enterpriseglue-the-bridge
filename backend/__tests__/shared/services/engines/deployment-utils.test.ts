import { describe, it, expect } from 'vitest';
import {
  sanitize,
  hashContent,
  ensureExt,
  normalizeXmlnsUrisInDefinitions,
  normalizeBpmnProcessHistoryTtl,
  normalizeDmnDecisionHistoryTtl,
  normalizeDmnDiIds,
  sanitizeBpmnXml,
} from '@enterpriseglue/shared/services/engines/deployment-utils.js';

describe('deployment-utils', () => {
  describe('sanitize', () => {
    it('removes special characters', () => {
      expect(sanitize('test<>:"|?*file')).toBe('testfile');
    });

    it('replaces whitespace with hyphens', () => {
      expect(sanitize('test  file  name')).toBe('test-file-name');
    });

    it('removes control characters', () => {
      expect(sanitize('test\x00\x01file')).toBe('testfile');
    });

    it('handles empty string', () => {
      expect(sanitize('')).toBe('');
    });
  });

  describe('hashContent', () => {
    it('generates SHA256 hash', () => {
      const hash = hashContent('test content');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('produces same hash for same content', () => {
      const hash1 = hashContent('test');
      const hash2 = hashContent('test');
      expect(hash1).toBe(hash2);
    });

    it('produces different hash for different content', () => {
      const hash1 = hashContent('test1');
      const hash2 = hashContent('test2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('ensureExt', () => {
    it('adds .bpmn extension if missing', () => {
      expect(ensureExt('process', 'bpmn')).toBe('process.bpmn');
    });

    it('does not add .bpmn if already present', () => {
      expect(ensureExt('process.bpmn', 'bpmn')).toBe('process.bpmn');
    });

    it('adds .dmn extension if missing', () => {
      expect(ensureExt('decision', 'dmn')).toBe('decision.dmn');
    });

    it('does not add .dmn if already present', () => {
      expect(ensureExt('decision.dmn', 'dmn')).toBe('decision.dmn');
    });

    it('handles case insensitive extensions', () => {
      expect(ensureExt('process.BPMN', 'bpmn')).toBe('process.BPMN');
    });
  });

  describe('normalizeXmlnsUrisInDefinitions', () => {
    it('removes whitespace from xmlns URIs', () => {
      const xml = '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL ">';
      const result = normalizeXmlnsUrisInDefinitions(xml);
      expect(result).toBe('<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">');
    });

    it('handles xmlns with prefixes', () => {
      const xml = '<definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL ">';
      const result = normalizeXmlnsUrisInDefinitions(xml);
      expect(result).toContain('xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"');
    });

    it('returns original if no definitions tag', () => {
      const xml = '<process id="test"/>';
      const result = normalizeXmlnsUrisInDefinitions(xml);
      expect(result).toBe(xml);
    });
  });

  describe('normalizeBpmnProcessHistoryTtl', () => {
    it('adds historyTimeToLive if missing', () => {
      const xml = '<definitions xmlns:camunda="http://camunda.org/schema/1.0/bpmn"><process id="test"></process></definitions>';
      const result = normalizeBpmnProcessHistoryTtl(xml);
      expect(result).toContain('camunda:historyTimeToLive="60"');
    });

    it('replaces historyTimeToLive=180 with 60', () => {
      const xml = '<definitions xmlns:camunda="http://camunda.org/schema/1.0/bpmn"><process camunda:historyTimeToLive="180"></process></definitions>';
      const result = normalizeBpmnProcessHistoryTtl(xml);
      expect(result).toContain('camunda:historyTimeToLive="60"');
    });

    it('preserves other historyTimeToLive values', () => {
      const xml = '<process camunda:historyTimeToLive="30">';
      const result = normalizeBpmnProcessHistoryTtl(xml);
      expect(result).toContain('camunda:historyTimeToLive="30"');
    });

    it('does nothing if camunda namespace not declared', () => {
      const xml = '<process id="test"></process>';
      const result = normalizeBpmnProcessHistoryTtl(xml);
      expect(result).toBe(xml);
    });

    it('adds historyTimeToLive to self-closing process tags', () => {
      const xml = '<definitions xmlns:camunda="http://camunda.org/schema/1.0/bpmn"><process id="test" /></definitions>';
      const result = normalizeBpmnProcessHistoryTtl(xml);
      expect(result).toContain('<process id="test" camunda:historyTimeToLive="60"/>');
    });
  });

  describe('normalizeDmnDecisionHistoryTtl', () => {
    it('adds historyTimeToLive to self-closing decision tags', () => {
      const xml = '<definitions xmlns:camunda="http://camunda.org/schema/1.0/bpmn"><decision id="Decision_1" /></definitions>';
      const result = normalizeDmnDecisionHistoryTtl(xml);
      expect(result).toContain('<decision id="Decision_1" camunda:historyTimeToLive="60"/>');
    });
  });

  describe('normalizeDmnDiIds', () => {
    it('adds ids to DMN diagram and shape tags without ids', () => {
      const xml = '<dmndi:DMNDiagram><dmndi:DMNShape /></dmndi:DMNDiagram>';
      const result = normalizeDmnDiIds(xml);
      expect(result).toContain('<dmndi:DMNDiagram id="DMNDiagram_1">');
      expect(result).toContain('<dmndi:DMNShape id="DMNShape_1"/>');
    });
  });

  describe('sanitizeBpmnXml', () => {
    it('normalizes operaton BPMN attributes into camunda-prefixed BPMN', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:operaton="http://operaton.org/schema/1.0/bpmn">
  <bpmn:process id="Process_1" operaton:historyTimeToLive="45" camunda:historyTimeToLive="60">
    <bpmn:userTask id="Task_1" operaton:assignee="demo" operaton:formKey="embedded:app:forms/test.html" />
  </bpmn:process>
</bpmn:definitions>`;

      const result = sanitizeBpmnXml(xml);
      expect(result).not.toContain('operaton:');
      expect(result).not.toContain('xmlns:operaton');
      expect(result).toContain('camunda:historyTimeToLive="60"');
      expect(result).toContain('camunda:assignee="demo"');
      expect(result).toContain('camunda:formKey="embedded:app:forms/test.html"');
    });

    it('repairs malformed self-closing process tags while preserving child flow nodes', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:operaton="http://operaton.org/schema/1.0/bpmn">
  <bpmn:process id="ReviewInvoice" name="Review Invoice" isExecutable="true" operaton:historyTimeToLive="45" camunda:historyTimeToLive="60" camunda:historyTimeToLive="60"/>
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
</bpmn:definitions>`;

      const result = sanitizeBpmnXml(xml);
      expect(result).toContain('<bpmn:process id="ReviewInvoice" name="Review Invoice" isExecutable="true" camunda:historyTimeToLive="60">');
      expect(result).toContain('<bpmn:startEvent id="StartEvent_1" />');
      expect(result).toContain('</bpmn:process>');
      expect(result).not.toContain('/>\n    <bpmn:startEvent');
    });
  });
});
