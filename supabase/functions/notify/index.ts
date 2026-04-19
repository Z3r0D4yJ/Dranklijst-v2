import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type NotifyPayload =
  | { type: 'join_request'; group_id: string; requester_name: string }
  | { type: 'join_resolved'; user_id: string; group_name: string; approved: boolean }
  | { type: 'period_closed'; period_id: string; period_name: string }
  | { type: 'payment_confirmed'; user_id: string; period_name: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const payload = await req.json() as NotifyPayload

    async function send(userIds: string[], title: string, body: string, url = '/') {
      if (!userIds.length) return

      // Persist to notifications table so users can view history
      await sb.from('notifications').insert(
        userIds.map(user_id => ({ user_id, title, body, url }))
      )

      await sb.functions.invoke('send-push', { body: { user_ids: userIds, title, body, url } })
    }

    switch (payload.type) {
      case 'join_request': {
        const { data: members } = await sb
          .from('group_members')
          .select('user_id, profiles(role)')
          .eq('group_id', payload.group_id)

        const ids = (members as unknown as Array<{ user_id: string; profiles: { role: string } | null }>)
          ?.filter(m => ['leiding', 'groepsleiding', 'admin'].includes(m.profiles?.role ?? ''))
          .map(m => m.user_id) ?? []

        await send(ids, 'Nieuwe aanvraag', `${payload.requester_name} wil lid worden van jouw groep.`, '/leiding/groep')
        break
      }

      case 'join_resolved': {
        const msg = payload.approved
          ? `Je bent toegevoegd aan ${payload.group_name}!`
          : `Je aanvraag voor ${payload.group_name} werd niet goedgekeurd.`
        await send([payload.user_id], payload.approved ? 'Aanvraag goedgekeurd' : 'Aanvraag afgekeurd', msg)
        break
      }

      case 'period_closed': {
        const { data: payments } = await sb
          .from('payments')
          .select('user_id, amount_due')
          .eq('period_id', payload.period_id)
          .neq('status', 'paid')

        for (const row of (payments ?? []) as { user_id: string; amount_due: number }[]) {
          await send(
            [row.user_id],
            'Periode afgesloten',
            `Je hebt €${row.amount_due.toFixed(2)} uitstaan voor ${payload.period_name}. Geef dit door aan de kas.`,
            '/profile',
          )
        }
        break
      }

      case 'payment_confirmed': {
        await send([payload.user_id], 'Betaling bevestigd', `Je betaling voor ${payload.period_name} is bevestigd.`, '/profile')
        break
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify fatal:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
