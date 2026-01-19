import { camundaGet, camundaPost, camundaDelete } from '@shared/services/bpmn-engine-client.js'

export interface ProcessInstance {
  id: string
  definitionId: string
  businessKey?: string
  caseInstanceId?: string
  tenantId?: string
  ended: boolean
  suspended: boolean
}

export interface ProcessInstanceListParams {
  processDefinitionKey?: string
  active?: boolean
  suspended?: boolean
}

export async function listProcessInstances(params: ProcessInstanceListParams = {}): Promise<ProcessInstance[]> {
  const queryParams: Record<string, any> = {}
  if (params.processDefinitionKey) queryParams.processDefinitionKey = params.processDefinitionKey
  if (params.active !== undefined) queryParams.active = params.active
  if (params.suspended !== undefined) queryParams.suspended = params.suspended
  return camundaGet<ProcessInstance[]>('/process-instance', queryParams)
}

export async function getProcessInstance(id: string): Promise<ProcessInstance> {
  return camundaGet<ProcessInstance>(`/process-instance/${encodeURIComponent(id)}`)
}

export async function getProcessInstanceVariables(id: string): Promise<Record<string, any>> {
  return camundaGet<Record<string, any>>(`/process-instance/${encodeURIComponent(id)}/variables`)
}

export async function getActivityInstances(id: string): Promise<any> {
  return camundaGet<any>(`/process-instance/${encodeURIComponent(id)}/activity-instances`)
}

export interface DeleteProcessInstanceParams {
  skipCustomListeners?: boolean
  skipIoMappings?: boolean
  deleteReason?: string
}

export async function deleteProcessInstance(id: string, params: DeleteProcessInstanceParams = {}): Promise<void> {
  const qs = new URLSearchParams()
  if (params.skipCustomListeners !== undefined) qs.set('skipCustomListeners', String(params.skipCustomListeners))
  if (params.skipIoMappings !== undefined) qs.set('skipIoMappings', String(params.skipIoMappings))
  qs.set('deleteReason', params.deleteReason?.trim() || 'Canceled via Mission Control')
  await camundaDelete(`/process-instance/${encodeURIComponent(id)}${qs.toString() ? `?${qs.toString()}` : ''}`)
}

export async function modifyProcessInstanceVariables(id: string, modifications: Record<string, any>): Promise<void> {
  await camundaPost(`/process-instance/${encodeURIComponent(id)}/variables`, { modifications })
}
