import { Router, Request, Response } from 'express'
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js'
import { requireAuth } from '@shared/middleware/auth.js'
import { requireActiveEngineReadOrWrite } from '@shared/middleware/activeEngineAuth.js'
import {
  listProcessInstances,
  getProcessInstance,
  getProcessInstanceVariables,
  getActivityInstances,
  deleteProcessInstance,
  modifyProcessInstanceVariables,
} from './service.js'

const r = Router()

r.use(requireAuth, requireActiveEngineReadOrWrite())

// List process instances
r.get('/mission-control-api/process-instances', asyncHandler(async (req: Request, res: Response) => {
  const { processDefinitionKey, active, suspended } = req.query as { processDefinitionKey?: string; active?: string; suspended?: string }
  const data = await listProcessInstances({
    processDefinitionKey,
    active: active === 'true' || active === '1',
    suspended: suspended === 'true' || suspended === '1',
  })
  res.json(data)
}))

// Get process instance by ID
r.get('/mission-control-api/process-instances/:id', asyncHandler(async (req: Request, res: Response) => {
  const data = await getProcessInstance(req.params.id)
  res.json(data)
}))

// Get process instance variables
r.get('/mission-control-api/process-instances/:id/variables', asyncHandler(async (req: Request, res: Response) => {
  const data = await getProcessInstanceVariables(req.params.id)
  res.json(data)
}))

// Get activity instances for a process instance
r.get('/mission-control-api/process-instances/:id/activity-instances', asyncHandler(async (req: Request, res: Response) => {
  const data = await getActivityInstances(req.params.id)
  res.json(data)
}))

// Delete process instance
r.delete('/mission-control-api/process-instances/:id', asyncHandler(async (req: Request, res: Response) => {
  const { skipCustomListeners, skipIoMappings, deleteReason } = req.query as { skipCustomListeners?: string; skipIoMappings?: string; deleteReason?: string }
  await deleteProcessInstance(req.params.id, {
    skipCustomListeners: skipCustomListeners === 'true',
    skipIoMappings: skipIoMappings === 'true',
    deleteReason: deleteReason?.trim() || undefined,
  })
  res.status(204).end()
}))

// Modify process instance variables
r.post('/mission-control-api/process-instances/:id/variables', asyncHandler(async (req: Request, res: Response) => {
  const { modifications } = req.body || {}
  if (!modifications) throw Errors.validation('modifications required')
  await modifyProcessInstanceVariables(req.params.id, modifications)
  res.status(204).end()
}))

export default r
