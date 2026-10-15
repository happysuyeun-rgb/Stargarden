import { supabase, isSupabaseConfigured } from './supabase'

export type EdgeFunctionName =
  | 'grant-daily-seed'
  | 'confirm-bloom'
  | 'get-daily-insight'
  | 'generate-daily-energy'
  | 'verify-purchase'
  | 'send-push'
  | 'delete-account'
  | 'plant-seed'
  | 'water-plant'
  | 'tap-starlight'
  | 'complete-onboarding'
  | 'touch-active'
  | 'wake-garden'
  | 'update-profile'

export interface TouchActiveResult {
  needsWakeModal: boolean
}

export interface CompleteOnboardingResult {
  ohang_type: string
  user_seed_id: string
  seed_id: string
  species_name: string
}

/** Edge Function 호출 (Supabase 미설정 시 null 반환) */
export async function invokeEdgeFunction<T = unknown>(
  name: EdgeFunctionName,
  body?: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: 'SUPABASE_NOT_CONFIGURED' }
  }

  const { data, error } = await supabase.functions.invoke(name, { body: body ?? {} })
  if (error) return { data: null, error: error.message }
  return { data: data as T, error: null }
}
