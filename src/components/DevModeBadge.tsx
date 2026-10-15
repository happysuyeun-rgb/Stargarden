import { useNavigate } from 'react-router-dom'
import { clearDevSession } from '../lib/seedDevSession'
import { useAuthStore } from '../stores/authStore'
import './DevModeBadge.css'

export function DevModeBadge() {
  const navigate = useNavigate()
  const isDevMode = useAuthStore((s) => s.isDevMode)

  if (!isDevMode) return null

  const handleReset = () => {
    clearDevSession()
    navigate('/login', { replace: true })
  }

  const handleOnboarding = () => {
    useAuthStore.getState().reset()
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="dev-badge" role="status" aria-label="개발자 모드 활성">
      <span className="dev-badge__label">DEV</span>
      <button type="button" className="dev-badge__btn" onClick={handleOnboarding}>
        온보딩
      </button>
      <button type="button" className="dev-badge__btn" onClick={handleReset}>
        로그아웃
      </button>
    </div>
  )
}
