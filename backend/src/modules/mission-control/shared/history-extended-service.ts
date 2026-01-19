/**
 * Mission Control history (extended) service
 */

import {
  getHistoricTaskInstances,
  getHistoricVariableInstances,
  getHistoricDecisionInstances,
  getHistoricDecisionInstanceInputs,
  getHistoricDecisionInstanceOutputs,
  getUserOperationLog,
} from '@shared/services/bpmn-engine-client.js'

export async function listHistoricTasks(params: any) {
  return getHistoricTaskInstances<any[]>(params)
}

export async function listHistoricVariables(params: any) {
  return getHistoricVariableInstances<any[]>(params)
}

export async function listHistoricDecisions(params: any) {
  return getHistoricDecisionInstances<any[]>(params)
}

export async function listHistoricDecisionInputs(id: string) {
  return getHistoricDecisionInstanceInputs<any[]>(id)
}

export async function listHistoricDecisionOutputs(id: string) {
  return getHistoricDecisionInstanceOutputs<any[]>(id)
}

export async function listUserOperations(params: any) {
  return getUserOperationLog<any[]>(params)
}
