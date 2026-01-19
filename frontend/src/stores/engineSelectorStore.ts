import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EngineSelectorState {
  selectedEngineId: string | null // null means "All Engines"
  setSelectedEngineId: (id: string | null) => void
}

export const useEngineSelectorStore = create<EngineSelectorState>()(
  persist(
    (set) => ({
      selectedEngineId: null,
      setSelectedEngineId: (id) => set({ selectedEngineId: id }),
    }),
    {
      name: 'engine-selector',
    }
  )
)
