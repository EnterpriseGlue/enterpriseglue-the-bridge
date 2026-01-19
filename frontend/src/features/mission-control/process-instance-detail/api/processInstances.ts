import { apiClient } from '../../../../shared/api/client'
export { fetchProcessDefinitionXml } from '../../shared/api/definitions'
import type {
  ProcessDefinition,
  Variable,
  ActivityInstance,
  Incident,
  Job,
  ExternalTask,
} from '../components/types'

// Types
export type ProcessInstanceDetail = {
  id: string
  businessKey?: string
  processDefinitionId: string
  processDefinitionKey: string
  processDefinitionName?: string
  startTime: string
  endTime?: string
  state: string
  suspended: boolean
}

// API Functions
export async function getProcessInstance(instanceId: string): Promise<ProcessInstanceDetail> {
  return apiClient.get<ProcessInstanceDetail>(`/mission-control-api/process-instances/${instanceId}`, undefined, { credentials: 'include' })
}

export async function getProcessInstanceVariables(instanceId: string): Promise<Record<string, Variable>> {
  return apiClient.get<Record<string, Variable>>(`/mission-control-api/process-instances/${instanceId}/variables`, undefined, { credentials: 'include' })
}

export async function getProcessInstanceActivityHistory(instanceId: string): Promise<ActivityInstance[]> {
  return apiClient.get<ActivityInstance[]>(`/mission-control-api/process-instances/${instanceId}/history/activity-instances`, undefined, { credentials: 'include' })
}

export async function getProcessInstanceIncidents(instanceId: string): Promise<Incident[]> {
  return apiClient.get<Incident[]>(`/mission-control-api/process-instances/${instanceId}/incidents`, undefined, { credentials: 'include' })
}

export async function getProcessInstanceJobs(instanceId: string): Promise<Job[]> {
  return apiClient.get<Job[]>(`/mission-control-api/process-instances/${instanceId}/jobs`, undefined, { credentials: 'include' })
}

export async function getProcessInstanceExternalTasks(instanceId: string): Promise<ExternalTask[]> {
  return apiClient.get<ExternalTask[]>(`/mission-control-api/process-instances/${instanceId}/external-tasks`, undefined, { credentials: 'include' })
}

// Historical data
export async function getHistoricalProcessInstance(instanceId: string): Promise<unknown> {
  return apiClient.get<unknown>(`/mission-control-api/history/process-instances/${instanceId}`, undefined, { credentials: 'include' })
}

export async function getHistoricalVariableInstances(instanceId: string): Promise<Variable[]> {
  return apiClient.get<Variable[]>(`/mission-control-api/history/variable-instances?processInstanceId=${instanceId}`, undefined, { credentials: 'include' })
}

export async function getCalledProcessInstances(instanceId: string): Promise<unknown[]> {
  return apiClient.get<unknown[]>(`/mission-control-api/process-instances/${instanceId}/called-process-instances`, undefined, { credentials: 'include' })
}

export async function listProcessDefinitions(): Promise<ProcessDefinition[]> {
  return apiClient.get<ProcessDefinition[]>('/mission-control-api/process-definitions', undefined, { credentials: 'include' })
}
