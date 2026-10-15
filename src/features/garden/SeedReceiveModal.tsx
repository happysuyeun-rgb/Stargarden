import { OhangBadge } from '../../components/OhangBadge'
import { soundEngine, plantToSoundKey } from '../../lib/soundEngine'
import type { InventorySeed } from '../../stores/seedsStore'
import './SeedReceiveModal.css'

interface SeedReceiveModalProps {
  seed: InventorySeed
  onPlant: () => void
  onStore: () => void
}

export function SeedReceiveModal({ seed, onPlant, onStore }: SeedReceiveModalProps) {
  return (
    <div className="seed-modal-overlay" role="presentation">
      <div className="seed-modal" role="dialog" aria-modal="true" aria-label="씨앗 수령">
        <div className="seed-modal__fall" aria-hidden="true">✦</div>
        <div className="seed-modal__card">
          <OhangBadge type={seed.ohangType} />
          <h2>{seed.speciesName}</h2>
          <span className={`seed-modal__rarity seed-modal__rarity--${seed.rarity}`}>
            {seed.rarity === 'rare' ? '희귀' : '일반'}
          </span>
          <button
            type="button"
            className="seed-modal__preview"
            onClick={() => soundEngine.playPreview(plantToSoundKey(seed.ohangType), 5)}
            aria-label="사운드 미리듣기"
          >
            🔊 5초 미리듣기
          </button>
        </div>
        <div className="seed-modal__actions">
          <button type="button" className="seed-modal__btn seed-modal__btn--primary" onClick={onPlant}>
            바로 심기
          </button>
          <button type="button" className="seed-modal__btn" onClick={onStore}>
            보관하기
          </button>
        </div>
      </div>
    </div>
  )
}
