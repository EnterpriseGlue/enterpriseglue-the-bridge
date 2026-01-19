import { Buffer } from 'node:buffer'
import { fetch } from 'undici'
import { config } from '@shared/config/index.js'
import { getDataSource } from '@shared/db/data-source.js'
import { Engine } from '@shared/db/entities/Engine.js'
import { safeDecrypt } from './encryption.js'
import type {
  Batch,
  BatchStatistics,
  ProcessInstance,
  ProcessInstanceCount,
  ActivityInstance,
  HistoricActivityInstance,
  HistoricTaskInstance,
  HistoricVariableInstance,
  HistoricDecisionInstance,
  UserOperationLogEntry,
  Deployment,
  Task,
  TaskCount,
  TaskForm,
  ExternalTask,
  Job,
  JobDefinition,
  DecisionDefinition,
  DecisionDefinitionXml,
  DecisionResult,
  Metric,
  MetricResult,
  EngineVersion,
  MigrationPlan,
  MigrationPlanValidationReport,
  DeleteProcessInstancesRequest,
  SuspendProcessInstancesRequest,
  SetJobRetriesAsyncRequest,
  GenerateMigrationPlanRequest,
  ValidateMigrationPlanRequest,
  ExecuteMigrationRequest,
  ClaimTaskRequest,
  SetAssigneeRequest,
  CompleteTaskRequest,
  FetchAndLockRequest,
  CompleteExternalTaskRequest,
  ExternalTaskFailureRequest,
  ExternalTaskBpmnErrorRequest,
  ExtendLockRequest,
  SetRetriesRequest,
  SetJobRetriesRequest,
  SetSuspensionStateRequest,
  SetDuedateRequest,
  EvaluateDecisionRequest,
  CorrelateMessageRequest,
  MessageCorrelationResult,
  DeliverSignalRequest,
  ModifyProcessInstanceRequest,
  RestartProcessInstanceRequest,
  CamundaVariables,
} from '@shared/types/bpmn-engine-api.js'

type EngineCfg = { baseUrl: string; authType: 'none' | 'basic'; username?: string | null; password?: string | null }

async function getActiveEngine(): Promise<EngineCfg> {
  const dataSource = await getDataSource()
  const engineRepo = dataSource.getRepository(Engine)
  const row = await engineRepo.findOneBy({ active: true })
  if (row && row.baseUrl) {
    const engineRow = row as Engine & { authType?: string; passwordEnc?: string; username?: string }
    const authType = engineRow.authType || ((engineRow.username ? 'basic' : 'none') as 'none' | 'basic')
    const encryptedPassword = engineRow.passwordEnc || null
    const password = encryptedPassword ? safeDecrypt(encryptedPassword) : null
    return { baseUrl: String(row.baseUrl), authType: authType as 'none' | 'basic', username: engineRow.username || null, password }
  }
  // Fallback to config for dev
  const baseUrl = config.camundaBaseUrl || 'http://localhost:8080/engine-rest'
  const username = config.camundaUsername || ''
  const password = config.camundaPassword || ''
  const authType: 'none' | 'basic' = username ? 'basic' : 'none'
  return { baseUrl, authType, username, password }
}

function buildHeaders(cfg: EngineCfg): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cfg.authType === 'basic' && cfg.username) {
    const token = Buffer.from(`${cfg.username}:${cfg.password ?? ''}`).toString('base64')
    h['Authorization'] = `Basic ${token}`
  }
  return h
}

export async function camundaGet<T = unknown>(path: string, params?: Record<string, any>): Promise<T> {
  const cfg = await getActiveEngine()
  const url = new URL(path.startsWith('http') ? path : cfg.baseUrl.replace(/\/$/, '') + path)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue
      if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, String(vv)))
      else url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(cfg),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Camunda GET ${url} failed: ${res.status} ${res.statusText} ${text}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as unknown as T
}

async function camundaSend<T = unknown>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: any): Promise<T> {
  const cfg = await getActiveEngine()
  const url = path.startsWith('http') ? path : cfg.baseUrl.replace(/\/$/, '') + path
  const res = await fetch(url, {
    method,
    headers: buildHeaders(cfg),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Camunda ${method} ${url} failed: ${res.status} ${res.statusText} ${text}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as unknown as T
}

export const camundaPost = <T = unknown>(path: string, body?: any) => camundaSend<T>('POST', path, body)
export const camundaPut =  <T = unknown>(path: string, body?: any) => camundaSend<T>('PUT', path, body)
export const camundaDelete =  <T = unknown>(path: string, body?: any) => camundaSend<T>('DELETE', path, body)

// -----------------------------
// Batch: common helpers
// -----------------------------
export const postProcessInstanceDeleteAsync = <T = Batch>(body: DeleteProcessInstancesRequest) => camundaPost<T>('/process-instance/delete', body)
export const postProcessInstanceSuspendedAsync = <T = Batch>(body: SuspendProcessInstancesRequest) => camundaPost<T>('/process-instance/suspended-async', body)
export const postJobRetriesAsync = <T = Batch>(body: SetJobRetriesAsyncRequest) => camundaPost<T>('/job/retries-async', body)
export const getBatchInfo = <T = Batch>(id: string) => camundaGet<T>(`/batch/${encodeURIComponent(id)}`)
export const getBatchStatistics = <T = BatchStatistics>(id: string) => camundaGet<T>(`/batch/${encodeURIComponent(id)}/statistics`)
export const deleteBatchById = <T = void>(id: string) => camundaDelete<T>(`/batch/${encodeURIComponent(id)}`)
export const setBatchSuspensionState = <T = void>(id: string, body: SetSuspensionStateRequest) =>
  camundaPut<T>(`/batch/${encodeURIComponent(id)}/suspended`, body)

// -----------------------------
// Migration helpers
// -----------------------------
export const postMigrationGenerate = <T = MigrationPlan>(body: GenerateMigrationPlanRequest) => camundaPost<T>('/migration/generate', body)
export const postMigrationValidate = <T = MigrationPlanValidationReport>(body: ValidateMigrationPlanRequest) => camundaPost<T>('/migration/validate', body)
export const postMigrationExecuteAsync = <T = Batch>(body: ExecuteMigrationRequest) => camundaPost<T>('/migration/executeAsync', body)
export const postMigrationExecute = <T = void>(body: ExecuteMigrationRequest) => camundaPost<T>('/migration/execute', body)

// -----------------------------
// History helpers
// -----------------------------
export const getHistoricActivityInstances = <T = HistoricActivityInstance[]>(params?: Record<string, any>) => camundaGet<T>('/history/activity-instance', params)
export const getProcessInstanceActivityTree = <T = ActivityInstance>(id: string) => camundaGet<T>(`/process-instance/${encodeURIComponent(id)}/activity-instances`)
export const getProcessInstanceCount = <T = ProcessInstanceCount>(params?: Record<string, any>) => camundaGet<T>('/process-instance/count', params)
export const postProcessInstanceCount = <T = ProcessInstanceCount>(body?: Record<string, any>) => camundaPost<T>('/process-instance/count', body)

// Version/health helpers
export const getEngineVersion = async (): Promise<EngineVersion | null> => {
  try {
    const data = await camundaGet<EngineVersion>('/version')
    if (data && typeof data === 'object') return data
  } catch {}
  return null
}

// -----------------------------
// Deployment helpers
// -----------------------------
export const getDeployments = <T = Deployment[]>(params?: Record<string, any>) => camundaGet<T>('/deployment', params)
export const getDeployment = <T = Deployment>(id: string) => camundaGet<T>(`/deployment/${encodeURIComponent(id)}`)
export const deleteDeployment = <T = void>(id: string, cascade?: boolean) => {
  const query = cascade ? `?cascade=true` : ''
  return camundaDelete<T>(`/deployment/${encodeURIComponent(id)}${query}`)
}
export const getProcessDefinitionDiagram = <T = string>(id: string) => camundaGet<T>(`/process-definition/${encodeURIComponent(id)}/diagram`)

// -----------------------------
// Task helpers
// -----------------------------
export const getTasks = <T = Task[]>(params?: Record<string, any>) => camundaGet<T>('/task', params)
export const getTask = <T = Task>(id: string) => camundaGet<T>(`/task/${encodeURIComponent(id)}`)
export const getTaskCount = <T = TaskCount>(params?: Record<string, any>) => camundaGet<T>('/task/count', params)
export const claimTask = <T = void>(id: string, body: any) => camundaPost<T>(`/task/${encodeURIComponent(id)}/claim`, body)
export const unclaimTask = <T = void>(id: string) => camundaPost<T>(`/task/${encodeURIComponent(id)}/unclaim`)
export const setTaskAssignee = <T = void>(id: string, body: any) => camundaPost<T>(`/task/${encodeURIComponent(id)}/assignee`, body)
export const completeTask = <T = CamundaVariables | void>(id: string, body?: any) => camundaPost<T>(`/task/${encodeURIComponent(id)}/complete`, body)
export const getTaskVariables = <T = CamundaVariables>(id: string) => camundaGet<T>(`/task/${encodeURIComponent(id)}/variables`)
export const updateTaskVariables = <T = void>(id: string, body: any) => camundaPost<T>(`/task/${encodeURIComponent(id)}/variables`, body)
export const getTaskForm = <T = TaskForm>(id: string) => camundaGet<T>(`/task/${encodeURIComponent(id)}/form`)

// -----------------------------
// External task helpers
// -----------------------------
export const fetchAndLockExternalTasks = <T = ExternalTask[]>(body: any) => camundaPost<T>('/external-task/fetchAndLock', body)
export const getExternalTasks = <T = ExternalTask[]>(params?: Record<string, any>) => camundaGet<T>('/external-task', params)
export const completeExternalTask = <T = void>(id: string, body: any) => camundaPost<T>(`/external-task/${encodeURIComponent(id)}/complete`, body)
export const handleExternalTaskFailure = <T = void>(id: string, body: any) => camundaPost<T>(`/external-task/${encodeURIComponent(id)}/failure`, body)
export const handleExternalTaskBpmnError = <T = void>(id: string, body: any) => camundaPost<T>(`/external-task/${encodeURIComponent(id)}/bpmnError`, body)
export const extendExternalTaskLock = <T = void>(id: string, body: any) => camundaPost<T>(`/external-task/${encodeURIComponent(id)}/extendLock`, body)
export const unlockExternalTask = <T = void>(id: string) => camundaPost<T>(`/external-task/${encodeURIComponent(id)}/unlock`)
export const setExternalTaskRetries = <T = void>(id: string, body: any) => camundaPut<T>(`/external-task/${encodeURIComponent(id)}/retries`, body)

// -----------------------------
// Message & Signal helpers
// -----------------------------
export const correlateMessage = <T = MessageCorrelationResult[]>(body: any) => camundaPost<T>('/message', body)
export const deliverSignal = <T = void>(body: any) => camundaPost<T>('/signal', body)

// -----------------------------
// Decision definition helpers
// -----------------------------
export const getDecisionDefinitions = <T = DecisionDefinition[]>(params?: Record<string, any>) => camundaGet<T>('/decision-definition', params)
export const getDecisionDefinition = <T = DecisionDefinition>(id: string) => camundaGet<T>(`/decision-definition/${encodeURIComponent(id)}`)
export const getDecisionDefinitionXml = <T = DecisionDefinitionXml>(id: string) => camundaGet<T>(`/decision-definition/${encodeURIComponent(id)}/xml`)
export const evaluateDecision = <T = DecisionResult[]>(id: string, body: any) => camundaPost<T>(`/decision-definition/${encodeURIComponent(id)}/evaluate`, body)

// -----------------------------
// Job helpers
// -----------------------------
export const getJobs = <T = Job[]>(params?: Record<string, any>) => camundaGet<T>('/job', params)
export const getJob = <T = Job>(id: string) => camundaGet<T>(`/job/${encodeURIComponent(id)}`)
export const executeJob = <T = void>(id: string) => camundaPost<T>(`/job/${encodeURIComponent(id)}/execute`)
export const setJobRetries = <T = void>(id: string, body: any) => camundaPut<T>(`/job/${encodeURIComponent(id)}/retries`, body)
export const setJobSuspensionState = <T = void>(id: string, body: any) => camundaPut<T>(`/job/${encodeURIComponent(id)}/suspended`, body)
export const setJobDuedate = <T = void>(id: string, body: any) => camundaPut<T>(`/job/${encodeURIComponent(id)}/duedate`, body)

// Job definition helpers
export const getJobDefinitions = <T = JobDefinition[]>(params?: Record<string, any>) => camundaGet<T>('/job-definition', params)
export const setJobDefinitionRetries = <T = void>(id: string, body: any) => camundaPut<T>(`/job-definition/${encodeURIComponent(id)}/retries`, body)
export const setJobDefinitionSuspensionState = <T = void>(id: string, body: any) => camundaPut<T>(`/job-definition/${encodeURIComponent(id)}/suspended`, body)

// -----------------------------
// Extended history helpers
// -----------------------------
export const getHistoricTaskInstances = <T = HistoricTaskInstance[]>(params?: Record<string, any>) => camundaGet<T>('/history/task', params)
export const getHistoricVariableInstances = <T = HistoricVariableInstance[]>(params?: Record<string, any>) => camundaGet<T>('/history/variable-instance', params)
export const getHistoricDecisionInstances = <T = HistoricDecisionInstance[]>(params?: Record<string, any>) => camundaGet<T>('/history/decision-instance', params)

// Fetch a single historic decision instance by ID with optional inputs/outputs embedded.
// includeInputs and includeOutputs query params tell Camunda to embed those arrays in the response.
export async function getHistoricDecisionInstanceById<T = HistoricDecisionInstance>(
  id: string,
  options?: { includeInputs?: boolean; includeOutputs?: boolean }
): Promise<T> {
  const params: Record<string, boolean> = {}
  if (options?.includeInputs) params.includeInputs = true
  if (options?.includeOutputs) params.includeOutputs = true
  return await camundaGet<T>(`/history/decision-instance/${encodeURIComponent(id)}`, params)
}

// Helper to extract inputs from a decision instance fetched with includeInputs=true.
export async function getHistoricDecisionInstanceInputs<T = unknown>(id: string): Promise<T> {
  const instance = await getHistoricDecisionInstanceById<any>(id, { includeInputs: true })
  return (instance?.inputs ?? []) as T
}

// Helper to extract outputs from a decision instance fetched with includeOutputs=true.
export async function getHistoricDecisionInstanceOutputs<T = unknown>(id: string): Promise<T> {
  const instance = await getHistoricDecisionInstanceById<any>(id, { includeOutputs: true })
  return (instance?.outputs ?? []) as T
}
export const getUserOperationLog = <T = UserOperationLogEntry[]>(params?: Record<string, any>) => camundaGet<T>('/history/user-operation', params)

// -----------------------------
// Metrics helpers
// -----------------------------
export const getMetrics = <T = Metric[]>(params?: Record<string, any>) => camundaGet<T>('/metrics', params)
export const getMetricByName = <T = MetricResult>(name: string, params?: Record<string, any>) => camundaGet<T>(`/metrics/${encodeURIComponent(name)}`, params)

// -----------------------------
// Modification & Restart helpers
// -----------------------------
export const postProcessInstanceModification = <T = void>(id: string, body: any) => camundaPost<T>(`/process-instance/${encodeURIComponent(id)}/modification`, body)
export const postProcessDefinitionModificationAsync = <T = Batch>(id: string, body: any) => camundaPost<T>(`/process-definition/${encodeURIComponent(id)}/modification/executeAsync`, body)
export const postProcessDefinitionRestartAsync = <T = Batch>(id: string, body: any) => camundaPost<T>(`/process-definition/${encodeURIComponent(id)}/restart/executeAsync`, body)
