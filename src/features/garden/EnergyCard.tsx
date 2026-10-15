import { BottomSheet } from '../../components/BottomSheet'
import { OhangBadge } from '../../components/OhangBadge'
import { ENERGY_FALLBACK, getTodayEnergy } from '../../constants/seeds'
import { OHANG_LABELS, OHANG_NAMES } from '../../constants/strings'
import type { OhangType } from '../../constants/strings'
import './EnergyCard.css'

interface EnergyCardProps {
  expanded: boolean
  onToggle: () => void
  userOhang: OhangType | null
}

export function EnergyCard({ expanded, onToggle, userOhang }: EnergyCardProps) {
  const todayEnergy = getTodayEnergy()
  const summary = ENERGY_FALLBACK[todayEnergy]

  return (
    <>
      <button type="button" className="energy-card" onClick={onToggle}>
        <OhangBadge type={todayEnergy} size="sm" />
        <span className="energy-card__text">
          오늘은 {OHANG_LABELS[todayEnergy]} 기운이 흐르는 날
        </span>
        <span className="energy-card__arrow" aria-hidden="true">
          {expanded ? '▼' : '▲'}
        </span>
      </button>

      <BottomSheet open={expanded} onClose={onToggle} title="오늘의 기운">
        <div className="energy-card__detail">
          <OhangBadge type={todayEnergy} />
          <p className="energy-card__summary">{summary}</p>
          {userOhang && (
            <p className="energy-card__personal">
              당신의 {OHANG_NAMES[userOhang]} 기질과 오늘의 기운이 만나고 있어요.
            </p>
          )}
          <button type="button" className="energy-card__premium" disabled>
            더 깊은 이야기 → <span className="energy-card__lock">🔒</span>
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
