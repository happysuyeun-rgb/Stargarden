import type { OhangType } from './strings'

export type SoundKey =
  | 'night-wind'
  | 'wood'
  | 'fire'
  | 'earth'
  | 'metal'
  | 'water'

export interface SoundDef {
  key: SoundKey
  name: string
  category: 'ambient' | 'plant'
  ohang: OhangType | null
}

export const SOUNDS: Record<SoundKey, SoundDef> = {
  'night-wind': { key: 'night-wind', name: '밤바람 (기본 배경음)', category: 'ambient', ohang: null },
  wood: { key: 'wood', name: '윈드차임 (木)', category: 'plant', ohang: 'wood' },
  fire: { key: 'fire', name: '모닥불 (火)', category: 'plant', ohang: 'fire' },
  earth: { key: 'earth', name: '대지의 울림 (土)', category: 'plant', ohang: 'earth' },
  metal: { key: 'metal', name: '싱잉볼 (金)', category: 'plant', ohang: 'metal' },
  water: { key: 'water', name: '빗소리 (水)', category: 'plant', ohang: 'water' },
}

export function ohangToSoundKey(ohang: OhangType): SoundKey {
  return ohang
}

export const SLEEP_TIMER_OPTIONS = [15, 30, 60] as const
