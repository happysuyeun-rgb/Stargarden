import { useEffect, useRef } from 'react'
import { SOUND_MAX_CHANNELS } from '../constants/game'
import { SOUNDS, type SoundKey } from '../constants/sounds'
import { getSeedById } from '../constants/seeds'
import { plantToSoundKey } from '../lib/plantSound'
import type { GardenPlant } from '../stores/gardenStore'
import { useCollectionStore } from '../stores/collectionStore'
import { useSoundStore } from '../stores/soundStore'

/** 도감에 모은 종의 소리로 채널을 만들고 재생한다. 같은 소리는 채널 하나. */
export function useGardenSound() {
  const entries = useCollectionStore((s) => s.entries)
  const isPlaying = useSoundStore((s) => s.isPlaying)
  const masterVolume = useSoundStore((s) => s.masterVolume)
  const channels = useSoundStore((s) => s.channels)
  const setChannels = useSoundStore((s) => s.setChannels)
  const sleepTimerEndsAt = useSoundStore((s) => s.sleepTimerEndsAt)
  const clearSleepTimer = useSoundStore((s) => s.clearSleepTimer)
  const setPlaying = useSoundStore((s) => s.setPlaying)
  const bloomPlayedRef = useRef<Set<string>>(new Set())
  const engineLoadedRef = useRef(false)

  // 도감 종 → 소리 채널. 위치(정원/온실)와 무관하다.
  useEffect(() => {
    const unlocked = new Map<SoundKey, { name: string }>()
    for (const entry of entries) {
      const seed = getSeedById(entry.seedId)
      if (!seed) continue
      const soundKey = plantToSoundKey(seed.energyCode)
      if (!unlocked.has(soundKey)) unlocked.set(soundKey, { name: SOUNDS[soundKey].name })
    }

    if (unlocked.size === 0) {
      const ambient = channels.find((c) => c.soundKey === 'night-wind')
      setChannels([
        {
          id: ambient?.id ?? 'ch-ambient',
          plantId: null,
          soundKey: 'night-wind',
          name: SOUNDS['night-wind'].name,
          volume: ambient?.volume ?? 0.4,
          muted: ambient?.muted ?? false,
        },
      ])
      return
    }

    setChannels(
      [...unlocked.entries()].map(([soundKey, info]) => {
        const existing = channels.find((c) => c.soundKey === soundKey)
        return {
          id: existing?.id ?? `ch-${soundKey}`,
          plantId: null,
          soundKey,
          name: info.name,
          volume: existing?.volume ?? 0.6,
          muted: existing?.muted ?? false,
        }
      }),
    )
  }, [entries]) // eslint-disable-line react-hooks/exhaustive-deps

  // 엔진 동기화. 재생 전에는 Tone.js를 불러오지 않는다.
  useEffect(() => {
    if (!isPlaying && !engineLoadedRef.current) return
    let cancelled = false

    void import('../lib/soundEngine').then(({ soundEngine }) => {
      if (cancelled) return
      engineLoadedRef.current = true
      if (!isPlaying) {
        soundEngine.syncChannels([])
        return
      }
      void soundEngine.ensureStarted().then(() => {
        if (cancelled) return
        soundEngine.setMasterVolume(masterVolume)
        const audible = channels.filter((c) => !c.muted).slice(0, SOUND_MAX_CHANNELS)
        soundEngine.syncChannels(
          audible.map((c) => ({
            id: c.id,
            soundKey: c.soundKey,
            volume: c.volume,
            muted: c.muted,
          })),
        )
      })
    })

    return () => {
      cancelled = true
    }
  }, [isPlaying, masterVolume, channels])

  // 수면 타이머
  useEffect(() => {
    if (!sleepTimerEndsAt || !isPlaying) return

    const check = () => {
      const remaining = sleepTimerEndsAt - Date.now()
      void import('../lib/soundEngine').then(({ soundEngine }) => {
        if (remaining <= 0) {
          soundEngine.fadeOutAndStop(3)
          setTimeout(() => {
            setPlaying(false)
            clearSleepTimer()
          }, 3000)
          return
        }
        // 마지막 30초부터 페이드아웃 시작
        if (remaining <= 30_000 && remaining > 29_000) {
          soundEngine.fadeOutAndStop(30)
        }
      })
    }

    const id = setInterval(check, 1000)
    return () => clearInterval(id)
  }, [sleepTimerEndsAt, isPlaying, clearSleepTimer, setPlaying])

  return {
    playBloomSound: async (plant: GardenPlant) => {
      if (bloomPlayedRef.current.has(plant.id)) return
      bloomPlayedRef.current.add(plant.id)
      const { soundEngine } = await import('../lib/soundEngine')
      engineLoadedRef.current = true
      await soundEngine.ensureStarted()
      await soundEngine.playPreview(plantToSoundKey(plant.ohangType), 5)
    },
    startGardenSound: async () => {
      const { soundEngine } = await import('../lib/soundEngine')
      engineLoadedRef.current = true
      await soundEngine.ensureStarted()
      soundEngine.cancelFade()
      setPlaying(true)
    },
  }
}
