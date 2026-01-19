import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../../shared/api/client'
import { getUiErrorMessage } from '../../../../shared/api/apiErrorUtils'
import {
  createBulkRetryBatch,
  createBulkDeleteBatch,
  createBulkSuspendBatch,
  createBulkActivateBatch,
} from '../../batches/api/batches'

interface UseBulkOperationsProps {
  selectedMap: Record<string, boolean>
  setSelectedMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  instQRefetch: () => void
  showAlert: (message: string, kind: 'error' | 'warning' | 'success' | 'info') => void
}

export function useBulkOperations({
  selectedMap,
  setSelectedMap,
  instQRefetch,
  showAlert,
}: UseBulkOperationsProps) {
  const navigate = useNavigate()
  const [bulkRetryBusy, setBulkRetryBusy] = useState(false)
  const [bulkSuspendBusy, setBulkSuspendBusy] = useState(false)
  const [bulkActivateBusy, setBulkActivateBusy] = useState(false)
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false)

  const callAction = useCallback(async (method: 'PUT' | 'DELETE', path: string) => {
    try {
      if (method === 'DELETE') {
        await apiClient.delete(path, { credentials: 'include' })
      } else {
        await apiClient.put(path, {}, { credentials: 'include' })
      }
    } catch (e: any) {
      console.error('Action failed:', e)
      const message = getUiErrorMessage(e, 'Action failed')
      showAlert(`Action failed: ${message}`, 'error')
      throw e
    }
  }, [showAlert])

  const bulkRetry = useCallback(async () => {
    const ids = Object.keys(selectedMap).filter(k => selectedMap[k])
    if (ids.length === 0) return

    setBulkRetryBusy(true)
    try {
      await createBulkRetryBatch(ids)
      navigate('/mission-control/batches')
      setSelectedMap({})
    } catch (e: any) {
      console.error('Failed to create retry batch:', e)
      const message = getUiErrorMessage(e, 'Failed to create retry batch')
      showAlert(`Failed to create retry batch: ${message}`, 'error')
      throw e
    } finally {
      setBulkRetryBusy(false)
    }
  }, [selectedMap, setSelectedMap, navigate, showAlert])

  const bulkDelete = useCallback(async () => {
    const ids = Object.keys(selectedMap).filter(k => selectedMap[k])
    if (ids.length === 0) return

    setBulkDeleteBusy(true)
    try {
      await createBulkDeleteBatch(ids)
      navigate('/mission-control/batches')
      setSelectedMap({})
    } catch (e: any) {
      console.error('Failed to create delete batch:', e)
      const message = getUiErrorMessage(e, 'Failed to create delete batch')
      showAlert(`Failed to create delete batch: ${message}`, 'error')
      throw e
    } finally {
      setBulkDeleteBusy(false)
    }
  }, [selectedMap, setSelectedMap, navigate, showAlert])

  const bulkSuspend = useCallback(async () => {
    const ids = Object.keys(selectedMap).filter(k => selectedMap[k])
    if (ids.length === 0) return

    setBulkSuspendBusy(true)
    try {
      await createBulkSuspendBatch(ids)
      navigate('/mission-control/batches')
      setSelectedMap({})
    } catch (e: any) {
      console.error('Failed to create suspend batch:', e)
      const message = getUiErrorMessage(e, 'Failed to create suspend batch')
      showAlert(`Failed to create suspend batch: ${message}`, 'error')
      throw e
    } finally {
      setBulkSuspendBusy(false)
    }
  }, [selectedMap, setSelectedMap, navigate, showAlert])

  const bulkActivate = useCallback(async () => {
    const ids = Object.keys(selectedMap).filter(k => selectedMap[k])
    if (ids.length === 0) return

    setBulkActivateBusy(true)
    try {
      await createBulkActivateBatch(ids)
      navigate('/mission-control/batches')
      setSelectedMap({})
    } catch (e: any) {
      console.error('Failed to create activate batch:', e)
      const message = getUiErrorMessage(e, 'Failed to create activate batch')
      showAlert(`Failed to create activate batch: ${message}`, 'error')
      throw e
    } finally {
      setBulkActivateBusy(false)
    }
  }, [selectedMap, setSelectedMap, navigate, showAlert])

  return {
    bulkRetryBusy,
    bulkSuspendBusy,
    bulkActivateBusy,
    bulkDeleteBusy,
    callAction,
    bulkRetry,
    bulkDelete,
    bulkSuspend,
    bulkActivate,
  }
}
