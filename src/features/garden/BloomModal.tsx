import { useEffect } from 'react'
import { getSeedById } from '../../constants/seeds'
import type { GardenPlant } from '../../stores/gardenStore'
import './BloomModal.css'

interface BloomModalProps {
  plant: GardenPlant
  bloomCount: number
  onClose: () => void
  onPlaySound?: () => void
}

function withSubjectParticle(name: string): string {
  const code = name.charCodeAt(name.length - 1)
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
  return `${name}${hasBatchim ? '이' : '가'}`
}

export function BloomModal({ plant, bloomCount, onClose, onPlaySound }: BloomModalProps) {
  const master = getSeedById(plant.seedId)
  const meaning = master?.flowerMeaning ?? ''

  useEffect(() => {
    onPlaySound?.()
  }, [onPlaySound])

  const handleClose = () => {
    onClose()
  }

  return (
    <div className="bloom-overlay" role="presentation">
      <div className="bloom-modal" role="dialog" aria-modal="true" aria-label="개화">
        <div className="bloom-modal__glow" aria-hidden="true">🌸</div>
        <h2>{plant.speciesName}</h2>
        <p className="bloom-modal__meaning">{meaning}</p>
        <p className="bloom-modal__badge">
          {bloomCount <= 1
            ? '도감에 새로 기록되었어요'
            : `${withSubjectParticle(plant.speciesName)} ${bloomCount}번째로 피었어요`}
        </p>
        <button type="button" className="bloom-modal__cta" onClick={handleClose}>
          정원에서 듣기
        </button>
      </div>
    </div>
  )
}
