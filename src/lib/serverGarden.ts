/** true 시 정원 액션이 Edge Function 경유 (Phase 2-C´) */
export function isServerGardenEnabled(): boolean {
  return import.meta.env.VITE_USE_SERVER_GARDEN === 'true'
}
