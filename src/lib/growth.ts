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

export function getRemainingHours(
  requiredHours: number,
  careBonusHours: number,
  plantedAt: Date,
  now = new Date(),
): number {
  const effectiveRequired = requiredHours - careBonusHours
  const elapsedMs = now.getTime() - plantedAt.getTime()
  const elapsedHours = elapsedMs / (1000 * 60 * 60)
  return Math.max(0, effectiveRequired - elapsedHours)
}
