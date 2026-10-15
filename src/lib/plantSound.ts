import type { OhangType } from '../constants/strings'
import type { SoundKey } from '../constants/sounds'

export function plantToSoundKey(ohangType: string): SoundKey {
  const map: Record<OhangType, SoundKey> = {
    wood: 'wood',
    fire: 'fire',
    earth: 'earth',
    metal: 'metal',
    water: 'water',
  }
  return map[ohangType as OhangType] ?? 'night-wind'
}
