import type { OhangType } from '../../constants/strings'

const STAGE_EMOJI = ['🌰', '🌱', '🌸']

interface PlantIllustrationProps {
  ohang: OhangType
  stage?: 0 | 1 | 2
  collected?: boolean
  size?: 'sm' | 'lg'
}

export function PlantIllustration({
  ohang,
  stage = 2,
  collected = true,
  size = 'sm',
}: PlantIllustrationProps) {
  const emoji = collected ? STAGE_EMOJI[stage] : '?'

  return (
    <div
      className={`plant-illust plant-illust--${ohang} plant-illust--${size}${collected ? '' : ' plant-illust--silhouette'}`}
      data-stage={stage}
      aria-hidden="true"
    >
      <span className="plant-illust__glow" />
      <span className="plant-illust__emoji">{emoji}</span>
    </div>
  )
}
