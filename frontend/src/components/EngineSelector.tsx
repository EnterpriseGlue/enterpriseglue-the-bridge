import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dropdown } from '@carbon/react'
import { useEngineSelectorStore } from '../stores/engineSelectorStore'
import { apiClient } from '../shared/api/client'

type Engine = {
  id: string
  name: string
  baseUrl: string
  active: boolean
}

type EngineWithAccess = Engine & {
  isOwner?: boolean
  isDelegate?: boolean
}

async function fetchAccessibleEngines(): Promise<EngineWithAccess[]> {
  return apiClient.get<EngineWithAccess[]>('/engines-api/engines', undefined, { credentials: 'include' }).catch(() => [])
}

interface EngineSelectorProps {
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function EngineSelector({ style, size = 'sm', label = 'Engine' }: EngineSelectorProps) {
  const { selectedEngineId, setSelectedEngineId } = useEngineSelectorStore()

  const enginesQuery = useQuery({
    queryKey: ['engines-selector'],
    queryFn: fetchAccessibleEngines,
    staleTime: 60000,
  })

  const engines = enginesQuery.data || []

  // Auto-select single engine
  React.useEffect(() => {
    if (engines.length === 1 && !selectedEngineId) {
      setSelectedEngineId(engines[0].id)
    }
  }, [engines, selectedEngineId, setSelectedEngineId])

  // Build items list with "All Engines" option
  const items = React.useMemo(() => {
    if (engines.length === 0) return []
    return [
      { id: '__all__', label: 'All Engines' },
      ...engines.map(e => ({ id: e.id, label: e.name || e.baseUrl })),
    ]
  }, [engines])

  // Find current selection
  const currentItem = React.useMemo(() => {
    if (items.length === 0) return null
    return selectedEngineId
      ? items.find(i => i.id === selectedEngineId) || items[0]
      : items[0]
  }, [items, selectedEngineId])

  // Don't render if loading or no engines - but keep hook count stable
  if (enginesQuery.isLoading || engines.length === 0) {
    return null
  }

  return (
    <Dropdown
      id="engine-selector"
      titleText=""
      label={label}
      size={size}
      items={items}
      itemToString={(item: any) => item?.label || ''}
      selectedItem={currentItem}
      onChange={({ selectedItem }: any) => {
        const id = selectedItem?.id === '__all__' ? null : selectedItem?.id
        setSelectedEngineId(id)
      }}
      style={{ minWidth: '180px', ...style }}
    />
  )
}

// Hook to get the current engine filter for queries
export function useSelectedEngine() {
  const { selectedEngineId } = useEngineSelectorStore()
  return selectedEngineId
}
