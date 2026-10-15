/** 클라이언트 constants/game.ts 와 동일 — 수치 이원화 방지 */
export const GROWTH_HOURS = { normal: 48, rare: 96 } as const

export const CARE_BONUS = {
  watering: 6,
  starlight: 0.5,
  starlightDailyCap: 2,
} as const

export const RARE_PROBABILITY = 0.15
export const RETURN_GREETING_DAYS = 7
export const RARE_PITY_DAYS = 10
export const STARLIGHT_TAPS_PER_BONUS = 10
export const BLOOMS_PER_SLOT = 5
export const MIN_SIGNUP_AGE = 14
export const GARDEN_START_SLOTS = 6
export const GARDEN_MAX_SLOTS = 12

export const KST_TIMEZONE = 'Asia/Seoul'
