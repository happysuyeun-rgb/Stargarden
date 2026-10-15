/** 개발 서버(npm run dev)에서 기본 활성. .env로 VITE_DEV_BYPASS_AUTH=false 로 끌 수 있음 */
export function isDevBypassEnabled(): boolean {
  const flag = import.meta.env.VITE_DEV_BYPASS_AUTH
  if (flag === 'false') return false
  if (flag === 'true') return true
  return import.meta.env.DEV
}
