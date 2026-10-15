export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'

/** KST 기준 시간대 4단계 (SCR-100) */
export function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = Number(
    date.toLocaleString('en-US', { timeZone: 'Asia/Seoul', hour: 'numeric', hour12: false }),
  )
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'day'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}
