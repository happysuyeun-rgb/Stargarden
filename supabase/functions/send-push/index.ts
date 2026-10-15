import { corsHeaders, stubResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const cronSecret = req.headers.get('x-cron-secret')
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: 'CRON_SECRET required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  return stubResponse('send-push', 'FCM 푸시 발송 (최대 2건/일)')
})
