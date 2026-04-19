import { useQuery } from '@tanstack/react-query'
import { Users, CurrencyEur } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'

interface GroupRow {
  id: string
  name: string
  memberCount: number
  total: number
  members: { full_name: string; role: string }[]
}

export function Groups() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => {
      const [{ data: groupsData }, { data: memberships }, { data: activePeriod }] = await Promise.all([
        supabase.from('groups').select('id, name').order('name'),
        supabase.from('group_members').select('user_id, group_id, profiles(full_name, role)'),
        supabase.from('periods').select('id').eq('is_active', true).maybeSingle(),
      ])

      const memberRows = (memberships ?? []) as unknown as Array<{
        user_id: string; group_id: string
        profiles: { full_name: string; role: string } | null
      }>

      let txMap: Record<string, number> = {}
      if (activePeriod) {
        const { data: txData } = await supabase
          .from('transactions')
          .select('user_id, total_price')
          .eq('period_id', activePeriod.id)

        const memberGroupMap: Record<string, string> = {}
        for (const m of memberRows) memberGroupMap[m.user_id] = m.group_id

        for (const tx of (txData ?? []) as { user_id: string; total_price: number }[]) {
          const gid = memberGroupMap[tx.user_id]
          if (gid) txMap[gid] = (txMap[gid] ?? 0) + tx.total_price
        }
      }

      return ((groupsData ?? []) as { id: string; name: string }[]).map(g => {
        const groupMembers = memberRows
          .filter(m => m.group_id === g.id)
          .map(m => ({ full_name: m.profiles?.full_name ?? 'Onbekend', role: m.profiles?.role ?? 'lid' }))
        return {
          id: g.id,
          name: g.name,
          memberCount: groupMembers.length,
          total: txMap[g.id] ?? 0,
          members: groupMembers,
        } as GroupRow
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center mt-8">
        <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="px-4 space-y-3">
      {(groups ?? []).map(g => (
        <details
          key={g.id}
          className="rounded-[14px] overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none list-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary-pale)' }}>
                <Users size={16} color="var(--color-primary)" />
              </div>
              <div>
                <p className="text-[13px] font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>{g.name}</p>
                <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{g.memberCount} leden</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {g.total > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'var(--color-success-bg)' }}>
                  <CurrencyEur size={11} color="var(--color-success)" />
                  <span className="text-[11px] font-bold" style={{ color: 'var(--color-success)' }}>{g.total.toFixed(2)}</span>
                </div>
              )}
            </div>
          </summary>

          {g.members.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border)' }}>
              {g.members.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                >
                  <p className="text-[13px] m-0" style={{ color: 'var(--color-text-primary)' }}>{m.full_name}</p>
                  <span className="text-[11px] font-medium capitalize" style={{ color: 'var(--color-text-muted)' }}>{m.role}</span>
                </div>
              ))}
            </div>
          )}

          {g.members.length === 0 && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-[11px] m-0" style={{ color: 'var(--color-text-muted)' }}>Geen leden</p>
            </div>
          )}
        </details>
      ))}
    </div>
  )
}
