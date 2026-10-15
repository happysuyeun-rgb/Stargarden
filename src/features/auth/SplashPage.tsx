import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_NAME } from '../../constants/strings'
import { isDevBypassEnabled } from '../../lib/devMode'
import { seedDevSession } from '../../lib/seedDevSession'
import { useAuthStore } from '../../stores/authStore'
import './SplashPage.css'

export function SplashPage() {
  const navigate = useNavigate()
  const isOnboarded = useAuthStore((s) => s.isOnboarded)
  const isDevMode = useAuthStore((s) => s.isDevMode)
  const devBypass = isDevBypassEnabled()

  useEffect(() => {
    const delay = devBypass ? 400 : 1500

    const timer = setTimeout(() => {
      if (devBypass && !isOnboarded) {
        seedDevSession()
        navigate('/garden', { replace: true })
        return
      }

      if (isOnboarded || isDevMode) {
        if (isDevMode) seedDevSession()
        navigate('/garden', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [isOnboarded, isDevMode, devBypass, navigate])

  return (
    <div className="splash page--no-tab">
      <div className="splash__stars" aria-hidden="true" />
      <h1 className="splash__logo">{APP_NAME}</h1>
      <p className="splash__loading">
        {devBypass ? '개발자 모드로 입장 중...' : '별빛을 모으는 중...'}
      </p>
    </div>
  )
}
