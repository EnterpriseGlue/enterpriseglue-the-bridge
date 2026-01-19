import React from 'react'
import type { HistoricDecisionInstanceLite, DecisionIo } from './types'
import { createBpmnIconVisualResolver } from '../../../../utils/bpmnIconResolver'
import { ActivityHistoryPanel } from './ActivityHistoryPanel'
import { ActivityDetailsPanel } from './ActivityDetailsPanel'
import { buildActivityGroups, buildHistoryContext } from './activityDetailUtils'

interface ActivityDetailPanelProps {
  // Activity history data
  actQ: { isLoading: boolean; data?: any }
  sortedActs: any[]
  processName?: string
  incidentActivityIds: Set<string>
  execCounts: Map<string, number>
  clickableActivityIds: Set<string>
  bpmnRef?: React.MutableRefObject<any>
  selectedActivityId: string | null
  setSelectedActivityId: (id: string | null) => void
  selectedActivityName: string
  fmt: (ts?: string | null) => string
  isModMode: boolean
  moveSourceActivityId: string | null
  onActivityClick?: (activityId: string) => void
  onActivityHover?: (activityId: string | null) => void
  onHistoryContextChange?: (ctx: any | null) => void
  
  // Right panel tab state
  rightTab: 'variables' | 'io'
  setRightTab: (tab: 'variables' | 'io') => void
  
  // Variables data
  varsQ: { isLoading: boolean; data?: Record<string, { value: any; type: string }> }
  selectedNodeVariables: any[] | null
  shouldShowDecisionPanel: boolean
  status: string
  openVariableEditor: (name: string, value: any) => void
  showAlert: (message: string, kind?: 'info' | 'warning' | 'error', title?: string) => void
  onAddVariable?: () => void
  onBulkUploadVariables?: () => void
  
  // Decision data
  selectedDecisionInstance: HistoricDecisionInstanceLite | null
  decisionInputs: DecisionIo[]
  decisionOutputs: DecisionIo[]
  
  // I/O mappings data
  selectedNodeInputMappings: any[] | undefined
  selectedNodeOutputMappings: any[] | undefined
  formatMappingType: (val: any) => string
  formatMappingValue: (val: any) => string
  
  // Modification mode
  modPlan: any[]
  addPlanOperation: (kind: 'add' | 'cancel') => void
  removePlanItem: (index: number) => void
  toggleMoveForSelection: () => void
  applyModifications: () => void
  setDiscardConfirmOpen: (open: boolean) => void
  applyBusy: boolean
}


/**
 * Bottom panel showing activity history timeline and detail panels
 * Split into two sections: Instance History (left) and Variables/IO (right)
 */
export function ActivityDetailPanel({
  actQ,
  sortedActs,
  processName,
  incidentActivityIds,
  execCounts,
  clickableActivityIds,
  bpmnRef,
  selectedActivityId,
  setSelectedActivityId,
  selectedActivityName,
  fmt,
  isModMode,
  moveSourceActivityId,
  onActivityClick,
  onActivityHover,
  onHistoryContextChange,
  rightTab,
  setRightTab,
  varsQ,
  selectedNodeVariables,
  shouldShowDecisionPanel,
  status,
  openVariableEditor,
  showAlert,
  onAddVariable,
  onBulkUploadVariables,
  selectedDecisionInstance,
  decisionInputs,
  decisionOutputs,
  selectedNodeInputMappings,
  selectedNodeOutputMappings,
  formatMappingType,
  formatMappingValue,
  modPlan,
  addPlanOperation,
  removePlanItem,
  toggleMoveForSelection,
  applyModifications,
  setDiscardConfirmOpen,
  applyBusy,
}: ActivityDetailPanelProps) {
  const resolveBpmnIconVisual = React.useMemo(() => {
    const getBpmnElementById = (activityId: string) => {
      const reg = bpmnRef?.current?.get?.('elementRegistry')
      return reg?.get?.(activityId)
    }

    return createBpmnIconVisualResolver(getBpmnElementById)
  }, [bpmnRef])

  const groupedActivities = React.useMemo(
    () => buildActivityGroups({
      sortedActs,
      incidentActivityIds,
      clickableActivityIds,
      selectedActivityId,
      execCounts,
      bpmnRef,
    }),
    [sortedActs, incidentActivityIds, clickableActivityIds, selectedActivityId, execCounts, bpmnRef]
  )

  return [
    <ActivityHistoryPanel
      key="history"
      actQ={actQ}
      sortedActs={sortedActs}
      processName={processName}
      incidentActivityIds={incidentActivityIds}
      execCounts={execCounts}
      clickableActivityIds={clickableActivityIds}
      selectedActivityId={selectedActivityId}
      setSelectedActivityId={setSelectedActivityId}
      fmt={fmt}
      isModMode={isModMode}
      moveSourceActivityId={moveSourceActivityId}
      onActivityClick={onActivityClick}
      onActivityHover={onActivityHover}
      onHistoryContextChange={onHistoryContextChange}
      execGroups={groupedActivities}
      resolveBpmnIconVisual={resolveBpmnIconVisual}
      buildHistoryContext={buildHistoryContext}
    />,
    <ActivityDetailsPanel
      key="details"
      rightTab={rightTab}
      setRightTab={setRightTab}
      varsQ={varsQ}
      selectedActivityId={selectedActivityId}
      selectedActivityName={selectedActivityName}
      selectedNodeVariables={selectedNodeVariables}
      shouldShowDecisionPanel={shouldShowDecisionPanel}
      status={status}
      openVariableEditor={openVariableEditor}
      showAlert={showAlert}
      onAddVariable={onAddVariable}
      onBulkUploadVariables={onBulkUploadVariables}
      selectedDecisionInstance={selectedDecisionInstance}
      decisionInputs={decisionInputs}
      decisionOutputs={decisionOutputs}
      selectedNodeInputMappings={selectedNodeInputMappings}
      selectedNodeOutputMappings={selectedNodeOutputMappings}
      formatMappingType={formatMappingType}
      formatMappingValue={formatMappingValue}
      isModMode={isModMode}
      modPlan={modPlan}
      addPlanOperation={addPlanOperation}
      removePlanItem={removePlanItem}
      toggleMoveForSelection={toggleMoveForSelection}
      applyModifications={applyModifications}
      setDiscardConfirmOpen={setDiscardConfirmOpen}
      applyBusy={applyBusy}
      moveSourceActivityId={moveSourceActivityId}
    />,
  ]
}
