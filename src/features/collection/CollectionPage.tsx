import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { OhangBadge } from '../../components/OhangBadge'
import { SEEDS } from '../../constants/seeds'
import { OHANG_LABELS, type OhangType } from '../../constants/strings'
import { useCollectionStore } from '../../stores/collectionStore'
import { useGardenStore } from '../../stores/gardenStore'
import { useToastStore } from '../../stores/toastStore'
import { PlantIllustration } from './PlantIllustration'
import './CollectionPage.css'
import './PlantIllustration.css'

const OHANG_TABS: OhangType[] = ['wood', 'fire', 'earth', 'metal', 'water']

export function CollectionPage() {
  const [tab, setTab] = useState<OhangType>('wood')
  const showToast = useToastStore((s) => s.show)
  const entries = useCollectionStore((s) => s.entries)
  const isCollected = useCollectionStore((s) => s.isCollected)
  const syncFromPlants = useCollectionStore((s) => s.syncFromPlants)
  const plants = useGardenStore((s) => s.plants)

  useEffect(() => {
    syncFromPlants(plants)
  }, [plants, syncFromPlants])

  const collectedCount = entries.length
  const totalCount = SEEDS.length
  const filtered = SEEDS.filter((s) => s.energyCode === tab)

  const handleUncollectedTap = (ohang: OhangType) => {
    showToast(`${OHANG_LABELS[ohang]} 기운의 날에 만날 수 있을까요?`)
  }

  return (
    <div className="collection page">
      <header className="collection__header">
        <h1>도감</h1>
        <p className="collection__progress">
          {collectedCount} / {totalCount} 수집
        </p>
      </header>

      <div className="collection__tabs" role="tablist" aria-label="오행 탭">
        {OHANG_TABS.map((ohang) => (
          <button
            key={ohang}
            type="button"
            role="tab"
            aria-selected={tab === ohang}
            className={`collection__tab${tab === ohang ? ' collection__tab--active' : ''}`}
            onClick={() => setTab(ohang)}
          >
            <OhangBadge type={ohang} size="sm" />
          </button>
        ))}
      </div>

      <ul className="collection__grid">
        {filtered.map((seed) => {
          const collected = isCollected(seed.id)
          const content = (
            <>
              <PlantIllustration
                ohang={seed.energyCode}
                collected={collected}
                stage={2}
              />
              <span className="collection__name">{collected ? seed.speciesName : '???'}</span>
              {seed.rarity === 'rare' && collected && (
                <span className="collection__rare">희귀</span>
              )}
            </>
          )

          return (
            <li key={seed.id}>
              {collected ? (
                <Link to={`/collection/${seed.id}`} className="collection__card">
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  className="collection__card collection__card--locked"
                  onClick={() => handleUncollectedTap(seed.energyCode)}
                >
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
