import { SLEEP_THRESHOLD_DAYS } from '../constants/game'

export function shouldGardenSleep(lastActiveAt: string | null, now = new Date()): boolean {
  if (!lastActiveAt) return false
  const last = new Date(lastActiveAt)
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= SLEEP_THRESHOLD_DAYS
}

export function daysSinceActive(lastActiveAt: string | null, now = new Date()): number {
  if (!lastActiveAt) return 0
  const last = new Date(lastActiveAt)
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
}
