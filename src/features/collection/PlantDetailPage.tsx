import { useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { OhangBadge } from '../../components/OhangBadge'
import { getSeedById, SEEDS } from '../../constants/seeds'
import { OHANG_NAMES } from '../../constants/strings'
import { plantToSoundKey, soundEngine } from '../../lib/soundEngine'
import { useCollectionStore } from '../../stores/collectionStore'
import { PlantIllustration } from './PlantIllustration'
import './PlantDetailPage.css'
import './PlantIllustration.css'

const STAGE_LABELS = ['씨앗', '새싹', '개화']

export function PlantDetailPage() {
  const { plantId } = useParams<{ plantId: string }>()
  const navigate = useNavigate()
  const isCollected = useCollectionStore((s) => s.isCollected)
  const getEntry = useCollectionStore((s) => s.getEntry)

  const seed = plantId ? getSeedById(plantId) : undefined

  const neighbors = useMemo(() => {
    if (!seed) return { prev: null, next: null }
    const sameOhang = SEEDS.filter((s) => s.energyCode === seed.energyCode)
    const idx = sameOhang.findIndex((s) => s.id === seed.id)
    return {
      prev: idx > 0 ? sameOhang[idx - 1] : null,
      next: idx < sameOhang.length - 1 ? sameOhang[idx + 1] : null,
    }
  }, [seed])

  if (!seed) return <Navigate to="/collection" replace />
  if (!isCollected(seed.id)) return <Navigate to="/collection" replace />

  const entry = getEntry(seed.id)
  const bloomDate = entry
    ? new Date(entry.firstBloomedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const handlePlaySound = () => {
    soundEngine.playPreview(plantToSoundKey(seed.energyCode), 10)
  }

  return (
    <div className="plant-detail page">
      <header className="plant-detail__nav">
        <Link to="/collection" className="plant-detail__back">
          ← 도감
        </Link>
        <div className="plant-detail__swipe">
          {neighbors.prev && isCollected(neighbors.prev.id) && (
            <button type="button" onClick={() => navigate(`/collection/${neighbors.prev!.id}`)}>
              ‹
            </button>
          )}
          {neighbors.next && isCollected(neighbors.next.id) && (
            <button type="button" onClick={() => navigate(`/collection/${neighbors.next!.id}`)}>
              ›
            </button>
          )}
        </div>
      </header>

      <div className="plant-detail__hero">
        <PlantIllustration ohang={seed.energyCode} stage={2} size="lg" />
      </div>

      <div className="plant-detail__info">
        <div className="plant-detail__title-row">
          <h1>{seed.speciesName}</h1>
          <OhangBadge type={seed.energyCode} />
        </div>
        {seed.rarity === 'rare' && <span className="plant-detail__rare">희귀</span>}
        <p className="plant-detail__meaning">{seed.flowerMeaning}</p>
        <p className="plant-detail__ohang-desc">
          {OHANG_NAMES[seed.energyCode]}의 기운을 담은 식물이에요.
        </p>
      </div>

      <button type="button" className="plant-detail__sound" onClick={handlePlaySound}>
        🔊 전체 듣기
      </button>

      {bloomDate && (
        <p className="plant-detail__date">첫 개화일 · {bloomDate}</p>
      )}

      <section className="plant-detail__gallery" aria-label="성장 단계">
        <h2>성장 기록</h2>
        <div className="plant-detail__stages">
          {([0, 1, 2] as const).map((stage) => (
            <div key={stage} className="plant-detail__stage">
              <PlantIllustration ohang={seed.energyCode} stage={stage} size="sm" />
              <span>{STAGE_LABELS[stage]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
