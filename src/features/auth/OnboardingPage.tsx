import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SIJIN_SLOTS } from '../../constants/sijin'
import { calcOhangStub } from '../../lib/ohang'
import { useAuthStore } from '../../stores/authStore'
import './OnboardingPage.css'

export function OnboardingPage() {
  const navigate = useNavigate()
  const setOnboarded = useAuthStore((s) => s.setOnboarded)
  const [step, setStep] = useState(1)
  const [birthDate, setBirthDate] = useState('')
  const [isLunar, setIsLunar] = useState(false)
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false)
  const [birthTime, setBirthTime] = useState<string | null>(null)

  const handleNext = () => {
    if (step === 1 && birthDate) {
      setStep(2)
      return
    }
    if (step === 2) {
      const ohangType = calcOhangStub(birthDate)
      setOnboarded(ohangType, {
        birthDate,
        isLunar,
        birthTimeUnknown,
        birthTime: birthTimeUnknown ? null : birthTime,
      })
      navigate('/onboarding/result', {
        state: { ohangType, birthTimeUnknown },
      })
    }
  }

  return (
    <div className="onboarding page--no-tab">
      <div className="onboarding__steps" aria-label={`단계 ${step} / 2`}>
        <span className={step >= 1 ? 'onboarding__dot onboarding__dot--active' : 'onboarding__dot'} />
        <span className={step >= 2 ? 'onboarding__dot onboarding__dot--active' : 'onboarding__dot'} />
      </div>

      {step === 1 && (
        <section className="onboarding__section">
          <h2>생년월일을 알려주세요</h2>
          <p className="onboarding__hint">오행 기질을 산출하는 데 사용됩니다</p>
          <label className="onboarding__field">
            <span>생년월일</span>
            <input
              type="date"
              value={birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </label>
          <label className="onboarding__toggle">
            <input
              type="checkbox"
              checked={isLunar}
              onChange={(e) => setIsLunar(e.target.checked)}
            />
            음력으로 입력
          </label>
        </section>
      )}

      {step === 2 && (
        <section className="onboarding__section">
          <h2>태어난 시간</h2>
          <p className="onboarding__hint">시간을 모르면 체크해 주세요</p>
          <label className="onboarding__toggle">
            <input
              type="checkbox"
              checked={birthTimeUnknown}
              onChange={(e) => {
                setBirthTimeUnknown(e.target.checked)
                if (e.target.checked) setBirthTime(null)
              }}
            />
            시간을 몰라요
          </label>
          {!birthTimeUnknown && (
            <div className="onboarding__sijin-grid" role="listbox" aria-label="시진 선택">
              {SIJIN_SLOTS.map((slot) => (
                <button
                  key={slot.code}
                  type="button"
                  role="option"
                  aria-selected={birthTime === slot.code}
                  className={`onboarding__sijin${birthTime === slot.code ? ' onboarding__sijin--active' : ''}`}
                  onClick={() => setBirthTime(slot.code)}
                >
                  <span className="onboarding__sijin-label">{slot.label}</span>
                  <span className="onboarding__sijin-range">{slot.range}</span>
                </button>
              ))}
            </div>
          )}
          {birthTimeUnknown && (
            <p className="onboarding__accuracy-hint">
              시간을 제외하고 산출해요. 결과 화면에서 안내해 드릴게요.
            </p>
          )}
        </section>
      )}

      <div className="onboarding__actions">
        {step > 1 && (
          <button type="button" className="onboarding__back" onClick={() => setStep(1)}>
            뒤로
          </button>
        )}
        <button
          type="button"
          className="onboarding__next"
          disabled={step === 1 && !birthDate}
          onClick={handleNext}
        >
          {step === 2 ? '기질 확인하기' : '다음'}
        </button>
      </div>
    </div>
  )
}
