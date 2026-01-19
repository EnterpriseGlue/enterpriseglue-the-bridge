import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessesFilterBar } from '@src/features/mission-control/processes-overview/components/ProcessesFilterBar';

vi.mock('@src/components/EngineSelector', () => ({
  EngineSelector: () => <div data-testid="engine-selector" />,
}));

describe('ProcessesFilterBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resets filters and clears viewports', () => {
    const setSelectedProcess = vi.fn();
    const setSelectedVersion = vi.fn();
    const setFlowNode = vi.fn();
    const setSelectedStates = vi.fn();
    const setVarName = vi.fn();
    const setVarType = vi.fn();
    const setVarOp = vi.fn();
    const setVarValue = vi.fn();
    const setIsResetting = vi.fn();
    const clearViewports = vi.fn();

    render(
      <ProcessesFilterBar
        defItems={[]}
        selectedProcess={{ key: 'p1', label: 'Process 1' }}
        setSelectedProcess={setSelectedProcess}
        versions={[1]}
        selectedVersion={1}
        setSelectedVersion={setSelectedVersion}
        flowNode="node-1"
        setFlowNode={setFlowNode}
        flowNodes={[]}
        selectedStates={[{ id: 'active', label: 'Active' }]}
        setSelectedStates={setSelectedStates}
        advancedOpen={false}
        setAdvancedOpen={vi.fn()}
        varName="foo"
        varValue="bar"
        isResetting={false}
        setIsResetting={setIsResetting}
        clearViewports={clearViewports}
        setVarName={setVarName}
        setVarType={setVarType}
        setVarOp={setVarOp}
        setVarValue={setVarValue}
      />
    );

    fireEvent.click(screen.getByTitle('Reset Filters'));

    expect(clearViewports).toHaveBeenCalled();
    expect(setSelectedProcess).toHaveBeenCalledWith(null);
    expect(setSelectedVersion).toHaveBeenCalledWith(null);
    expect(setFlowNode).toHaveBeenCalledWith('');
    expect(setSelectedStates).toHaveBeenCalledWith([
      { id: 'active', label: 'Active' },
      { id: 'incidents', label: 'Incidents' },
    ]);
    expect(setVarName).toHaveBeenCalledWith('');
    expect(setVarType).toHaveBeenCalledWith('String');
    expect(setVarOp).toHaveBeenCalledWith('equals');
    expect(setVarValue).toHaveBeenCalledWith('');

    expect(setIsResetting).toHaveBeenCalledWith(true);
    vi.runAllTimers();
    expect(setIsResetting).toHaveBeenCalledWith(false);
  });
});
