import { supabase } from './supabase'
import { sendPushToUsers } from './push'

export async function notifyLeidingOfJoinRequest(groupId: string, requesterName: string) {
  const { data } = await supabase
    .from('group_members')
    .select('user_id, profiles(role)')
    .eq('group_id', groupId)

  const leidingIds = (data as unknown as Array<{ user_id: string; profiles: { role: string } | null }>)
    ?.filter(m => m.profiles?.role === 'leiding' || m.profiles?.role === 'groepsleiding')
    .map(m => m.user_id) ?? []

  if (leidingIds.length === 0) return
  await sendPushToUsers(leidingIds, 'Nieuwe aanvraag', `${requesterName} wil lid worden van jouw groep.`, '/leiding/groep')
}

export async function notifyJoinRequestResolved(userId: string, groupName: string, approved: boolean) {
  const msg = approved
    ? `Je bent toegevoegd aan ${groupName}!`
    : `Je aanvraag voor ${groupName} werd niet goedgekeurd.`
  await sendPushToUsers([userId], approved ? 'Aanvraag goedgekeurd' : 'Aanvraag afgekeurd', msg, '/')
}

export async function notifyPeriodClosed(periodId: string, periodName: string) {
  const { data } = await supabase
    .from('payments')
    .select('user_id, amount_due')
    .eq('period_id', periodId)
    .neq('status', 'paid')

  const rows = (data ?? []) as { user_id: string; amount_due: number }[]
  for (const row of rows) {
    await sendPushToUsers(
      [row.user_id],
      'Periode afgesloten',
      `Je hebt €${row.amount_due.toFixed(2)} uitstaan voor ${periodName}. Geef dit door aan de kas.`,
      '/profile'
    )
  }
}

export async function notifyPaymentConfirmed(userId: string, periodName: string) {
  await sendPushToUsers([userId], 'Betaling bevestigd', `Je betaling voor ${periodName} is bevestigd.`, '/profile')
}
