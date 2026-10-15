import { corsHeaders, stubResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return stubResponse('verify-purchase', 'Toss 웹훅 / 스토어 영수증 검증')
})
