import { Router, Request, Response } from 'express'
import { asyncHandler } from '@shared/middleware/errorHandler.js'
import { requireAuth } from '@shared/middleware/auth.js'
import { requireActiveEngineReadOrWrite } from '@shared/middleware/activeEngineAuth.js'
import {
  listProcessDefinitions,
  getProcessDefinition,
  getProcessDefinitionXml,
  getProcessDefinitionStatistics,
  startProcessInstance,
} from './service.js'

const r = Router()

r.use(requireAuth, requireActiveEngineReadOrWrite())

// List process definitions
r.get('/mission-control-api/process-definitions', asyncHandler(async (req: Request, res: Response) => {
  const { key, nameLike, latest } = req.query as { key?: string; nameLike?: string; latest?: string }
  const data = await listProcessDefinitions({
    key,
    nameLike,
    latestVersion: latest === 'true' || latest === '1',
  })
  res.json(data)
}))

// Get process definition by ID
r.get('/mission-control-api/process-definitions/:id', asyncHandler(async (req: Request, res: Response) => {
  const data = await getProcessDefinition(req.params.id)
  res.json(data)
}))

// Get process definition XML
r.get('/mission-control-api/process-definitions/:id/xml', asyncHandler(async (req: Request, res: Response) => {
  const data = await getProcessDefinitionXml(req.params.id)
  res.json(data)
}))

// Get process definition statistics (activity instance counts)
r.get('/mission-control-api/process-definitions/key/:key/statistics', asyncHandler(async (req: Request, res: Response) => {
  const data = await getProcessDefinitionStatistics(req.params.key)
  res.json(data)
}))

// Start process instance
r.post('/mission-control-api/process-definitions/key/:key/start', asyncHandler(async (req: Request, res: Response) => {
  const { variables, businessKey } = req.body || {}
  const data = await startProcessInstance(req.params.key, { variables, businessKey })
  res.json(data)
}))

export default r
