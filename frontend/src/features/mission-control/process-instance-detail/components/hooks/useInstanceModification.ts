import { useState, useEffect, useCallback } from 'react'
import type { ModificationOperation } from '../types'
import { useAlert } from '../../../../../shared/hooks/useAlert'
import { apiClient } from '../../../../../shared/api/client'
import { getUiErrorMessage } from '../../../../../shared/api/apiErrorUtils'

interface UseInstanceModificationProps {
  instanceId: string
  status: string
  actQ: any
  incidentsQ: any
  runtimeQ: any
  engineId?: string
}

export function useInstanceModification({ instanceId, status, actQ, incidentsQ, runtimeQ, engineId }: UseInstanceModificationProps) {
  const { showAlert } = useAlert()
  const [isModMode, setIsModMode] = useState(false)
  const [modPlan, setModPlan] = useState<ModificationOperation[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [moveSourceActivityId, setMoveSourceActivityId] = useState<string | null>(null)
  const [showModIntro, setShowModIntro] = useState(false)
  const [suppressIntroNext, setSuppressIntroNext] = useState(false)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [applyBusy, setApplyBusy] = useState(false)
  const [queuedModActivityId, setQueuedModActivityId] = useState<string | null>(null)

  // Clear selection when exiting mod mode
  useEffect(() => {
    if (!isModMode) {
      setSelectedActivityId(null)
      setMoveSourceActivityId(null)
    }
  }, [isModMode])

  const openModificationIntro = useCallback(() => {
    if (status !== 'ACTIVE') return
    try {
      if (typeof window !== 'undefined') {
        const suppressed = window.localStorage.getItem('vt_mod_intro_suppressed') === '1'
        if (suppressed) {
          setIsModMode(true)
          return
        }
      }
    } catch {}
    setSuppressIntroNext(false)
    setShowModIntro(true)
  }, [status])

  const requestExitModificationMode = useCallback(() => {
    if (modPlan.length > 0) {
      setDiscardConfirmOpen(true)
      return
    }
    setIsModMode(false)
    setSelectedActivityId(null)
    setMoveSourceActivityId(null)
  }, [modPlan.length])

  const addPlanOperation = useCallback(
    (kind: 'add' | 'cancel') => {
      if (!selectedActivityId) return
      if (kind === 'add') {
        setModPlan(prev => [...prev, { kind: 'add', activityId: selectedActivityId }])
      } else {
        setModPlan(prev => [...prev, { kind: 'cancel', activityId: selectedActivityId }])
      }
    },
    [selectedActivityId]
  )

  const toggleMoveForSelection = useCallback(() => {
    if (!selectedActivityId) return
    if (!moveSourceActivityId) {
      setMoveSourceActivityId(selectedActivityId)
      return
    }
    if (moveSourceActivityId === selectedActivityId) {
      setMoveSourceActivityId(null)
      return
    }
    setModPlan(prev => [...prev, { kind: 'move', fromActivityId: moveSourceActivityId, toActivityId: selectedActivityId }])
    setMoveSourceActivityId(null)
  }, [selectedActivityId, moveSourceActivityId])

  const removePlanItem = useCallback((index: number) => {
    setModPlan(prev => prev.filter((_, i) => i !== index))
  }, [])

  const applyModifications = useCallback(async () => {
    if (modPlan.length === 0) return
    setApplyBusy(true)
    try {
      const instructions: any[] = []
      for (const op of modPlan) {
        if (op.kind === 'add' && op.activityId) {
          instructions.push({ type: 'startBeforeActivity', activityId: op.activityId })
        } else if (op.kind === 'cancel' && op.activityId) {
          instructions.push({ type: 'cancel', activityId: op.activityId, cancelCurrentActiveActivityInstances: true })
        } else if (op.kind === 'move' && op.fromActivityId && op.toActivityId) {
          instructions.push({ type: 'cancel', activityId: op.fromActivityId, cancelCurrentActiveActivityInstances: true })
          instructions.push({ type: 'startBeforeActivity', activityId: op.toActivityId })
        }
      }
      if (instructions.length === 0) {
        setApplyBusy(false)
        return
      }
      await apiClient.post(`/mission-control-api/process-instances/${instanceId}/modify`, { instructions, engineId }, { credentials: 'include' })
      await Promise.allSettled([actQ.refetch(), incidentsQ.refetch(), runtimeQ.refetch()])
      setModPlan([])
      setIsModMode(false)
      setSelectedActivityId(null)
      setMoveSourceActivityId(null)
    } catch (e: any) {
      const message = getUiErrorMessage(e, 'Failed to apply modifications')
      showAlert(`Failed to apply modifications: ${message}`, 'error')
    } finally {
      setApplyBusy(false)
    }
  }, [modPlan, instanceId, actQ, incidentsQ, runtimeQ])

  const confirmModIntro = useCallback(() => {
    if (suppressIntroNext) {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('vt_mod_intro_suppressed', '1')
        }
      } catch {}
    }
    setShowModIntro(false)
    setIsModMode(true)
  }, [suppressIntroNext])

  const discardModifications = useCallback(() => {
    setModPlan([])
    setIsModMode(false)
    setSelectedActivityId(null)
    setMoveSourceActivityId(null)
    setDiscardConfirmOpen(false)
  }, [])

  return {
    // State
    isModMode,
    modPlan,
    selectedActivityId,
    moveSourceActivityId,
    showModIntro,
    suppressIntroNext,
    discardConfirmOpen,
    applyBusy,
    queuedModActivityId,

    // Setters
    setIsModMode,
    setSelectedActivityId,
    setMoveSourceActivityId,
    setShowModIntro,
    setSuppressIntroNext,
    setDiscardConfirmOpen,
    setQueuedModActivityId,

    // Actions
    openModificationIntro,
    requestExitModificationMode,
    addPlanOperation,
    toggleMoveForSelection,
    removePlanItem,
    applyModifications,
    confirmModIntro,
    discardModifications,
  }
}
