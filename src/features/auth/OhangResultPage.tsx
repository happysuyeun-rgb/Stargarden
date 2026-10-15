import { Navigate, useNavigate } from 'react-router-dom'
import { OhangBadge } from '../../components/OhangBadge'
import { OHANG_DESCRIPTIONS } from '../../lib/ohang'
import { useAuthStore } from '../../stores/authStore'
import type { OhangType } from '../../constants/strings'
import './OhangResultPage.css'

export function OhangResultPage() {
  const navigate = useNavigate()
  const ohangType = useAuthStore((s) => s.ohangType) as OhangType | null
  const birthProfile = useAuthStore((s) => s.birthProfile)

  if (!ohangType) {
    return <Navigate to="/onboarding" replace />
  }

  const { title, lines } = OHANG_DESCRIPTIONS[ohangType]

  return (
    <div className="ohang-result page--no-tab">
      <div className="ohang-result__glow" aria-hidden="true" />
      <OhangBadge type={ohangType} size="md" />
      <h2 className="ohang-result__title">{title}</h2>
      <div className="ohang-result__card">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {birthProfile?.birthTimeUnknown && (
          <p className="ohang-result__accuracy">
            태어난 시간을 모르셔서, 시주를 제외하고 산출했어요.
          </p>
        )}
      </div>
      <button
        type="button"
        className="ohang-result__cta"
        onClick={() => navigate('/garden', { replace: true })}
      >
        나의 정원 만들기
      </button>
    </div>
  )
}
