import { GROWTH_STAGES } from '../constants/game'

export interface GrowthInput {
  plantedAt: Date
  requiredHours: number
  careBonusHours: number
  now?: Date
  isSleeping?: boolean
  sleptAt?: string | null
}

export function calcGrowthProgress({
  plantedAt,
  requiredHours,
  careBonusHours,
  now = new Date(),
  isSleeping = false,
  sleptAt = null,
}: GrowthInput): number {
  const effectiveNow =
    isSleeping && sleptAt ? new Date(Math.min(now.getTime(), new Date(sleptAt).getTime())) : now
  const elapsedMs = effectiveNow.getTime() - plantedAt.getTime()
  const elapsedHours = elapsedMs / (1000 * 60 * 60)
  return (elapsedHours + careBonusHours) / requiredHours
}

export function getGrowthStage(progress: number): number {
  if (progress >= 1) return GROWTH_STAGES.bloom
  if (progress >= 0.5) return GROWTH_STAGES.sprout
  return GROWTH_STAGES.seed
}

export function getRemainingHours(input: GrowthInput): number {
  const progress = calcGrowthProgress(input)
  return Math.max(0, (1 - progress) * input.requiredHours)
}

interface SleepingPlantClock {
  plantedAt: string
  bloomedAt: string | null
  isSleeping: boolean
  sleptAt: string | null
}

/** 잠든 시간만큼 plantedAt을 뒤로 미뤄, 깨운 직후 진행률이 잠들기 전과 같게 한다. */
export function wakePlantFromSleep<T extends SleepingPlantClock>(plant: T, now = new Date()): T {
  if (!plant.sleptAt || plant.bloomedAt) {
    return { ...plant, isSleeping: false, sleptAt: null }
  }
  const sleptMs = Math.max(0, now.getTime() - new Date(plant.sleptAt).getTime())
  const plantedAt = new Date(new Date(plant.plantedAt).getTime() + sleptMs).toISOString()
  return { ...plant, isSleeping: false, sleptAt: null, plantedAt }
}
