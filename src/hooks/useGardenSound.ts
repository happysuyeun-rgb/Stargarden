import { useEffect, useRef } from 'react'
import { SOUND_MAX_CHANNELS } from '../constants/game'
import { SOUNDS } from '../constants/sounds'
import { plantToSoundKey, soundEngine } from '../lib/soundEngine'
import type { GardenPlant } from '../stores/gardenStore'
import { useSoundStore } from '../stores/soundStore'

/** 개화 식물 → 사운드 채널 동기화 + 엔진 재생 */
export function useGardenSound(plants: GardenPlant[]) {
  const isPlaying = useSoundStore((s) => s.isPlaying)
  const masterVolume = useSoundStore((s) => s.masterVolume)
  const channels = useSoundStore((s) => s.channels)
  const setChannels = useSoundStore((s) => s.setChannels)
  const sleepTimerEndsAt = useSoundStore((s) => s.sleepTimerEndsAt)
  const clearSleepTimer = useSoundStore((s) => s.clearSleepTimer)
  const setPlaying = useSoundStore((s) => s.setPlaying)
  const bloomPlayedRef = useRef<Set<string>>(new Set())

  // 개화 식물 → 채널 목록 갱신
  useEffect(() => {
    const bloomed = plants
      .filter((p) => p.bloomedAt)
      .sort((a, b) => new Date(b.bloomedAt!).getTime() - new Date(a.bloomedAt!).getTime())
      .slice(0, SOUND_MAX_CHANNELS)

    const nextChannels = bloomed.map((p) => {
      const soundKey = plantToSoundKey(p.ohangType)
      const existing = channels.find((c) => c.plantId === p.id)
      return {
        id: existing?.id ?? `ch-${p.id}`,
        plantId: p.id,
        soundKey,
        name: p.speciesName,
        volume: existing?.volume ?? 0.6,
        muted: existing?.muted ?? false,
      }
    })

    // 개화 식물 없으면 기본 배경음
    if (nextChannels.length === 0) {
      const ambient = channels.find((c) => c.plantId === null)
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
    } else {
      setChannels(nextChannels)
    }
  }, [plants]) // eslint-disable-line react-hooks/exhaustive-deps

  // 엔진 동기화
  useEffect(() => {
    if (!isPlaying) {
      soundEngine.syncChannels([])
      return
    }

    soundEngine.ensureStarted().then(() => {
      soundEngine.setMasterVolume(masterVolume)
      soundEngine.syncChannels(
        channels.map((c) => ({
          id: c.id,
          soundKey: c.soundKey,
          volume: c.volume,
          muted: c.muted,
        })),
      )
    })
  }, [isPlaying, masterVolume, channels])

  // 수면 타이머
  useEffect(() => {
    if (!sleepTimerEndsAt || !isPlaying) return

    const check = () => {
      const remaining = sleepTimerEndsAt - Date.now()
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
    }

    const id = setInterval(check, 1000)
    return () => clearInterval(id)
  }, [sleepTimerEndsAt, isPlaying, clearSleepTimer, setPlaying])

  return {
    playBloomSound: async (plant: GardenPlant) => {
      if (bloomPlayedRef.current.has(plant.id)) return
      bloomPlayedRef.current.add(plant.id)
      await soundEngine.ensureStarted()
      const soundKey = plantToSoundKey(plant.ohangType)
      await soundEngine.playPreview(soundKey, 5)
    },
    startGardenSound: async () => {
      await soundEngine.ensureStarted()
      soundEngine.cancelFade()
      setPlaying(true)
    },
  }
}
