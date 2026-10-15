import * as Tone from 'tone'
import type { OhangType } from '../constants/strings'
import type { SoundKey } from '../constants/sounds'

interface ChannelNodes {
  gain: Tone.Gain
  dispose: () => void
}

/** 오행별 프로시저럴 앰비언트 (placeholder — 실제 OGG/MP3 교체 예정) */
function createAmbientLayer(key: SoundKey): ChannelNodes {
  const gain = new Tone.Gain(0).connect(Tone.getDestination())

  const disposers: Array<() => void> = []

  const add = (node: { dispose: () => void }) => {
    disposers.push(() => node.dispose())
  }

  switch (key) {
    case 'night-wind': {
      const noise = new Tone.Noise('pink').start()
      const filter = new Tone.Filter(300, 'lowpass')
      noise.connect(filter)
      filter.connect(gain)
      add(noise)
      add(filter)
      break
    }
    case 'wood': {
      const noise = new Tone.Noise('white').start()
      const filter = new Tone.AutoFilter({ frequency: 0.08, depth: 0.6, baseFrequency: 600 })
      noise.connect(filter)
      filter.connect(gain)
      add(noise)
      add(filter)
      break
    }
    case 'fire': {
      const noise = new Tone.Noise('brown').start()
      const filter = new Tone.Filter(1200, 'bandpass')
      noise.connect(filter)
      filter.connect(gain)
      add(noise)
      add(filter)
      break
    }
    case 'earth': {
      const osc = new Tone.Oscillator(55, 'sine').start()
      const lfo = new Tone.LFO({ frequency: 0.05, min: 50, max: 65 }).start()
      lfo.connect(osc.frequency)
      osc.connect(gain)
      add(osc)
      add(lfo)
      break
    }
    case 'metal': {
      const osc = new Tone.Oscillator(432, 'sine').start()
      const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 })
      osc.connect(reverb)
      reverb.connect(gain)
      add(osc)
      add(reverb)
      break
    }
    case 'water': {
      const noise = new Tone.Noise('pink').start()
      const filter = new Tone.Filter(500, 'lowpass')
      noise.connect(filter)
      filter.connect(gain)
      add(noise)
      add(filter)
      break
    }
  }

  return {
    gain,
    dispose: () => {
      disposers.forEach((d) => d())
      gain.dispose()
    },
  }
}

class SoundEngine {
  private masterGain = new Tone.Gain(0.7).toDestination()
  private channels = new Map<string, ChannelNodes>()
  private channelSounds = new Map<string, SoundKey>()
  private started = false
  private fadeRaf: number | null = null

  async ensureStarted() {
    if (!this.started) {
      await Tone.start()
      this.started = true
    }
  }

  setMasterVolume(volume: number) {
    this.masterGain.gain.rampTo(volume, 0.1)
  }

  getMasterVolume() {
    return this.masterGain.gain.value
  }

  private ensureChannel(channelId: string, soundKey: SoundKey) {
    const existing = this.channels.get(channelId)
    if (existing && this.channelSounds.get(channelId) === soundKey) return existing

    if (existing) {
      existing.dispose()
      this.channels.delete(channelId)
    }

    const layer = createAmbientLayer(soundKey)
    layer.gain.connect(this.masterGain)
    this.channels.set(channelId, layer)
    this.channelSounds.set(channelId, soundKey)
    return layer
  }

  setChannelVolume(channelId: string, soundKey: SoundKey, volume: number, muted: boolean) {
    const ch = this.ensureChannel(channelId, soundKey)
    const target = muted ? 0 : volume
    ch.gain.gain.rampTo(target, 0.15)
  }

  removeChannel(channelId: string) {
    const ch = this.channels.get(channelId)
    if (ch) {
      ch.dispose()
      this.channels.delete(channelId)
      this.channelSounds.delete(channelId)
    }
  }

  syncChannels(
    items: Array<{ id: string; soundKey: SoundKey; volume: number; muted: boolean }>,
  ) {
    const ids = new Set(items.map((i) => i.id))
    for (const id of this.channels.keys()) {
      if (!ids.has(id)) this.removeChannel(id)
    }
    for (const item of items) {
      this.setChannelVolume(item.id, item.soundKey, item.volume, item.muted)
    }
  }

  async playPreview(soundKey: SoundKey, durationSec = 5) {
    await this.ensureStarted()
    const id = `preview-${soundKey}`
    this.setChannelVolume(id, soundKey, 0.5, false)
    setTimeout(() => this.removeChannel(id), durationSec * 1000)
  }

  fadeOutAndStop(durationSec: number) {
    if (this.fadeRaf) cancelAnimationFrame(this.fadeRaf)
    const startVol = this.masterGain.gain.value
    const start = performance.now()
    const durationMs = durationSec * 1000

    const tick = () => {
      const elapsed = performance.now() - start
      const t = Math.min(elapsed / durationMs, 1)
      this.masterGain.gain.value = startVol * (1 - t)
      if (t < 1) {
        this.fadeRaf = requestAnimationFrame(tick)
      } else {
        this.masterGain.gain.value = startVol
        this.fadeRaf = null
      }
    }
    this.fadeRaf = requestAnimationFrame(tick)
  }

  cancelFade() {
    if (this.fadeRaf) {
      cancelAnimationFrame(this.fadeRaf)
      this.fadeRaf = null
    }
  }

  dispose() {
    this.cancelFade()
    for (const id of [...this.channels.keys()]) {
      this.removeChannel(id)
    }
    this.masterGain.dispose()
  }
}

export const soundEngine = new SoundEngine()

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
