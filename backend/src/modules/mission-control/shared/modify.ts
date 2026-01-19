import { Router, Request, Response } from 'express'
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js'
import { validateBody } from '@shared/middleware/validate.js'
import { requireAuth } from '@shared/middleware/auth.js'
import { requireActiveEngineDeployer } from '@shared/middleware/activeEngineAuth.js'
import {
  modifyProcessInstance,
  modifyProcessDefinitionAsync,
  restartProcessDefinitionAsync,
} from './modify-service.js'
import {
  ProcessInstanceModificationRequest,
  ProcessDefinitionModificationAsyncRequest,
  ProcessDefinitionRestartAsyncRequest,
} from '@shared/schemas/mission-control/modify.js'

const r = Router()

r.use(requireAuth, requireActiveEngineDeployer())

// POST /mission-control-api/process-instances/:id/modify (sync)
r.post('/mission-control-api/process-instances/:id/modify', validateBody(ProcessInstanceModificationRequest), asyncHandler(async (req: Request, res: Response) => {
  await modifyProcessInstance(req.params.id, req.body)
  res.status(204).end()
}))

// POST /mission-control-api/process-definitions/:id/modification/execute-async (batch)
r.post('/mission-control-api/process-definitions/:id/modification/execute-async', validateBody(ProcessDefinitionModificationAsyncRequest), asyncHandler(async (req: Request, res: Response) => {
  const { batchId, camundaBatchId } = await modifyProcessDefinitionAsync(req.params.id, req.body)
  res.status(201).json({ id: batchId, camundaBatchId, type: 'MODIFY_INSTANCES' })
}))

// POST /mission-control-api/process-definitions/:id/restart/execute-async (batch)
r.post('/mission-control-api/process-definitions/:id/restart/execute-async', validateBody(ProcessDefinitionRestartAsyncRequest), asyncHandler(async (req: Request, res: Response) => {
  const { batchId, camundaBatchId } = await restartProcessDefinitionAsync(req.params.id, req.body)
  res.status(201).json({ id: batchId, camundaBatchId, type: 'RESTART_INSTANCES' })
}))

export default r
