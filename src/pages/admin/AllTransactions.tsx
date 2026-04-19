import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash, Receipt } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import type { Period } from '../../lib/database.types'

interface TxRow {
  id: string
  user_id: string
  full_name: string
  group_name: string
  consumption_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  period_id: string
}

export function AllTransactions() {
  const queryClient = useQueryClient()
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data } = await supabase.from('periods').select('*').order('started_at', { ascending: false })
      return (data ?? []) as Period[]
    },
  })

  const { data: groups } = useQuery({
    queryKey: ['groups-list'],
    queryFn: async () => {
      const { data } = await supabase.from('groups').select('id, name').neq('name', 'Leiding').order('name')
      return (data ?? []) as { id: string; name: string }[]
    },
  })

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['all-transactions', selectedPeriod, selectedGroup],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('id, user_id, quantity, unit_price, total_price, created_at, period_id, profiles(full_name), consumptions(name)')
        .order('created_at', { ascending: false })
        .limit(200)

      if (selectedPeriod) query = query.eq('period_id', selectedPeriod)

      const { data } = await query

      const rows = (data ?? []) as unknown as Array<{
        id: string; user_id: string; quantity: number; unit_price: number
        total_price: number; created_at: string; period_id: string
        profiles: { full_name: string } | null
        consumptions: { name: string } | null
      }>

      const userIds = [...new Set(rows.map(r => r.user_id))]
      const { data: memberships } = await supabase
        .from('group_members')
        .select('user_id, groups(id, name)')
        .in('user_id', userIds)

      const memberMap: Record<string, { id: string; name: string }> = {}
      for (const m of (memberships ?? []) as unknown as Array<{ user_id: string; groups: { id: string; name: string } | null }>) {
        if (m.groups && m.groups.name !== 'Leiding') {
          memberMap[m.user_id] = m.groups
        }
      }

      const mapped: TxRow[] = rows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        full_name: r.profiles?.full_name ?? 'Onbekend',
        group_name: memberMap[r.user_id]?.name ?? '—',
        group_id: memberMap[r.user_id]?.id ?? '',
        consumption_name: r.consumptions?.name ?? 'Onbekend',
        quantity: r.quantity,
        unit_price: r.unit_price,
        total_price: r.total_price,
        created_at: r.created_at,
        period_id: r.period_id,
      }))

      if (selectedGroup) {
        return mapped.filter(r => (r as TxRow & { group_id: string }).group_id === selectedGroup ||
          groups?.find(g => g.id === selectedGroup)?.name === r.group_name)
      }
      return mapped
    },
    enabled: true,
  })

  async function deleteTransaction(id: string) {
    setDeletingId(id)
    await supabase.from('transactions').delete().eq('id', id)
    await queryClient.invalidateQueries({ queryKey: ['all-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    queryClient.invalidateQueries({ queryKey: ['period-stats'] })
    setConfirmId(null)
    setDeletingId(null)
  }

  const total = (transactions ?? []).reduce((s, t) => s + t.total_price, 0)

  return (
    <div className="px-4 space-y-3">
      <div className="flex gap-2">
        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          className="flex-1 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-primary"
        >
          <option value="">Alle periodes</option>
          {(periods ?? []).map(p => (
            <option key={p.id} value={p.id}>{p.name}{p.is_active ? ' (actief)' : ''}</option>
          ))}
        </select>
        <select
          value={selectedGroup}
          onChange={e => setSelectedGroup(e.target.value)}
          className="flex-1 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-primary"
        >
          <option value="">Alle groepen</option>
          {(groups ?? []).map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {(transactions ?? []).length > 0 && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <Receipt size={14} color="#2563EB" />
            </div>
            <span className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">{transactions?.length} transacties</span>
          </div>
          <span className="text-base font-extrabold text-[#0F172A] dark:text-[#F1F5F9]">€{total.toFixed(2)}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (transactions ?? []).length === 0 && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] px-4 py-8 text-center">
          <p className="text-sm text-[#94A3B8]">Geen transacties gevonden.</p>
        </div>
      )}

      <div className="space-y-2">
        {(transactions ?? []).map(tx => (
          <div key={tx.id} className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">{tx.full_name}</p>
                <p className="text-xs text-[#94A3B8]">{tx.group_name} · {tx.consumption_name} × {tx.quantity}</p>
                <p className="text-xs text-[#94A3B8]">
                  {new Date(tx.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-extrabold text-[#0F172A] dark:text-[#F1F5F9]">€{tx.total_price.toFixed(2)}</span>
                {confirmId === tx.id ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-[#F8FAFC] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] rounded-lg"
                    >
                      Nee
                    </button>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      disabled={deletingId === tx.id}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-[#FEF2F2] dark:bg-[#450A0A] text-[#EF4444] rounded-lg disabled:opacity-50"
                    >
                      {deletingId === tx.id ? '…' : 'Ja'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(tx.id)}
                    className="w-8 h-8 bg-[#FEF2F2] dark:bg-[#450A0A] rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Trash size={14} color="#EF4444" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
