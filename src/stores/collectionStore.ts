import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GardenPlant } from './gardenStore'

export interface CollectionEntry {
  seedId: string
  firstBloomedAt: string
  bloomCount: number
}

interface CollectionState {
  entries: CollectionEntry[]
  registerBloom: (seedId: string, bloomedAt?: string) => void
  syncFromPlants: (plants: GardenPlant[]) => void
  isCollected: (seedId: string) => boolean
  getEntry: (seedId: string) => CollectionEntry | undefined
  reset: () => void
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      entries: [],
      registerBloom: (seedId, bloomedAt = new Date().toISOString()) => {
        const existing = get().entries.find((e) => e.seedId === seedId)
        if (existing) {
          set((s) => ({
            entries: s.entries.map((e) =>
              e.seedId === seedId ? { ...e, bloomCount: e.bloomCount + 1 } : e,
            ),
          }))
          return
        }
        set((s) => ({
          entries: [...s.entries, { seedId, firstBloomedAt: bloomedAt, bloomCount: 1 }],
        }))
      },
      syncFromPlants: (plants) => {
        const bloomed = plants.filter((p) => p.bloomedAt)
        if (bloomed.length === 0) return
        set((s) => {
          const map = new Map(s.entries.map((e) => [e.seedId, e]))
          for (const p of bloomed) {
            if (!map.has(p.seedId)) {
              map.set(p.seedId, {
                seedId: p.seedId,
                firstBloomedAt: p.bloomedAt!,
                bloomCount: 1,
              })
            }
          }
          return { entries: [...map.values()] }
        })
      },
      isCollected: (seedId) => get().entries.some((e) => e.seedId === seedId),
      getEntry: (seedId) => get().entries.find((e) => e.seedId === seedId),
      reset: () => set({ entries: [] }),
    }),
    {
      name: 'stargarden-collection',
      version: 1,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as { entries?: Array<Partial<CollectionEntry>> }
        return {
          ...state,
          entries: (state.entries ?? []).map((entry) => ({
            seedId: entry.seedId ?? '',
            firstBloomedAt: entry.firstBloomedAt ?? new Date(0).toISOString(),
            bloomCount: entry.bloomCount ?? 1,
          })),
        }
      },
    },
  ),
)
