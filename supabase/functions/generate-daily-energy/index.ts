import { corsHeaders, stubResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return stubResponse('generate-daily-energy', 'pg_cron 00:05 KST → Gemini Flash 일일 에너지 생성')
})
