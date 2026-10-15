import { useEffect } from 'react'
import './BottomSheet.css'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  peek?: boolean
}

export function BottomSheet({ open, onClose, title, children, peek }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="bottom-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className={`bottom-sheet${peek ? ' bottom-sheet--peek' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="bottom-sheet__handle" aria-hidden="true" />
        {title && <h2 className="bottom-sheet__title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
