import { BottomSheet } from '../../components/BottomSheet'
import { FREE_PRESET_LIMIT } from '../../constants/game'
import { SLEEP_TIMER_OPTIONS } from '../../constants/sounds'
import { useSoundStore } from '../../stores/soundStore'
import { useToastStore } from '../../stores/toastStore'
import './SoundMixer.css'

interface SoundMixerProps {
  open: boolean
  onClose: () => void
}

export function SoundMixer({ open, onClose }: SoundMixerProps) {
  const showToast = useToastStore((s) => s.show)
  const isPlaying = useSoundStore((s) => s.isPlaying)
  const setPlaying = useSoundStore((s) => s.setPlaying)
  const masterVolume = useSoundStore((s) => s.masterVolume)
  const setMasterVolume = useSoundStore((s) => s.setMasterVolume)
  const channels = useSoundStore((s) => s.channels)
  const updateChannel = useSoundStore((s) => s.updateChannel)
  const presets = useSoundStore((s) => s.presets)
  const savePreset = useSoundStore((s) => s.savePreset)
  const applyPreset = useSoundStore((s) => s.applyPreset)
  const deletePreset = useSoundStore((s) => s.deletePreset)
  const sleepTimerMinutes = useSoundStore((s) => s.sleepTimerMinutes)
  const setSleepTimer = useSoundStore((s) => s.setSleepTimer)
  const clearSleepTimer = useSoundStore((s) => s.clearSleepTimer)

  const handleSavePreset = () => {
    const result = savePreset('나의 믹스')
    if (!result.ok && result.reason === 'FREE_PRESET_LIMIT') {
      showToast(`프리셋은 ${FREE_PRESET_LIMIT}개까지 저장할 수 있어요`)
      return
    }
    showToast('믹스를 저장했어요')
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="소리 정원">
      <div className="mixer">
        <div className="mixer__master">
          <label className="mixer__row">
            <button
              type="button"
              className={`mixer__toggle${isPlaying ? ' mixer__toggle--on' : ''}`}
              onClick={() => setPlaying(!isPlaying)}
              aria-pressed={isPlaying}
            >
              {isPlaying ? '🔊' : '🔇'}
            </button>
            <span>마스터</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              aria-label="마스터 볼륨"
            />
          </label>
        </div>

        <ul className="mixer__channels">
          {channels.length === 0 ? (
            <li className="mixer__empty">식물이 피어나면 소리가 늘어나요</li>
          ) : (
            channels.map((ch) => (
              <li key={ch.id} className="mixer__channel">
                <button
                  type="button"
                  className="mixer__mute"
                  onClick={() => updateChannel(ch.id, { muted: !ch.muted })}
                  aria-label={ch.muted ? '음소거 해제' : '음소거'}
                >
                  {ch.muted ? '🔇' : '🔊'}
                </button>
                <span className="mixer__channel-name">{ch.name}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={ch.volume}
                  disabled={ch.muted}
                  onChange={(e) =>
                    updateChannel(ch.id, { volume: Number(e.target.value) })
                  }
                  aria-label={`${ch.name} 볼륨`}
                />
              </li>
            ))
          )}
        </ul>

        <div className="mixer__presets">
          <div className="mixer__presets-header">
            <span>프리셋</span>
            <button type="button" className="mixer__save-btn" onClick={handleSavePreset}>
              현재 믹스 저장
            </button>
          </div>
          {presets.length === 0 ? (
            <p className="mixer__presets-empty">저장된 믹스가 없어요</p>
          ) : (
            <ul className="mixer__preset-list">
              {presets.map((p) => (
                <li key={p.id} className="mixer__preset-chip">
                  <button type="button" onClick={() => applyPreset(p.id)}>
                    {p.name}
                  </button>
                  <button
                    type="button"
                    className="mixer__preset-del"
                    onClick={() => deletePreset(p.id)}
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mixer__sleep">
          <span className="mixer__sleep-label">수면 타이머</span>
          <div className="mixer__sleep-options">
            {SLEEP_TIMER_OPTIONS.map((min) => (
              <button
                key={min}
                type="button"
                className={`mixer__sleep-btn${sleepTimerMinutes === min ? ' mixer__sleep-btn--active' : ''}`}
                onClick={() => setSleepTimer(sleepTimerMinutes === min ? null : min)}
              >
                {min}분
              </button>
            ))}
            {sleepTimerMinutes && (
              <button type="button" className="mixer__sleep-cancel" onClick={clearSleepTimer}>
                해제
              </button>
            )}
          </div>
          {sleepTimerMinutes && (
            <p className="mixer__sleep-hint">{sleepTimerMinutes}분 후 부드럽게 꺼져요</p>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
