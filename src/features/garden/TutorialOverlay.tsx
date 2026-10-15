import { useTutorialStore } from '../../stores/tutorialStore'
import './TutorialOverlay.css'

const STEPS = [
  { title: '웰컴 씨앗이 도착했어요', body: '오늘의 첫 씨앗을 받았어요. 함께 심어볼까요?' },
  { title: '빈 슬롯에 심어보세요', body: '반짝이는 자리를 탭해서 씨앗을 심어주세요.' },
  { title: '물을 주어보세요', body: '심은 식물을 탭하고 물주기를 눌러주세요.' },
]

interface TutorialOverlayProps {
  onSkip: () => void
}

export function TutorialOverlay({ onSkip }: TutorialOverlayProps) {
  const { active, step } = useTutorialStore()
  if (!active) return null

  const current = STEPS[step - 1]

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="튜토리얼">
      <div className="tutorial-overlay__card">
        <span className="tutorial-overlay__step">{step} / 3</span>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <button type="button" className="tutorial-overlay__skip" onClick={onSkip}>
          건너뛰기
        </button>
      </div>
    </div>
  )
}
