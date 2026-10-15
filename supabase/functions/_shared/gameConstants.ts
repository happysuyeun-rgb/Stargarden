/** 클라이언트 constants/game.ts 와 동일 — 수치 이원화 방지 */
export const GROWTH_HOURS = { normal: 48, rare: 96 } as const

export const CARE_BONUS = {
  watering: 6,
  starlight: 0.5,
  starlightDailyCap: 2,
} as const

export const RARE_PROBABILITY = 0.15
export const SLEEP_THRESHOLD_DAYS = 30
export const GARDEN_START_SLOTS = 6
export const GARDEN_MAX_SLOTS = 12

export const KST_TIMEZONE = 'Asia/Seoul'
