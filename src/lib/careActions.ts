import { CARE_BONUS } from '../constants/game'
import { getKSTDateString } from './datetime'
import type { GardenPlant } from '../stores/gardenStore'

export function canWaterToday(plant: GardenPlant, now = new Date()): boolean {
  if (plant.isSleeping) return false
  if (!plant.lastWateredAt) return true
  return getKSTDateString(new Date(plant.lastWateredAt)) !== getKSTDateString(now)
}

export function applyWatering(plant: GardenPlant, now = new Date()): GardenPlant {
  if (!canWaterToday(plant, now)) return plant
  return {
    ...plant,
    careBonusHours: plant.careBonusHours + CARE_BONUS.watering,
    lastWateredAt: now.toISOString(),
  }
}

export function getStarlightBonusToday(plant: GardenPlant, now = new Date()): number {
  const today = getKSTDateString(now)
  if (plant.starlightDate !== today) return 0
  const hours = (plant.starlightTapsToday / 10) * CARE_BONUS.starlight
  return Math.min(hours, CARE_BONUS.starlightDailyCap)
}

export function canTapStarlight(plant: GardenPlant, now = new Date()): boolean {
  if (plant.isSleeping) return false
  return getStarlightBonusToday(plant, now) < CARE_BONUS.starlightDailyCap
}

export function applyStarlightTap(plant: GardenPlant, now = new Date()): GardenPlant {
  const today = getKSTDateString(now)
  let taps = plant.starlightTapsToday
  let bonus = plant.careBonusHours

  if (plant.starlightDate !== today) {
    taps = 0
  }

  if (!canTapStarlight({ ...plant, starlightTapsToday: taps, starlightDate: today }, now)) {
    return plant
  }

  taps += 1
  if (taps % 10 === 0) {
    bonus += CARE_BONUS.starlight
  }

  return {
    ...plant,
    starlightTapsToday: taps,
    starlightDate: today,
    careBonusHours: bonus,
  }
}
