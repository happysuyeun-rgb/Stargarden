import './StateView.css'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = '별빛을 모으는 중이에요' }: LoadingStateProps) {
  return (
    <p className="state-view state-view--loading" role="status">
      {message}
    </p>
  )
}
