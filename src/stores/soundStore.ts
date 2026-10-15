import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FREE_PRESET_LIMIT } from '../constants/game'
import type { SoundKey } from '../constants/sounds'

export interface SoundChannel {
  id: string
  plantId: string | null
  soundKey: SoundKey
  name: string
  volume: number
  muted: boolean
}

export interface SoundPreset {
  id: string
  name: string
  mixConfig: Array<{ channelId: string; soundKey: SoundKey; volume: number }>
}

interface SoundState {
  masterVolume: number
  isPlaying: boolean
  channels: SoundChannel[]
  presets: SoundPreset[]
  sleepTimerMinutes: number | null
  sleepTimerEndsAt: number | null
  setMasterVolume: (v: number) => void
  setPlaying: (playing: boolean) => void
  setChannels: (channels: SoundChannel[]) => void
  updateChannel: (id: string, patch: Partial<SoundChannel>) => void
  savePreset: (name: string) => { ok: boolean; reason?: string }
  applyPreset: (presetId: string) => void
  deletePreset: (presetId: string) => void
  setSleepTimer: (minutes: number | null) => void
  clearSleepTimer: () => void
  reset: () => void
}

const initial = {
  masterVolume: 0.7,
  isPlaying: false,
  channels: [] as SoundChannel[],
  presets: [] as SoundPreset[],
  sleepTimerMinutes: null as number | null,
  sleepTimerEndsAt: null as number | null,
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      ...initial,
      setMasterVolume: (masterVolume) => set({ masterVolume }),
      setPlaying: (isPlaying) => set({ isPlaying }),
      setChannels: (channels) => set({ channels }),
      updateChannel: (id, patch) =>
        set((s) => ({
          channels: s.channels.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      savePreset: (name) => {
        const { presets, channels } = get()
        const isSubscribed = false // Phase 2: 구독 연동
        if (!isSubscribed && presets.length >= FREE_PRESET_LIMIT) {
          return { ok: false, reason: 'FREE_PRESET_LIMIT' }
        }
        const preset: SoundPreset = {
          id: `preset-${Date.now()}`,
          name,
          mixConfig: channels.map((c) => ({
            channelId: c.id,
            soundKey: c.soundKey,
            volume: c.volume,
          })),
        }
        set({ presets: [...presets, preset] })
        return { ok: true }
      },
      applyPreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId)
        if (!preset) return
        set((s) => ({
          channels: s.channels.map((c) => {
            const match = preset.mixConfig.find((m) => m.soundKey === c.soundKey)
            return match ? { ...c, volume: match.volume, muted: false } : c
          }),
        }))
      },
      deletePreset: (presetId) =>
        set((s) => ({ presets: s.presets.filter((p) => p.id !== presetId) })),
      setSleepTimer: (minutes) => {
        if (minutes === null) {
          set({ sleepTimerMinutes: null, sleepTimerEndsAt: null })
          return
        }
        set({
          sleepTimerMinutes: minutes,
          sleepTimerEndsAt: Date.now() + minutes * 60 * 1000,
        })
      },
      clearSleepTimer: () => set({ sleepTimerMinutes: null, sleepTimerEndsAt: null }),
      reset: () => set(initial),
    }),
    {
      name: 'stargarden-sound',
      partialize: (s) => ({
        masterVolume: s.masterVolume,
        presets: s.presets,
        channels: s.channels,
      }),
    },
  ),
)
