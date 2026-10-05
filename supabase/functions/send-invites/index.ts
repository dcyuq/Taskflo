import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const escape = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const body = await req.json().catch(() => null)
  const workspaceId = body?.workspaceId
  const emails = body?.emails
  if (typeof workspaceId !== 'string' || !Array.isArray(emails) || !emails.every(e => typeof e === 'string')) {
    return json({ error: 'bad_request' }, 400)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })

  const { data: invites, error } = await supabase.rpc('create_invites', { ws: workspaceId, emails })
  if (error) return json({ error: error.code ?? 'failed' }, error.code === '42501' ? 403 : 400)

  const key = Deno.env.get('RESEND_API_KEY')
  const site = Deno.env.get('SITE_URL')
  if (!key || !site || !invites.length) return json({ invited: invites.length, emailed: 0 })

  const { data: workspace } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single()
  const name = workspace?.name ?? 'a workspace'
  const from = Deno.env.get('INVITE_FROM') ?? 'Taskflo <onboarding@resend.dev>'

  const sent = await Promise.all(invites.map(({ email, token }: { email: string, token: string }) => {
    const link = `${site.replace(/\/$/, '')}/invite/${token}`
    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: email,
        subject: `Join ${name} on Taskflo`,
        text: `You've been invited to join ${name} on Taskflo.\n\nJoin here: ${link}\n\nThe invite lasts 7 days and only works for ${email}.`,
        html: `<p>You've been invited to join <strong>${escape(name)}</strong> on Taskflo.</p><p><a href="${link}">Join ${escape(name)}</a></p><p>The invite lasts 7 days and only works for ${escape(email)}.</p>`,
      }),
    }).then(r => r.ok).catch(() => false)
  }))

  return json({ invited: invites.length, emailed: sent.filter(Boolean).length })
})
