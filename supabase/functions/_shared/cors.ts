/** Edge Function 공통 CORS 헤더 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function stubResponse(name: string, hint: string) {
  return jsonResponse({
    stub: true,
    function: name,
    message: '스텁 응답 — Supabase 배포 후 구현 예정',
    hint,
  }, 501)
}
