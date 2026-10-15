import type { OhangType } from './strings'

/** DB 003_seed_data.sql 과 동일 UUID (설계보완 v1.3.1 B안) */
export const SEED_IDS = {
  woodNormal1: 'b0000001-0000-0000-0000-000000000001',
  woodNormal2: 'b0000001-0000-0000-0000-000000000002',
  woodRare: 'b0000001-0000-0000-0000-000000000003',
  fireNormal1: 'b0000001-0000-0000-0000-000000000004',
  fireNormal2: 'b0000001-0000-0000-0000-000000000005',
  fireRare: 'b0000001-0000-0000-0000-000000000006',
  earthNormal1: 'b0000001-0000-0000-0000-000000000007',
  earthNormal2: 'b0000001-0000-0000-0000-000000000008',
  earthRare: 'b0000001-0000-0000-0000-000000000009',
  metalNormal1: 'b0000001-0000-0000-0000-00000000000a',
  metalNormal2: 'b0000001-0000-0000-0000-00000000000b',
  metalRare: 'b0000001-0000-0000-0000-00000000000c',
  waterNormal1: 'b0000001-0000-0000-0000-00000000000d',
  waterNormal2: 'b0000001-0000-0000-0000-00000000000e',
  waterRare: 'b0000001-0000-0000-0000-00000000000f',
} as const

export interface SeedMaster {
  id: string
  speciesName: string
  energyCode: OhangType
  rarity: 'normal' | 'rare'
  requiredHours: number
  flowerMeaning: string
}

export const SEEDS: SeedMaster[] = [
  { id: SEED_IDS.woodNormal1, speciesName: '새싹풀', energyCode: 'wood', rarity: 'normal', requiredHours: 48, flowerMeaning: '작은 시작의 용기를 담은 풀' },
  { id: SEED_IDS.woodNormal2, speciesName: '푸른잎사귀', energyCode: 'wood', rarity: 'normal', requiredHours: 48, flowerMeaning: '꾸준함이 만드는 초록빛 위로' },
  { id: SEED_IDS.woodRare, speciesName: '별빛대나무', energyCode: 'wood', rarity: 'rare', requiredHours: 96, flowerMeaning: '흔들려도 꺾이지 않는 마음' },
  { id: SEED_IDS.fireNormal1, speciesName: '불꽃채송화', energyCode: 'fire', rarity: 'normal', requiredHours: 48, flowerMeaning: '작지만 뜨거운 하루의 열정' },
  { id: SEED_IDS.fireNormal2, speciesName: '노을꽃', energyCode: 'fire', rarity: 'normal', requiredHours: 48, flowerMeaning: '하루의 끝을 물들이는 따뜻함' },
  { id: SEED_IDS.fireRare, speciesName: '태양의정원', energyCode: 'fire', rarity: 'rare', requiredHours: 96, flowerMeaning: '스스로 빛나는 법을 아는 꽃' },
  { id: SEED_IDS.earthNormal1, speciesName: '흙빛다육이', energyCode: 'earth', rarity: 'normal', requiredHours: 48, flowerMeaning: '느려도 단단하게 뿌리내리는 마음' },
  { id: SEED_IDS.earthNormal2, speciesName: '황금보리', energyCode: 'earth', rarity: 'normal', requiredHours: 48, flowerMeaning: '기다림이 여무는 시간' },
  { id: SEED_IDS.earthRare, speciesName: '대지의나무', energyCode: 'earth', rarity: 'rare', requiredHours: 96, flowerMeaning: '흔들리지 않는 뿌리 깊은 안정' },
  { id: SEED_IDS.metalNormal1, speciesName: '은빛방울꽃', energyCode: 'metal', rarity: 'normal', requiredHours: 48, flowerMeaning: '맑게 정돈되는 마음의 소리' },
  { id: SEED_IDS.metalNormal2, speciesName: '서리꽃', energyCode: 'metal', rarity: 'normal', requiredHours: 48, flowerMeaning: '차분함 속에 감춘 단단함' },
  { id: SEED_IDS.metalRare, speciesName: '달빛백합', energyCode: 'metal', rarity: 'rare', requiredHours: 96, flowerMeaning: '고요함이 만드는 순도 높은 위로' },
  { id: SEED_IDS.waterNormal1, speciesName: '물망초', energyCode: 'water', rarity: 'normal', requiredHours: 48, flowerMeaning: '흘러가도 잊지 않는 다정함' },
  { id: SEED_IDS.waterNormal2, speciesName: '푸른물결꽃', energyCode: 'water', rarity: 'normal', requiredHours: 48, flowerMeaning: '유연하게 흐르는 하루하루' },
  { id: SEED_IDS.waterRare, speciesName: '달빛수련', energyCode: 'water', rarity: 'rare', requiredHours: 96, flowerMeaning: '마음이 고요해지는 물의 소리' },
]

export function getSeedById(id: string): SeedMaster | undefined {
  return SEEDS.find((s) => s.id === id)
}

export function pickDailySeed(energyCode: OhangType): SeedMaster {
  const pool = SEEDS.filter((s) => s.energyCode === energyCode)
  const isRare = Math.random() < 0.15
  const rarity = isRare ? 'rare' : 'normal'
  const candidates = pool.filter((s) => s.rarity === rarity)
  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0]
}

export function getTodayEnergy(): OhangType {
  const day = new Date().getDay()
  const map: OhangType[] = ['water', 'wood', 'fire', 'earth', 'metal', 'water', 'wood']
  return map[day]
}

export const ENERGY_FALLBACK: Record<OhangType, string> = {
  wood: '오늘은 새싹이 돋는 날이에요. 작은 시작에 힘을 보태세요.',
  fire: '오늘은 열정이 오르는 날이에요. 마음껏 움직여 보세요.',
  earth: '오늘은 뿌리를 내리는 날이에요. 천천히, 단단하게.',
  metal: '오늘은 정리와 결단의 날이에요. 맑게 정돈해 보세요.',
  water: '오늘은 흐름을 타는 날이에요. 유연하게 이어가 보세요.',
}
