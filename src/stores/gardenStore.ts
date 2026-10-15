import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GARDEN_START_SLOTS } from '../constants/game'
import { getSeedById } from '../constants/seeds'
import { slotsFromBloomCount } from '../lib/gardenSlots'
import { calcGrowthProgress, getGrowthStage } from '../lib/growth'
import { useSeedsStore } from './seedsStore'

export interface GardenPlant {
  id: string
  userSeedId: string
  seedId: string
  slotIndex: number
  speciesName: string
  ohangType: string
  rarity: 'normal' | 'rare'
  requiredHours: number
  plantedAt: string
  careBonusHours: number
  lastWateredAt: string | null
  starlightTapsToday: number
  starlightDate: string | null
  bloomedAt: string | null
}

export interface PlantingMode {
  active: boolean
  userSeedId: string | null
}

interface GardenState {
  slots: number
  totalBlooms: number
  plants: GardenPlant[]
  plantingMode: PlantingMode
  isSoundOn: boolean
  pendingBloomId: string | null
  setSlots: (slots: number) => void
  setPlants: (plants: GardenPlant[]) => void
  startPlanting: (userSeedId: string) => void
  cancelPlanting: () => void
  plantAtSlot: (slotIndex: number) => boolean
  updatePlant: (id: string, updater: (p: GardenPlant) => GardenPlant) => void
  markBloomed: (id: string) => void
  setPendingBloom: (id: string | null) => void
  toggleSound: () => void
  reset: () => void
}

export function computePlantProgress(plant: GardenPlant, now = new Date()) {
  const progress = calcGrowthProgress({
    plantedAt: new Date(plant.plantedAt),
    requiredHours: plant.requiredHours,
    careBonusHours: plant.careBonusHours,
    now,
  })
  const growthStage = plant.bloomedAt ? 2 : getGrowthStage(progress)
  return { progress, growthStage }
}

const initialState = {
  slots: GARDEN_START_SLOTS,
  totalBlooms: 0,
  plants: [] as GardenPlant[],
  plantingMode: { active: false, userSeedId: null } as PlantingMode,
  isSoundOn: false,
  pendingBloomId: null as string | null,
}

export const useGardenStore = create<GardenState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setSlots: (slots) => set({ slots }),
      setPlants: (plants) => set({ plants }),
      startPlanting: (userSeedId) =>
        set({ plantingMode: { active: true, userSeedId } }),
      cancelPlanting: () =>
        set({ plantingMode: { active: false, userSeedId: null } }),
      plantAtSlot: (slotIndex) => {
        const { plantingMode, plants, slots } = get()
        if (!plantingMode.active || !plantingMode.userSeedId) return false
        if (slotIndex < 0 || slotIndex >= slots) return false
        if (plants.some((p) => p.slotIndex === slotIndex)) return false

        const seedInfo = useSeedsStore.getState().getSeed(plantingMode.userSeedId)
        if (!seedInfo) return false

        const master = getSeedById(seedInfo.seedId)
        if (!master) return false

        const now = new Date().toISOString()
        const plant: GardenPlant = {
          id: `plant-${Date.now()}`,
          userSeedId: plantingMode.userSeedId,
          seedId: master.id,
          slotIndex,
          speciesName: master.speciesName,
          ohangType: master.energyCode,
          rarity: master.rarity,
          requiredHours: master.requiredHours,
          plantedAt: now,
          careBonusHours: 0,
          lastWateredAt: null,
          starlightTapsToday: 0,
          starlightDate: null,
          bloomedAt: null,
        }

        useSeedsStore.getState().removeFromInventory(plantingMode.userSeedId)
        set({
          plants: [...plants, plant],
          plantingMode: { active: false, userSeedId: null },
        })
        return true
      },
      updatePlant: (id, updater) =>
        set((s) => ({
          plants: s.plants.map((p) => (p.id === id ? updater(p) : p)),
        })),
      markBloomed: (id) =>
        set((s) => {
          const totalBlooms = s.totalBlooms + 1
          const slots = slotsFromBloomCount(totalBlooms)
          return {
            totalBlooms,
            slots,
            plants: s.plants.map((p) =>
              p.id === id ? { ...p, bloomedAt: new Date().toISOString() } : p,
            ),
            pendingBloomId: null,
          }
        }),
      setPendingBloom: (pendingBloomId) => set({ pendingBloomId }),
      toggleSound: () => set((s) => ({ isSoundOn: !s.isSoundOn })),
      reset: () => set(initialState),
    }),
    {
      name: 'stargarden-garden',
      version: 1,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as { plants?: Array<Record<string, unknown>> }
        const legacyKeys = ['is' + 'Sleeping', 'slept' + 'At']
        return {
          ...state,
          plants: (state.plants ?? []).map((plant) => {
            const next = { ...plant }
            for (const key of legacyKeys) delete next[key]
            return next
          }),
        }
      },
    },
  ),
)
