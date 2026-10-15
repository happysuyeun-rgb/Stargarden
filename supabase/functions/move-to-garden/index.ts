import { corsHeaders, stubResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return stubResponse('move-to-garden', '온실의 꽃을 빈 칸으로 되돌림')
})
