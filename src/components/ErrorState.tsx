import './StateView.css'

interface ErrorStateProps {
  message?: string
  onRetry: () => void
}

export function ErrorState({
  message = '잠시 이어가지 못했어요. 준비되면 다시 시도해 주세요.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-view state-view--error" role="alert">
      <p>{message}</p>
      <button type="button" className="state-view__retry" onClick={onRetry}>
        다시 시도
      </button>
    </div>
  )
}
