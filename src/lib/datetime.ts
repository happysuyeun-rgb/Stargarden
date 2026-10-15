/** KST 기준 날짜 문자열 YYYY-MM-DD */
export function getKSTDateString(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

/** KST 오늘 기준 만 나이. */
export function getInternationalAge(birthDate: string, today = getKSTDateString()): number {
  // TODO: 음력→양력 변환 후 계산
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  let age = ty - by
  if (tm < bm || (tm === bm && td < bd)) age -= 1
  return age
}

export function formatRemainingTime(hours: number): string {
  if (hours <= 0) return '곧 피어나요'
  if (hours < 1) return `${Math.ceil(hours * 60)}분`
  if (hours < 24) return `${Math.ceil(hours)}시간`
  const days = Math.floor(hours / 24)
  const rem = Math.ceil(hours % 24)
  return rem > 0 ? `${days}일 ${rem}시간` : `${days}일`
}
