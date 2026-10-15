/** KST 기준 날짜 문자열 YYYY-MM-DD */
export function getKSTDateString(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

export function formatRemainingTime(hours: number): string {
  if (hours <= 0) return '곧 피어나요'
  if (hours < 1) return `${Math.ceil(hours * 60)}분`
  if (hours < 24) return `${Math.ceil(hours)}시간`
  const days = Math.floor(hours / 24)
  const rem = Math.ceil(hours % 24)
  return rem > 0 ? `${days}일 ${rem}시간` : `${days}일`
}
