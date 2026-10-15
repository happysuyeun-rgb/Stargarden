import type { OhangType } from '../constants/strings'
import { OHANG_LABELS } from '../constants/strings'
import './OhangBadge.css'

interface OhangBadgeProps {
  type: OhangType
  size?: 'sm' | 'md'
}

export function OhangBadge({ type, size = 'md' }: OhangBadgeProps) {
  return (
    <span
      className={`ohang-badge ohang-badge--${type} ohang-badge--${size}`}
      aria-label={`오행 ${OHANG_LABELS[type]}`}
    >
      {OHANG_LABELS[type]}
    </span>
  )
}
