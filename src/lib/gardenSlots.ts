import { BLOOMS_PER_SLOT, GARDEN_MAX_SLOTS, GARDEN_START_SLOTS } from '../constants/game'

export function slotsFromBloomCount(totalBlooms: number): number {
  return Math.min(GARDEN_MAX_SLOTS, GARDEN_START_SLOTS + Math.floor(totalBlooms / BLOOMS_PER_SLOT))
}
