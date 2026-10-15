import { useNavigate } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '../../constants/strings'
import { isDevBypassEnabled } from '../../lib/devMode'
import { seedDevSession } from '../../lib/seedDevSession'
import './LoginPage.css'

export function LoginPage() {
  const navigate = useNavigate()
  const devBypass = isDevBypassEnabled()

  const handleLogin = () => {
    navigate('/onboarding')
  }

  const handleDevEnter = () => {
    seedDevSession()
    navigate('/garden', { replace: true })
  }

  return (
    <div className="login page--no-tab">
      <div className="login__hero">
        <h1 className="login__title">{APP_NAME}</h1>
        <p className="login__tagline">{APP_TAGLINE}</p>
      </div>

      <div className="login__actions">
        {devBypass && (
          <button type="button" className="login__btn login__btn--dev" onClick={handleDevEnter}>
            개발자 모드로 입장
          </button>
        )}
        <button type="button" className="login__btn login__btn--google" onClick={handleLogin}>
          Google로 시작하기
        </button>
        <button type="button" className="login__btn login__btn--apple" onClick={handleLogin}>
          Apple로 시작하기
        </button>
        <button type="button" className="login__link" onClick={handleLogin}>
          이메일로 가입하기
        </button>
      </div>

      <p className="login__terms">
        시작하면 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
      </p>
    </div>
  )
}
