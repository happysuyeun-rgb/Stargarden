import { useEffect } from 'react'
import { getSeedById } from '../../constants/seeds'
import type { GardenPlant } from '../../stores/gardenStore'
import './BloomModal.css'

interface BloomModalProps {
  plant: GardenPlant
  onClose: () => void
  onPlaySound?: () => void
}

export function BloomModal({ plant, onClose, onPlaySound }: BloomModalProps) {
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
        <p className="bloom-modal__badge">도감에 등록되었어요 · 사운드 해금</p>
        <button type="button" className="bloom-modal__cta" onClick={handleClose}>
          정원에서 듣기
        </button>
      </div>
    </div>
  )
}
