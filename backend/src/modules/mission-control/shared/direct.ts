import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js'
import { validateBody } from '@shared/middleware/validate.js'
import { requireAuth } from '@shared/middleware/auth.js'
import { requireActiveEngineDeployer } from '@shared/middleware/activeEngineAuth.js'
import {
  deleteProcessInstancesDirect,
  suspendActivateProcessInstancesDirect,
  setJobRetriesDirect,
  executeMigrationDirect,
} from './direct-service.js'

const r = Router()

r.use(requireAuth, requireActiveEngineDeployer())

// Delete instances directly (no batch)
r.post('/mission-control-api/direct/process-instances/delete', asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      processInstanceIds = [],
      skipCustomListeners,
      skipIoMappings,
      failIfNotExists,
      skipSubprocesses,
      deleteReason,
    } = req.body || {}
    const results = await deleteProcessInstancesDirect({
      processInstanceIds,
      skipCustomListeners,
      skipIoMappings,
      failIfNotExists,
      skipSubprocesses,
      deleteReason,
    })
    res.json({ total: results.length, succeeded: results.filter(r => r.ok).map(r => r.id), failed: results.filter(r => !r.ok) })
  } catch (e: any) {
    throw Errors.internal(e?.message || 'Direct delete failed')
  }
}))

// Suspend/Activate directly
r.post('/mission-control-api/direct/process-instances/suspend', asyncHandler(async (req: Request, res: Response) => {
  try {
    const ids: string[] = (req.body?.processInstanceIds || []) as string[]
    const results = await suspendActivateProcessInstancesDirect(ids, true)
    res.json({ total: results.length, succeeded: results.filter(r => r.ok).map(r => r.id), failed: results.filter(r => !r.ok) })
  } catch (e: any) {
    throw Errors.internal(e?.message || 'Direct suspend failed')
  }
}))

r.post('/mission-control-api/direct/process-instances/activate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const ids: string[] = (req.body?.processInstanceIds || []) as string[]
    const results = await suspendActivateProcessInstancesDirect(ids, false)
    res.json({ total: results.length, succeeded: results.filter(r => r.ok).map(r => r.id), failed: results.filter(r => !r.ok) })
  } catch (e: any) {
    throw Errors.internal(e?.message || 'Direct activate failed')
  }
}))

// Set retries directly
r.post('/mission-control-api/direct/jobs/retries', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { processInstanceIds = [], retries = 1, onlyFailed = true } = req.body || {}
    const results = await setJobRetriesDirect({ processInstanceIds, retries, onlyFailed })
    res.json({ total: results.length, succeeded: results.filter(r => r.ok).map(r => r.id), failed: results.filter(r => !r.ok) })
  } catch (e: any) {
    throw Errors.internal(e?.message || 'Direct retries failed')
  }
}))

// Migration execute (sync)
r.post('/mission-control-api/migration/execute-direct', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { plan, processInstanceIds, skipCustomListeners, skipIoMappings } = req.body || {}
    const result = await executeMigrationDirect({
      plan,
      processInstanceIds,
      skipCustomListeners,
      skipIoMappings,
    })
    res.json({ ok: true, engine: result })
  } catch (e: any) {
    throw Errors.internal(e?.message || 'Direct migration failed')
  }
})) 

export default r
