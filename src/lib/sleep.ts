import { RETURN_GREETING_DAYS } from '../constants/game'
import { getKSTDateString } from './datetime'

const DAY_MS = 24 * 60 * 60 * 1000

/** 마지막 접속일의 KST 날짜부터 오늘까지 지난 날 수 */
export function daysSinceActive(lastActiveAt: string | null, now = new Date()): number {
  if (!lastActiveAt) return 0
  const lastDay = getKSTDateString(new Date(lastActiveAt))
  const today = getKSTDateString(now)
  const [y1, m1, d1] = lastDay.split('-').map(Number)
  const [y2, m2, d2] = today.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS)
}

export function shouldShowReturnGreeting(lastActiveAt: string | null, now = new Date()): boolean {
  return daysSinceActive(lastActiveAt, now) >= RETURN_GREETING_DAYS
}
