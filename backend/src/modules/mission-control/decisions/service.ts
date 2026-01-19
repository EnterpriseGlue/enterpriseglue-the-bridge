/**
 * Mission Control decision service
 */

import {
  camundaPost,
  getDecisionDefinitions,
  getDecisionDefinition,
  getDecisionDefinitionXml,
  evaluateDecision,
} from '@shared/services/bpmn-engine-client.js'

export async function listDecisionDefinitions(params: any) {
  return getDecisionDefinitions<any[]>(params)
}

export async function fetchDecisionDefinition(id: string) {
  return getDecisionDefinition<any>(id)
}

export async function fetchDecisionDefinitionXml(id: string) {
  return getDecisionDefinitionXml<any>(id)
}

export async function evaluateDecisionById(id: string, body: any) {
  return evaluateDecision<any>(id, body)
}

export async function evaluateDecisionByKey(key: string, body: any) {
  return camundaPost<any>(`/decision-definition/key/${encodeURIComponent(key)}/evaluate`, body)
}
