import { apiClient } from '../../../../shared/api/client'

// Types
export type Batch = {
  id: string
  type: string
  totalJobs: number
  jobsCreated: number
  batchJobsPerSeed: number
  invocationsPerBatchJob: number
  seedJobDefinitionId: string
  monitorJobDefinitionId: string
  batchJobDefinitionId: string
  suspended: boolean
  tenantId?: string
  createUserId?: string
  startTime?: string
  executionStartTime?: string
}

export type BatchStatistics = {
  remainingJobs: number
  completedJobs: number
  failedJobs: number
}

// API Functions
export async function getBatches(engineId?: string): Promise<Batch[]> {
  const params = new URLSearchParams()
  if (engineId) params.set('engineId', engineId)
  return apiClient.get<Batch[]>(`/mission-control-api/batches?${params}`, undefined, { credentials: 'include' })
}

export async function getBatch(batchId: string): Promise<Batch> {
  return apiClient.get<Batch>(`/mission-control-api/batches/${batchId}`, undefined, { credentials: 'include' })
}

export async function getBatchStatistics(batchId: string): Promise<BatchStatistics> {
  return apiClient.get<BatchStatistics>(`/mission-control-api/batches/${batchId}/statistics`, undefined, { credentials: 'include' })
}

export async function deleteBatch(batchId: string, cascade = true): Promise<void> {
  const params = new URLSearchParams()
  params.set('cascade', String(cascade))
  return apiClient.delete(`/mission-control-api/batches/${batchId}?${params}`, { credentials: 'include' })
}

export async function suspendBatch(batchId: string): Promise<void> {
  await apiClient.put(`/mission-control-api/batches/${batchId}/suspended`, { suspended: true }, { credentials: 'include' })
}

export async function activateBatch(batchId: string): Promise<void> {
  await apiClient.put(`/mission-control-api/batches/${batchId}/suspended`, { suspended: false }, { credentials: 'include' })
}

export interface CreateBatchParams {
  processInstanceIds?: string[]
  processInstanceQuery?: Record<string, unknown>
}

export async function createDeleteBatch(params: CreateBatchParams): Promise<Batch> {
  return apiClient.post<Batch>('/mission-control-api/batches/delete', params, { credentials: 'include' })
}

export async function createSuspendBatch(params: CreateBatchParams): Promise<Batch> {
  return apiClient.post<Batch>('/mission-control-api/batches/suspend', params, { credentials: 'include' })
}

export async function createActivateBatch(params: CreateBatchParams): Promise<Batch> {
  return apiClient.post<Batch>('/mission-control-api/batches/activate', params, { credentials: 'include' })
}

export async function createRetriesBatch(params: CreateBatchParams & { retries: number }): Promise<Batch> {
  return apiClient.post<Batch>('/mission-control-api/batches/retries', params, { credentials: 'include' })
}

// Bulk operations on process instances
export async function createBulkRetryBatch(processInstanceIds: string[]): Promise<unknown> {
  return apiClient.post<unknown>('/mission-control-api/batches/jobs/retries', { processInstanceIds }, { credentials: 'include' })
}

export async function createBulkDeleteBatch(processInstanceIds: string[], deleteReason?: string): Promise<unknown> {
  return apiClient.post<unknown>('/mission-control-api/batches/process-instances/delete', {
    processInstanceIds,
    deleteReason: deleteReason || 'Canceled via Mission Control',
    skipCustomListeners: true,
    skipIoMappings: true,
  }, { credentials: 'include' })
}

export async function createBulkSuspendBatch(processInstanceIds: string[]): Promise<unknown> {
  return apiClient.post<unknown>('/mission-control-api/batches/process-instances/suspend', { processInstanceIds }, { credentials: 'include' })
}

export async function createBulkActivateBatch(processInstanceIds: string[]): Promise<unknown> {
  return apiClient.post<unknown>('/mission-control-api/batches/process-instances/activate', { processInstanceIds }, { credentials: 'include' })
}
