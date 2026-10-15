import { corsHeaders, stubResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return stubResponse('get-daily-insight', '구독자 심층 해석 생성/캐시')
})
