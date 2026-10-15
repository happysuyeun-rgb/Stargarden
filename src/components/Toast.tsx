import { useToastStore } from '../stores/toastStore'
import './Toast.css'

export function Toast() {
  const message = useToastStore((s) => s.message)
  if (!message) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
