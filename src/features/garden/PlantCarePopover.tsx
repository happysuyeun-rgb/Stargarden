import { OhangBadge } from '../../components/OhangBadge'
import type { OhangType } from '../../constants/strings'
import { canWaterToday, canTapStarlight } from '../../lib/careActions'
import { formatRemainingTime } from '../../lib/datetime'
import { getRemainingHours } from '../../lib/growth'
import { computePlantProgress, type GardenPlant } from '../../stores/gardenStore'
import { useSoundStore } from '../../stores/soundStore'
import './PlantCarePopover.css'

interface PlantCarePopoverProps {
  plant: GardenPlant
  onClose: () => void
  onWater: () => void
  onStarlight: () => void
}

const STAGE_LABELS = ['씨앗', '새싹', '개화']

export function PlantCarePopover({ plant, onClose, onWater, onStarlight }: PlantCarePopoverProps) {
  const { progress, growthStage } = computePlantProgress(plant)
  const remaining = getRemainingHours(
    plant.requiredHours,
    plant.careBonusHours,
    new Date(plant.plantedAt),
  )
  const watered = !canWaterToday(plant)
  const starlightCapped = !canTapStarlight(plant)
  const channel = useSoundStore((s) => s.channels.find((c) => c.plantId === plant.id))
  const updateChannel = useSoundStore((s) => s.updateChannel)
  const setPlaying = useSoundStore((s) => s.setPlaying)

  return (
    <div className="care-overlay" onClick={onClose} role="presentation">
      <div
        className="care-popover"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${plant.speciesName} 돌보기`}
      >
        <button type="button" className="care-popover__close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        <div className="care-popover__header">
          <OhangBadge type={plant.ohangType as OhangType} />
          <div>
            <h3>{plant.speciesName}</h3>
            <span className="care-popover__stage">{STAGE_LABELS[growthStage]}</span>
          </div>
        </div>

        <div className="care-popover__gauge">
          <div className="care-popover__gauge-fill" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
        </div>
        <p className="care-popover__remaining">
          {plant.bloomedAt ? '개화 완료' : `약 ${formatRemainingTime(remaining)} 후 개화`}
        </p>

        {!plant.bloomedAt && plant.isSleeping && (
          <p className="care-popover__sleeping">잠든 동안은 성장과 돌보기가 멈춰요</p>
        )}

        {!plant.bloomedAt && (
          <div className="care-popover__actions">
            <button
              type="button"
              className="care-popover__action"
              onClick={onWater}
              disabled={watered}
            >
              💧 물주기 {watered ? '✓' : ''}
            </button>
            <button
              type="button"
              className="care-popover__action"
              onClick={onStarlight}
              disabled={starlightCapped}
            >
              ✨ 별빛 쬐기
            </button>
          </div>
        )}

        {plant.bloomedAt && channel && (
          <div className="care-popover__sound">
            <label className="care-popover__sound-row">
              <span>사운드</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={channel.volume}
                disabled={channel.muted}
                onChange={(e) => {
                  setPlaying(true)
                  updateChannel(channel.id, { volume: Number(e.target.value) })
                }}
                aria-label={`${plant.speciesName} 볼륨`}
              />
              <button
                type="button"
                onClick={() => {
                  setPlaying(true)
                  updateChannel(channel.id, { muted: !channel.muted })
                }}
              >
                {channel.muted ? '🔇' : '🔊'}
              </button>
            </label>
          </div>
        )}

        {plant.bloomedAt && !channel && (
          <p className="care-popover__bloomed">사운드가 해금되었어요</p>
        )}
      </div>
    </div>
  )
}
