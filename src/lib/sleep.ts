import { RETURN_GREETING_DAYS } from '../constants/game'

export function shouldGardenSleep(lastActiveAt: string | null, now = new Date()): boolean {
  if (!lastActiveAt) return false
  const last = new Date(lastActiveAt)
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= RETURN_GREETING_DAYS
}

/** 잠든 정원이면 접속 시각과 상관없이 깨어남 모달을 다시 띄운다. */
export function resolveWakeOnMount(wasLongAbsent: boolean, isGardenSleeping: boolean) {
  if (wasLongAbsent && !isGardenSleeping) {
    return { applySleep: true, showWakeModal: true }
  }
  if (isGardenSleeping) {
    return { applySleep: false, showWakeModal: true }
  }
  return { applySleep: false, showWakeModal: false }
}

export function daysSinceActive(lastActiveAt: string | null, now = new Date()): number {
  if (!lastActiveAt) return 0
  const last = new Date(lastActiveAt)
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
}
