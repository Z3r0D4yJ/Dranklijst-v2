import { supabase } from './supabase'

export async function notifyLeidingOfJoinRequest(groupId: string, requesterName: string) {
  await supabase.functions.invoke('notify', {
    body: { type: 'join_request', group_id: groupId, requester_name: requesterName },
  })
}

export async function notifyLeidingOfInviteJoinRequest(code: string, requesterName: string) {
  await supabase.functions.invoke('notify', {
    body: { type: 'join_request', invite_code: code.trim().toUpperCase(), requester_name: requesterName },
  })
}

export async function notifyJoinRequestResolved(userId: string, groupName: string, approved: boolean) {
  await supabase.functions.invoke('notify', {
    body: { type: 'join_resolved', user_id: userId, group_name: groupName, approved },
  })
}

export async function notifyPeriodClosed(periodId: string, periodName: string) {
  await supabase.functions.invoke('notify', {
    body: { type: 'period_closed', period_id: periodId, period_name: periodName },
  })
}

export async function notifyPaymentConfirmed(userId: string, periodName: string) {
  await supabase.functions.invoke('notify', {
    body: { type: 'payment_confirmed', user_id: userId, period_name: periodName },
  })
}
