export const APP_NAME = '별의 정원'
export const APP_TAGLINE = '당신의 별이 심은 정원'

export const OHANG_LABELS = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
} as const

export const OHANG_NAMES = {
  wood: '나무',
  fire: '불',
  earth: '흙',
  metal: '금',
  water: '물',
} as const

export const TOAST = {
  oauthFailed: '별이 잠시 흐려졌어요. 다시 시도해주세요',
  gardenFull: '정원이 가득해요. 씨앗 주머니에 보관할게요',
  tomorrowSeed: '내일 새로운 기운의 씨앗이 찾아와요',
  welcomeSeed: '내일 아침, 새로운 기운의 씨앗이 찾아와요',
  comingSoon: '곧 만나요',
} as const

export type OhangType = keyof typeof OHANG_LABELS
