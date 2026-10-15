import './WakeUpModal.css'

interface WakeUpModalProps {
  onClose: () => void
}

export function WakeUpModal({ onClose }: WakeUpModalProps) {
  return (
    <div className="wake-overlay" role="presentation">
      <div className="wake-modal" role="dialog" aria-modal="true" aria-label="정원 깨어남">
        <div className="wake-modal__glow" aria-hidden="true">✨</div>
        <h2>정원이 깨어나요</h2>
        <p>잠들어 있던 식물들이 다시 별빛을 받고 있어요.</p>
        <button type="button" className="wake-modal__cta" onClick={onClose}>
          정원으로 돌아가기
        </button>
      </div>
    </div>
  )
}
