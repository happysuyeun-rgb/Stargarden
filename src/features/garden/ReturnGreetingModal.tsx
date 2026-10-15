import './ReturnGreetingModal.css'

interface ReturnGreetingModalProps {
  onClose: () => void
}

export function ReturnGreetingModal({ onClose }: ReturnGreetingModalProps) {
  return (
    <div className="return-overlay" role="presentation">
      <div className="return-modal" role="dialog" aria-modal="true" aria-label="오랜만의 인사">
        <div className="return-modal__glow" aria-hidden="true">✨</div>
        <p>오랜만이에요. 정원이 기다리고 있었어요</p>
        <button type="button" className="return-modal__cta" onClick={onClose}>
          정원 보기
        </button>
      </div>
    </div>
  )
}
