import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '../../components/BottomSheet'
import { LEGAL_DOCS, type LegalDocId } from '../../constants/legal'
import { useAuthStore } from '../../stores/authStore'
import './ConsentPage.css'

export function ConsentPage() {
  const navigate = useNavigate()
  const setConsent = useAuthStore((s) => s.setConsent)
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [openDoc, setOpenDoc] = useState<LegalDocId | null>(null)

  const allChecked = terms && privacy && marketing
  const canContinue = terms && privacy

  const setAll = (checked: boolean) => {
    setTerms(checked)
    setPrivacy(checked)
    setMarketing(checked)
  }

  const handleNext = () => {
    if (!canContinue) return
    setConsent({
      termsVersion: LEGAL_DOCS.terms.version,
      privacyVersion: LEGAL_DOCS.privacy.version,
      marketingOptIn: marketing,
      agreedAt: new Date().toISOString(),
    })
    navigate('/onboarding')
  }

  const doc = openDoc ? LEGAL_DOCS[openDoc] : null

  return (
    <div className="consent page--no-tab">
      <h1>별의 정원에 오기 전에</h1>
      <p className="consent__hint">필요한 항목만 확인하고 이어가면 돼요.</p>

      <label className="consent__row consent__row--all">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => setAll(e.target.checked)}
        />
        <span>전체 동의</span>
      </label>

      <ul className="consent__list">
        <ConsentItem
          checked={terms}
          onChange={setTerms}
          badge="필수"
          title={LEGAL_DOCS.terms.title}
          onView={() => setOpenDoc('terms')}
        />
        <ConsentItem
          checked={privacy}
          onChange={setPrivacy}
          badge="필수"
          title={LEGAL_DOCS.privacy.title}
          detail="생년월일, 태어난 시간, 양력/음력 · 오행 기질 산출과 맞춤 콘텐츠 제공 · 회원 탈퇴 시까지"
          onView={() => setOpenDoc('privacy')}
        />
        <ConsentItem
          checked={marketing}
          onChange={setMarketing}
          badge="선택"
          title={LEGAL_DOCS.marketing.title}
          onView={() => setOpenDoc('marketing')}
        />
      </ul>

      <p className="consent__ai">AI가 만든 해석은 참고용 콘텐츠예요</p>

      <button type="button" className="consent__next" disabled={!canContinue} onClick={handleNext}>
        다음
      </button>

      <BottomSheet open={doc !== null} onClose={() => setOpenDoc(null)} title={doc?.title}>
        {doc && <p className="consent__body">{doc.body}</p>}
      </BottomSheet>
    </div>
  )
}

function ConsentItem({
  checked,
  onChange,
  badge,
  title,
  detail,
  onView,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  badge: '필수' | '선택'
  title: string
  detail?: string
  onView: () => void
}) {
  return (
    <li className="consent__item">
      <label className="consent__row">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          <span className={`consent__badge consent__badge--${badge === '필수' ? 'required' : 'optional'}`}>
            {badge}
          </span>
          {title}
          {detail && <span className="consent__detail">{detail}</span>}
        </span>
      </label>
      <button type="button" className="consent__view" onClick={onView}>
        보기
      </button>
    </li>
  )
}
