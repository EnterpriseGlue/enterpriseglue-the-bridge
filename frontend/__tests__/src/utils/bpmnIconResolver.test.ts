import { describe, it, expect } from 'vitest';
import {
  resolveBpmnIconClassFromElement,
  resolveBpmnMarkerIconClassFromElement,
  resolveBpmnMarkerIconClassFallbackFromActivityType,
  resolveBpmnIconClassFallbackFromActivityType,
  createBpmnIconClassResolver,
  createBpmnIconVisualResolver,
} from '@src/utils/bpmnIconResolver';

describe('bpmnIconResolver', () => {
  describe('resolveBpmnIconClassFromElement', () => {
    it('returns null for null/undefined elements', () => {
      expect(resolveBpmnIconClassFromElement(null)).toBeNull();
      expect(resolveBpmnIconClassFromElement(undefined)).toBeNull();
      expect(resolveBpmnIconClassFromElement({})).toBeNull();
    });

    describe('tasks', () => {
      it('resolves UserTask', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'bpmn:UserTask' })).toBe('bpmn-icon-user-task');
        expect(resolveBpmnIconClassFromElement({ type: 'UserTask' })).toBe('bpmn-icon-user-task');
      });

      it('resolves ServiceTask', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'ServiceTask' })).toBe('bpmn-icon-service-task');
      });

      it('resolves BusinessRuleTask', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'BusinessRuleTask' })).toBe('bpmn-icon-business-rule-task');
      });

      it('resolves ScriptTask', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'ScriptTask' })).toBe('bpmn-icon-script-task');
      });

      it('resolves ManualTask', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'ManualTask' })).toBe('bpmn-icon-manual-task');
      });

      it('resolves SendTask', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'SendTask' })).toBe('bpmn-icon-send-task');
      });

      it('resolves ReceiveTask', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'ReceiveTask' })).toBe('bpmn-icon-receive-task');
      });

      it('resolves CallActivity', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'CallActivity' })).toBe('bpmn-icon-call-activity');
      });

      it('resolves SubProcess', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'SubProcess' })).toBe('bpmn-icon-subprocess-collapsed');
      });

      it('resolves Transaction', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'Transaction' })).toBe('bpmn-icon-transaction');
      });
    });

    describe('gateways', () => {
      it('resolves ExclusiveGateway', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'ExclusiveGateway' })).toBe('bpmn-icon-gateway-xor');
      });

      it('resolves ParallelGateway', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'ParallelGateway' })).toBe('bpmn-icon-gateway-parallel');
      });

      it('resolves InclusiveGateway', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'InclusiveGateway' })).toBe('bpmn-icon-gateway-or');
      });

      it('resolves EventBasedGateway', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'EventBasedGateway' })).toBe('bpmn-icon-gateway-eventbased');
      });

      it('resolves ComplexGateway', () => {
        expect(resolveBpmnIconClassFromElement({ type: 'ComplexGateway' })).toBe('bpmn-icon-gateway-complex');
      });
    });

    describe('start events', () => {
      it('resolves plain start event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'StartEvent',
          businessObject: { eventDefinitions: [] },
        })).toBe('bpmn-icon-start-event-none');
      });

      it('resolves timer start event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'StartEvent',
          businessObject: { eventDefinitions: [{ $type: 'TimerEventDefinition' }] },
        })).toBe('bpmn-icon-start-event-timer');
      });

      it('resolves non-interrupting timer start event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'StartEvent',
          businessObject: { eventDefinitions: [{ $type: 'TimerEventDefinition' }], isInterrupting: false },
        })).toBe('bpmn-icon-start-event-non-interrupting-timer');
      });

      it('resolves message start event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'StartEvent',
          businessObject: { eventDefinitions: [{ $type: 'MessageEventDefinition' }] },
        })).toBe('bpmn-icon-start-event-message');
      });

      it('resolves error start event (no non-interrupting variant)', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'StartEvent',
          businessObject: { eventDefinitions: [{ $type: 'ErrorEventDefinition' }], isInterrupting: false },
        })).toBe('bpmn-icon-start-event-error');
      });
    });

    describe('end events', () => {
      it('resolves plain end event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'EndEvent',
          businessObject: { eventDefinitions: [] },
        })).toBe('bpmn-icon-end-event-none');
      });

      it('resolves message end event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'EndEvent',
          businessObject: { eventDefinitions: [{ $type: 'MessageEventDefinition' }] },
        })).toBe('bpmn-icon-end-event-message');
      });

      it('resolves error end event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'EndEvent',
          businessObject: { eventDefinitions: [{ $type: 'ErrorEventDefinition' }] },
        })).toBe('bpmn-icon-end-event-error');
      });

      it('resolves terminate end event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'EndEvent',
          businessObject: { eventDefinitions: [{ $type: 'TerminateEventDefinition' }] },
        })).toBe('bpmn-icon-end-event-terminate');
      });
    });

    describe('intermediate events', () => {
      it('resolves intermediate catch event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'IntermediateCatchEvent',
          businessObject: { eventDefinitions: [{ $type: 'TimerEventDefinition' }] },
        })).toBe('bpmn-icon-intermediate-event-catch-timer');
      });

      it('resolves intermediate throw event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'IntermediateThrowEvent',
          businessObject: { eventDefinitions: [{ $type: 'MessageEventDefinition' }] },
        })).toBe('bpmn-icon-intermediate-event-throw-message');
      });

      it('resolves parallel-multiple throw as multiple', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'IntermediateThrowEvent',
          businessObject: { eventDefinitions: [{ $type: 'ParallelMultipleEventDefinition' }] },
        })).toBe('bpmn-icon-intermediate-event-throw-multiple');
      });
    });

    describe('boundary events', () => {
      it('resolves interrupting boundary event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'BoundaryEvent',
          businessObject: { eventDefinitions: [{ $type: 'TimerEventDefinition' }], cancelActivity: true },
        })).toBe('bpmn-icon-intermediate-event-catch-timer');
      });

      it('resolves non-interrupting boundary event', () => {
        expect(resolveBpmnIconClassFromElement({
          type: 'BoundaryEvent',
          businessObject: { eventDefinitions: [{ $type: 'TimerEventDefinition' }], cancelActivity: false },
        })).toBe('bpmn-icon-intermediate-event-catch-non-interrupting-timer');
      });
    });

    it('returns null for unknown types', () => {
      expect(resolveBpmnIconClassFromElement({ type: 'UnknownType' })).toBeNull();
    });
  });

  describe('resolveBpmnMarkerIconClassFromElement', () => {
    it('returns null for null/undefined', () => {
      expect(resolveBpmnMarkerIconClassFromElement(null)).toBeNull();
      expect(resolveBpmnMarkerIconClassFromElement({})).toBeNull();
    });

    it('resolves task markers', () => {
      expect(resolveBpmnMarkerIconClassFromElement({ type: 'UserTask' })).toBe('bpmn-icon-user');
      expect(resolveBpmnMarkerIconClassFromElement({ type: 'ServiceTask' })).toBe('bpmn-icon-service');
      expect(resolveBpmnMarkerIconClassFromElement({ type: 'BusinessRuleTask' })).toBe('bpmn-icon-business-rule');
      expect(resolveBpmnMarkerIconClassFromElement({ type: 'ScriptTask' })).toBe('bpmn-icon-script');
      expect(resolveBpmnMarkerIconClassFromElement({ type: 'ManualTask' })).toBe('bpmn-icon-manual');
      expect(resolveBpmnMarkerIconClassFromElement({ type: 'SendTask' })).toBe('bpmn-icon-send');
      expect(resolveBpmnMarkerIconClassFromElement({ type: 'ReceiveTask' })).toBe('bpmn-icon-receive');
    });

    it('resolves CallActivity as sub-process marker', () => {
      expect(resolveBpmnMarkerIconClassFromElement({ type: 'CallActivity' })).toBe('bpmn-icon-sub-process-marker');
    });

    it('returns null for unknown types', () => {
      expect(resolveBpmnMarkerIconClassFromElement({ type: 'Unknown' })).toBeNull();
    });
  });

  describe('resolveBpmnMarkerIconClassFallbackFromActivityType', () => {
    it('handles null/undefined', () => {
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType()).toBeNull();
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('')).toBeNull();
    });

    it('resolves from activity type strings', () => {
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('userTask')).toBe('bpmn-icon-user');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('user task')).toBe('bpmn-icon-user');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('serviceTask')).toBe('bpmn-icon-service');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('businessRuleTask')).toBe('bpmn-icon-business-rule');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('business rule')).toBe('bpmn-icon-business-rule');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('dmn')).toBe('bpmn-icon-business-rule');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('scriptTask')).toBe('bpmn-icon-script');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('manualTask')).toBe('bpmn-icon-manual');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('sendTask')).toBe('bpmn-icon-send');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('receiveTask')).toBe('bpmn-icon-receive');
      expect(resolveBpmnMarkerIconClassFallbackFromActivityType('callActivity')).toBe('bpmn-icon-sub-process-marker');
    });
  });

  describe('resolveBpmnIconClassFallbackFromActivityType', () => {
    it('handles null/undefined', () => {
      expect(resolveBpmnIconClassFallbackFromActivityType()).toBe('bpmn-icon-task');
      expect(resolveBpmnIconClassFallbackFromActivityType('')).toBe('bpmn-icon-task');
    });

    it('resolves tasks from activity type', () => {
      expect(resolveBpmnIconClassFallbackFromActivityType('userTask')).toBe('bpmn-icon-user-task');
      expect(resolveBpmnIconClassFallbackFromActivityType('serviceTask')).toBe('bpmn-icon-service-task');
      expect(resolveBpmnIconClassFallbackFromActivityType('businessRuleTask')).toBe('bpmn-icon-business-rule-task');
      expect(resolveBpmnIconClassFallbackFromActivityType('scriptTask')).toBe('bpmn-icon-script-task');
      expect(resolveBpmnIconClassFallbackFromActivityType('manualTask')).toBe('bpmn-icon-manual-task');
      expect(resolveBpmnIconClassFallbackFromActivityType('sendTask')).toBe('bpmn-icon-send-task');
      expect(resolveBpmnIconClassFallbackFromActivityType('receiveTask')).toBe('bpmn-icon-receive-task');
      expect(resolveBpmnIconClassFallbackFromActivityType('callActivity')).toBe('bpmn-icon-call-activity');
      expect(resolveBpmnIconClassFallbackFromActivityType('subProcess')).toBe('bpmn-icon-subprocess-collapsed');
    });

    it('resolves gateways from activity type', () => {
      expect(resolveBpmnIconClassFallbackFromActivityType('exclusiveGateway')).toBe('bpmn-icon-gateway-xor');
      expect(resolveBpmnIconClassFallbackFromActivityType('parallelGateway')).toBe('bpmn-icon-gateway-parallel');
      expect(resolveBpmnIconClassFallbackFromActivityType('inclusiveGateway')).toBe('bpmn-icon-gateway-or');
      expect(resolveBpmnIconClassFallbackFromActivityType('gateway')).toBe('bpmn-icon-gateway-xor');
    });

    it('resolves events from activity type', () => {
      expect(resolveBpmnIconClassFallbackFromActivityType('startEvent')).toBe('bpmn-icon-start-event-none');
      expect(resolveBpmnIconClassFallbackFromActivityType('endEvent')).toBe('bpmn-icon-end-event-none');
      expect(resolveBpmnIconClassFallbackFromActivityType('event')).toBe('bpmn-icon-intermediate-event-none');
    });

    it('defaults to task icon for unknown types', () => {
      expect(resolveBpmnIconClassFallbackFromActivityType('unknown')).toBe('bpmn-icon-task');
    });
  });

  describe('createBpmnIconClassResolver', () => {
    it('returns fallback when no activityId', () => {
      const resolver = createBpmnIconClassResolver();
      expect(resolver('', 'userTask')).toBe('bpmn-icon-user-task');
    });

    it('uses element when available', () => {
      const getBpmnElementById = (id: string) => {
        if (id === 'task1') return { type: 'ServiceTask' };
        return null;
      };
      const resolver = createBpmnIconClassResolver(getBpmnElementById);
      expect(resolver('task1')).toBe('bpmn-icon-service-task');
    });

    it('caches results', () => {
      let callCount = 0;
      const getBpmnElementById = (id: string) => {
        callCount++;
        return { type: 'UserTask' };
      };
      const resolver = createBpmnIconClassResolver(getBpmnElementById);
      
      resolver('task1');
      resolver('task1');
      
      expect(callCount).toBe(1);
    });

    it('falls back to activityType when element not found', () => {
      const getBpmnElementById = () => null;
      const resolver = createBpmnIconClassResolver(getBpmnElementById);
      expect(resolver('task1', 'scriptTask')).toBe('bpmn-icon-script-task');
    });
  });

  describe('createBpmnIconVisualResolver', () => {
    it('returns shape visual when no activityId', () => {
      const resolver = createBpmnIconVisualResolver();
      const result = resolver('', 'userTask');
      expect(result.iconClass).toBe('bpmn-icon-user-task');
      expect(result.kind).toBe('shape');
    });

    it('returns marker visual for tasks', () => {
      const getBpmnElementById = () => ({ type: 'UserTask' });
      const resolver = createBpmnIconVisualResolver(getBpmnElementById);
      const result = resolver('task1');
      expect(result.iconClass).toBe('bpmn-icon-user');
      expect(result.kind).toBe('marker');
    });

    it('returns shape visual for gateways', () => {
      const getBpmnElementById = () => ({ type: 'ExclusiveGateway' });
      const resolver = createBpmnIconVisualResolver(getBpmnElementById);
      const result = resolver('gw1');
      expect(result.iconClass).toBe('bpmn-icon-gateway-xor');
      expect(result.kind).toBe('shape');
    });

    it('caches results', () => {
      let callCount = 0;
      const getBpmnElementById = () => {
        callCount++;
        return { type: 'ServiceTask' };
      };
      const resolver = createBpmnIconVisualResolver(getBpmnElementById);
      
      resolver('task1');
      resolver('task1');
      
      expect(callCount).toBe(1);
    });
  });
});
