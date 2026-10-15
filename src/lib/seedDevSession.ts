import { SEED_IDS } from '../constants/seeds'
import { useAuthStore } from '../stores/authStore'
import { useCollectionStore } from '../stores/collectionStore'
import { useTutorialStore } from '../stores/tutorialStore'
import { useGardenStore } from '../stores/gardenStore'
import { useSeedsStore } from '../stores/seedsStore'
import { useSoundStore } from '../stores/soundStore'
import type { OhangType } from '../constants/strings'

const DEV_USER_ID = '00000000-0000-0000-0000-dev00000001'

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()

export function seedDevSession(ohangType: OhangType = 'water') {
  useAuthStore.getState().enterDevMode(ohangType)

  useGardenStore.getState().setPlants([
    {
      id: 'dev-plant-1',
      userSeedId: 'dev-useed-1',
      seedId: SEED_IDS.waterRare,
      slotIndex: 0,
      speciesName: '달빛수련',
      ohangType: 'water',
      rarity: 'rare',
      requiredHours: 96,
      plantedAt: hoursAgo(100),
      careBonusHours: 6,
      lastWateredAt: hoursAgo(24),
      starlightTapsToday: 0,
      starlightDate: null,
      bloomedAt: hoursAgo(4),
      isSleeping: false,
      sleptAt: null,
    },
    {
      id: 'dev-plant-2',
      userSeedId: 'dev-useed-2',
      seedId: SEED_IDS.woodNormal1,
      slotIndex: 1,
      speciesName: '새싹풀',
      ohangType: 'wood',
      rarity: 'normal',
      requiredHours: 48,
      plantedAt: hoursAgo(30),
      careBonusHours: 6,
      lastWateredAt: hoursAgo(20),
      starlightTapsToday: 20,
      starlightDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }),
      bloomedAt: null,
      isSleeping: false,
      sleptAt: null,
    },
    {
      id: 'dev-plant-3',
      userSeedId: 'dev-useed-3',
      seedId: SEED_IDS.fireNormal2,
      slotIndex: 4,
      speciesName: '노을꽃',
      ohangType: 'fire',
      rarity: 'normal',
      requiredHours: 48,
      plantedAt: hoursAgo(10),
      careBonusHours: 0,
      lastWateredAt: null,
      starlightTapsToday: 0,
      starlightDate: null,
      bloomedAt: null,
      isSleeping: false,
      sleptAt: null,
    },
  ])

  useSeedsStore.getState().setInventory([
    {
      id: 'dev-seed-1',
      seedId: SEED_IDS.waterNormal1,
      speciesName: '물망초',
      ohangType: 'water',
      rarity: 'normal',
      grantSource: 'welcome',
      receivedAt: new Date().toISOString(),
    },
  ])
  useSeedsStore.setState({ hasReceivedToday: false, todaySeed: null })

  useCollectionStore.getState().registerBloom(SEED_IDS.waterRare, hoursAgo(4))
  useTutorialStore.getState().complete()
}

export function clearDevSession() {
  useAuthStore.getState().reset()
  useGardenStore.getState().reset()
  useSeedsStore.getState().reset()
  useSoundStore.getState().reset()
  useCollectionStore.getState().reset()
  useTutorialStore.getState().reset()
}

export { DEV_USER_ID }
