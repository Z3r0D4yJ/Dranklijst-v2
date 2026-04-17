import { createClient } from '@/lib/supabase/client'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('')
}

export async function createInviteCode(groupId: string): Promise<string> {
  const supabase = createClient()
  let code = generateInviteCode()
  let attempts = 0

  while (attempts < 10) {
    const { error } = await supabase
      .from('groups')
      .update({ invite_code: code })
      .eq('id', groupId)

    if (!error) return code
    if (error.code === '23505') {
      code = generateInviteCode()
      attempts++
      continue
    }
    throw error
  }
  throw new Error('Kon geen unieke code genereren')
}

export async function joinGroupByCode(code: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Niet ingelogd')

  const { data: group, error } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', code)
    .single()

  if (error || !group) throw new Error('Ongeldige uitnodigingscode')

  const { error: updateError } = await supabase
    .from('users')
    .update({
      group_id: group.id,
      membership_status: 'active',
      joined_group_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) throw updateError
}
