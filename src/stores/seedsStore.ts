import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSeedById, pickDailySeed, SEED_IDS } from '../constants/seeds'
import type { OhangType } from '../constants/strings'
import type { SeedMaster } from '../constants/seeds'

export interface InventorySeed {
  id: string
  seedId: string
  speciesName: string
  ohangType: OhangType
  rarity: 'normal' | 'rare'
  grantSource: 'welcome' | 'daily' | 'premium_monthly'
  receivedAt: string
}

interface SeedsState {
  inventory: InventorySeed[]
  hasReceivedToday: boolean
  todaySeed: InventorySeed | null
  grantDailySeed: (energyCode: OhangType) => InventorySeed
  grantWelcomeSeed: () => InventorySeed
  removeFromInventory: (id: string) => void
  getSeed: (id: string) => InventorySeed | undefined
  setInventory: (seeds: InventorySeed[]) => void
  markReceivedToday: () => void
  reset: () => void
}

function toInventorySeed(
  master: SeedMaster,
  grantSource: InventorySeed['grantSource'],
): InventorySeed {
  return {
    id: `useed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    seedId: master.id,
    speciesName: master.speciesName,
    ohangType: master.energyCode,
    rarity: master.rarity,
    grantSource,
    receivedAt: new Date().toISOString(),
  }
}

export const useSeedsStore = create<SeedsState>()(
  persist(
    (set, get) => ({
      inventory: [],
      hasReceivedToday: false,
      todaySeed: null,
      grantDailySeed: (energyCode) => {
        const master = pickDailySeed(energyCode)
        const seed = toInventorySeed(master, 'daily')
        set((s) => ({
          todaySeed: seed,
          hasReceivedToday: true,
          inventory: [...s.inventory, seed],
        }))
        return seed
      },
      grantWelcomeSeed: () => {
        const master = getSeedById(SEED_IDS.woodNormal1)!
        const seed = toInventorySeed(master, 'welcome')
        set((s) => ({ inventory: [...s.inventory, seed] }))
        return seed
      },
      removeFromInventory: (id) =>
        set((s) => ({
          inventory: s.inventory.filter((x) => x.id !== id),
        })),
      getSeed: (id) => get().inventory.find((x) => x.id === id),
      setInventory: (inventory) => set({ inventory }),
      markReceivedToday: () => set({ hasReceivedToday: true }),
      reset: () => set({ inventory: [], hasReceivedToday: false, todaySeed: null }),
    }),
    { name: 'stargarden-seeds' },
  ),
)
