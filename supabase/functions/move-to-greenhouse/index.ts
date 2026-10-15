import { corsHeaders, stubResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return stubResponse('move-to-greenhouse', '핀 꽃을 온실로 옮기고 slot_index를 비움')
})
