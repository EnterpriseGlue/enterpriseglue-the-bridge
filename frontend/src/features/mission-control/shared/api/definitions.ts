import { apiClient } from '../../../../shared/api/client'

export async function fetchProcessDefinitionXml(definitionId: string): Promise<string> {
  const data = await apiClient.get<{ bpmn20Xml: string }>(
    `/mission-control-api/process-definitions/${definitionId}/xml`,
    undefined,
    { credentials: 'include' },
  )
  return data.bpmn20Xml
}

export async function fetchDecisionDefinitionDmnXml(definitionId: string): Promise<string> {
  const data = await apiClient.get<{ dmnXml: string }>(
    `/mission-control-api/decision-definitions/${encodeURIComponent(definitionId)}/xml`,
    undefined,
    { credentials: 'include' },
  )
  return data.dmnXml
}
