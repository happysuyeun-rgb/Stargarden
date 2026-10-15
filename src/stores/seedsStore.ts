import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSeedById, pickDailySeed, SEED_IDS, SEEDS } from '../constants/seeds'
import type { OhangType } from '../constants/strings'
import type { SeedMaster } from '../constants/seeds'
import { getKSTDateString } from '../lib/datetime'

export interface InventorySeed {
  id: string
  seedId: string
  speciesName: string
  ohangType: OhangType
  rarity: 'normal' | 'rare'
  grantSource: 'welcome' | 'daily' | 'premium_monthly'
  receivedAt: string
}

interface SeedsPersisted {
  inventory: InventorySeed[]
  lastReceivedDate: string | null
  todaySeed: InventorySeed | null
}

interface SeedsState extends SeedsPersisted {
  grantDailySeed: (energyCode: OhangType) => InventorySeed | null
  grantWelcomeSeed: (ohangType: OhangType) => InventorySeed
  removeFromInventory: (id: string) => void
  getSeed: (id: string) => InventorySeed | undefined
  setInventory: (seeds: InventorySeed[]) => void
  markReceivedToday: () => void
  clearStaleTodaySeed: () => void
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

const emptySeeds: SeedsPersisted = {
  inventory: [],
  lastReceivedDate: null,
  todaySeed: null,
}

export function hasReceivedSeedToday(
  lastReceivedDate: string | null,
  now = new Date(),
): boolean {
  return lastReceivedDate === getKSTDateString(now)
}

export const useSeedsStore = create<SeedsState>()(
  persist(
    (set, get) => ({
      ...emptySeeds,
      grantDailySeed: (energyCode) => {
        const today = getKSTDateString()
        const current = get()
        if (current.lastReceivedDate === today) return current.todaySeed

        const master = pickDailySeed(energyCode)
        const seed = toInventorySeed(master, 'daily')
        set((s) => ({
          todaySeed: seed,
          lastReceivedDate: today,
          inventory: [...s.inventory, seed],
        }))
        return seed
      },
      grantWelcomeSeed: (ohangType) => {
        const pool = SEEDS.filter((s) => s.energyCode === ohangType && s.rarity === 'normal')
        const master = pool[Math.floor(Math.random() * pool.length)] ?? getSeedById(SEED_IDS.woodNormal1)!
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
      markReceivedToday: () => set({ lastReceivedDate: getKSTDateString() }),
      clearStaleTodaySeed: () => {
        const today = getKSTDateString()
        const { lastReceivedDate, todaySeed } = get()
        if (todaySeed && lastReceivedDate !== today) set({ todaySeed: null })
      },
      reset: () => set(emptySeeds),
    }),
    {
      name: 'stargarden-seeds',
      version: 1,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<SeedsPersisted> & {
          hasReceivedToday?: boolean
        }
        if (version < 1 || state.lastReceivedDate === undefined) {
          return {
            inventory: state.inventory ?? [],
            lastReceivedDate: null,
            todaySeed: null,
          }
        }
        return {
          inventory: state.inventory ?? [],
          lastReceivedDate: state.lastReceivedDate,
          todaySeed: state.todaySeed ?? null,
        }
      },
    },
  ),
)
