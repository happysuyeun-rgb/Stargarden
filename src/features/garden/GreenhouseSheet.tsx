import { BottomSheet } from '../../components/BottomSheet'
import { OhangBadge } from '../../components/OhangBadge'
import type { OhangType } from '../../constants/strings'
import { plantToSoundKey } from '../../lib/plantSound'
import type { GardenPlant } from '../../stores/gardenStore'
import './GreenhouseSheet.css'

interface GreenhouseSheetProps {
  open: boolean
  plants: GardenPlant[]
  onClose: () => void
  onReturn: (plantId: string) => void
}

export function GreenhouseSheet({ open, plants, onClose, onReturn }: GreenhouseSheetProps) {
  const play = (plant: GardenPlant) => {
    void import('../../lib/soundEngine').then(({ soundEngine }) => {
      void soundEngine.playPreview(plantToSoundKey(plant.ohangType), 5)
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="온실">
      {plants.length === 0 ? (
        <p className="greenhouse__empty">꽃이 피면 온실로 옮길 수 있어요</p>
      ) : (
        <ul className="greenhouse__list">
          {plants.map((plant) => (
            <li key={plant.id}>
              <button type="button" className="greenhouse__item" onClick={() => onReturn(plant.id)}>
                <OhangBadge type={plant.ohangType as OhangType} size="sm" />
                <span className="greenhouse__name">{plant.speciesName}</span>
                {plant.bloomedAt && (
                  <span className="greenhouse__date">
                    {new Date(plant.bloomedAt).toLocaleDateString('ko-KR')}
                  </span>
                )}
                <span className="greenhouse__hint">정원으로 꺼내기</span>
              </button>
              <button type="button" className="greenhouse__listen" onClick={() => play(plant)}>
                소리 듣기
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  )
}
