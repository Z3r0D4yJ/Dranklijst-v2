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
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 space-y-3">
      {(groups ?? []).map(g => (
        <details key={g.id} className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] overflow-hidden group">
          <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none list-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-xl flex items-center justify-center shrink-0">
                <Users size={16} color="#2563EB" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">{g.name}</p>
                <p className="text-xs text-[#94A3B8]">{g.memberCount} leden</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {g.total > 0 && (
                <div className="flex items-center gap-1 bg-[#ECFDF5] dark:bg-[#064E3B] px-2.5 py-1 rounded-lg">
                  <CurrencyEur size={11} color="#10B981" />
                  <span className="text-xs font-bold text-[#10B981]">{g.total.toFixed(2)}</span>
                </div>
              )}
            </div>
          </summary>

          {g.members.length > 0 && (
            <div className="border-t border-[#F1F5F9] dark:border-[#334155] divide-y divide-[#F1F5F9] dark:divide-[#334155]">
              {g.members.map((m, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-sm text-[#0F172A] dark:text-[#F1F5F9]">{m.full_name}</p>
                  <span className="text-xs text-[#94A3B8] font-medium capitalize">{m.role}</span>
                </div>
              ))}
            </div>
          )}

          {g.members.length === 0 && (
            <div className="border-t border-[#F1F5F9] dark:border-[#334155] px-4 py-3">
              <p className="text-xs text-[#94A3B8]">Geen leden</p>
            </div>
          )}
        </details>
      ))}
    </div>
  )
}
