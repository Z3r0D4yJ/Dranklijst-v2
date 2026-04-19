import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash, Receipt } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { CustomSelect } from '../../components/CustomSelect'
import { Pagination } from '../../components/Pagination'
import { usePagination } from '../../hooks/usePagination'
import type { Period } from '../../lib/database.types'

const PAGE_SIZE = 50

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
        .in('user_id', userIds.length ? userIds : ['none'])

      const memberMap: Record<string, { id: string; name: string }> = {}
      for (const m of (memberships ?? []) as unknown as Array<{ user_id: string; groups: { id: string; name: string } | null }>) {
        if (m.groups && m.groups.name !== 'Leiding') memberMap[m.user_id] = m.groups
      }

      const mapped = rows.map(r => ({
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
        return mapped.filter(r => r.group_id === selectedGroup)
      }
      return mapped as TxRow[]
    },
    enabled: true,
  })

  const allTx = transactions ?? []
  const { slice: pageTx, page, totalPages, onPage } = usePagination(allTx, PAGE_SIZE)
  const total = allTx.reduce((s, t) => s + t.total_price, 0)

  async function deleteTransaction(id: string) {
    setDeletingId(id)
    await supabase.from('transactions').delete().eq('id', id)
    await queryClient.invalidateQueries({ queryKey: ['all-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    queryClient.invalidateQueries({ queryKey: ['period-stats'] })
    setConfirmId(null)
    setDeletingId(null)
  }

  return (
    <div className="px-4 space-y-3">
      {/* Filters */}
      <div className="flex gap-2">
        <CustomSelect
          value={selectedPeriod}
          onChange={v => { setSelectedPeriod(v) }}
          options={(periods ?? []).map(p => ({ value: p.id, label: p.name + (p.is_active ? ' (actief)' : '') }))}
          placeholder="Alle periodes"
          style={{ flex: 1 }}
        />
        <CustomSelect
          value={selectedGroup}
          onChange={v => { setSelectedGroup(v) }}
          options={(groups ?? []).map(g => ({ value: g.id, label: g.name }))}
          placeholder="Alle groepen"
          style={{ flex: 1 }}
        />
      </div>

      {/* Summary */}
      {allTx.length > 0 && (
        <div className="rounded-[14px] px-4 py-3 flex items-center justify-between" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center" style={{ background: 'var(--color-primary-pale)' }}>
              <Receipt size={14} color="var(--color-primary)" />
            </div>
            <span className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{allTx.length} transacties</span>
          </div>
          <span className="text-[18px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>€{total.toFixed(2).replace('.', ',')}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      )}

      {!isLoading && allTx.length === 0 && (
        <div className="rounded-[14px] px-4 py-8 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-[13px] m-0" style={{ color: 'var(--color-text-muted)' }}>Geen transacties gevonden.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pageTx.map(tx => (
          <div key={tx.id} className="rounded-[14px] px-3.5 py-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>{tx.full_name}</p>
                <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{tx.group_name} · {tx.consumption_name} ×{tx.quantity}</p>
                <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(tx.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[14px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>€{tx.total_price.toFixed(2)}</span>
                {confirmId === tx.id ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-2.5 py-1.5 text-[12px] font-semibold rounded-[8px]"
                      style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}
                    >
                      Nee
                    </button>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      disabled={deletingId === tx.id}
                      className="px-2.5 py-1.5 text-[12px] font-semibold rounded-[8px] disabled:opacity-50"
                      style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
                    >
                      {deletingId === tx.id ? '…' : 'Ja'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(tx.id)}
                    className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center active:scale-95 transition-transform"
                    style={{ background: 'var(--color-danger-bg)', border: 'none' }}
                  >
                    <Trash size={13} color="var(--color-danger)" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  )
}
