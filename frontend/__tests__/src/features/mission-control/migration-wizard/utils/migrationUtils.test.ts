import { describe, it, expect } from 'vitest';
import { typeCategory, toHumanName, parseActivities, normalizeName } from '@src/features/mission-control/migration-wizard/utils/migrationUtils';

describe('migrationUtils', () => {
  it('categorizes BPMN element types', () => {
    expect(typeCategory('bpmn:ExclusiveGateway')).toBe('gateway');
    expect(typeCategory('bpmn:StartEvent')).toBe('event');
    expect(typeCategory('bpmn:CallActivity')).toBe('callactivity');
    expect(typeCategory('bpmn:SubProcess')).toBe('subprocess');
    expect(typeCategory('bpmn:UserTask')).toBe('task');
    expect(typeCategory('bpmn:EndEvent')).toBe('event');
    expect(typeCategory('bpmn:IntermediateCatchEvent')).toBe('event');
    expect(typeCategory('bpmn:ServiceTask')).toBe('task');
    expect(typeCategory('bpmn:ParallelGateway')).toBe('gateway');
    expect(typeCategory('bpmn:CustomThing')).toBe('bpmn:customthing');
  });

  it('formats human-friendly names', () => {
    expect(toHumanName('myTestValue')).toBe('My Test Value');
    expect(toHumanName('snake_case-name')).toBe('Snake case name');
    expect(toHumanName('Already Spaced')).toBe('Already Spaced');
    expect(toHumanName('multi__dash--test')).toBe('Multi dash test');
    expect(toHumanName('single')).toBe('Single');
    expect(toHumanName()).toBe('');
  });

  it('handles empty and whitespace names', () => {
    expect(toHumanName('')).toBe('');
    expect(toHumanName('   ')).toBe('');
  });

  it('parses activities from BPMN XML', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
        <process id="Process_1">
          <userTask id="Task_1" name="Do Work" />
          <startEvent id="Start_1" name="Start" />
        </process>
      </definitions>`;
    const result = parseActivities(xml);
    expect(result).toEqual([
      { id: 'Task_1', name: 'Do Work', type: 'userTask' },
      { id: 'Start_1', name: 'Start', type: 'startEvent' },
    ]);
  });

  it('filters out elements without ids or not in allowlist', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
        <process id="Process_1">
          <userTask name="No Id" />
          <scriptTask id="Script_1" name="Script" />
          <sequenceFlow id="Flow_1" name="Flow" />
        </process>
      </definitions>`;
    const result = parseActivities(xml);
    expect(result).toEqual([{ id: 'Script_1', name: 'Script', type: 'scriptTask' }]);
  });

  it('returns empty array for null or invalid XML', () => {
    expect(parseActivities(null)).toEqual([]);
    expect(parseActivities('not xml')).toEqual([]);
  });

  it('normalizes names for comparison', () => {
    expect(normalizeName('Hello, World!')).toBe('helloworld');
    expect(normalizeName('  Mixed-CASE_123 ')).toBe('mixedcase123');
    expect(normalizeName('symbols*&^%$#@!')).toBe('symbols');
  });

  it('normalizes empty or whitespace strings', () => {
    expect(normalizeName('')).toBe('');
    expect(normalizeName('   ')).toBe('');
  });
});
