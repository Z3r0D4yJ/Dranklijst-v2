import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CaretRight, Receipt, Trash } from '@phosphor-icons/react'
import { IconChip } from '../../components/IconChip'
import { supabase } from '../../lib/supabase'
import { CustomSelect } from '../../components/CustomSelect'
import { Spinner } from '../../components/ui/spinner'
import { Pagination } from '../../components/Pagination'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { usePagination } from '../../hooks/usePagination'
import type { Period } from '../../lib/database.types'

const PAGE_SIZE = 50

interface TxRow {
  id: string
  user_id: string
  full_name: string
  group_id: string
  group_name: string
  consumption_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  period_id: string
}

function TxDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-[12px] px-3.5 py-3"
      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
    >
      <span className="text-[12px] font-bold uppercase tracking-[0.8px]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="text-[13px] font-bold text-right" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  )
}

export function AllTransactions() {
  const queryClient = useQueryClient()
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [armedDelete, setArmedDelete] = useState(false)

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
        id: string
        user_id: string
        quantity: number
        unit_price: number
        total_price: number
        created_at: string
        period_id: string
        profiles: { full_name: string }[] | { full_name: string } | null
        consumptions: { name: string }[] | { name: string } | null
      }>

      const userIds = [...new Set(rows.map((row) => row.user_id))]
      const { data: memberships } = await supabase
        .from('group_members')
        .select('user_id, groups(id, name)')
        .in('user_id', userIds.length ? userIds : ['none'])

      const memberMap: Record<string, { id: string; name: string }> = {}
      for (const membership of (memberships ?? []) as unknown as Array<{ user_id: string; groups: { id: string; name: string }[] | { id: string; name: string } | null }>) {
        const group = Array.isArray(membership.groups) ? membership.groups[0] : membership.groups
        if (group && group.name !== 'Leiding') {
          memberMap[membership.user_id] = group
        }
      }

      const mapped: TxRow[] = rows.map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        const consumption = Array.isArray(row.consumptions) ? row.consumptions[0] : row.consumptions
        return {
          id: row.id,
          user_id: row.user_id,
          full_name: profile?.full_name ?? 'Onbekend',
          group_id: memberMap[row.user_id]?.id ?? '',
          group_name: memberMap[row.user_id]?.name ?? '-',
          consumption_name: consumption?.name ?? 'Onbekend',
          quantity: row.quantity,
          unit_price: row.unit_price,
          total_price: row.total_price,
          created_at: row.created_at,
          period_id: row.period_id,
        }
      })

      if (selectedGroup) {
        return mapped.filter((row) => row.group_id === selectedGroup)
      }

      return mapped
    },
  })

  const allTx = transactions ?? []
  const selectedTx = allTx.find((tx) => tx.id === selectedTxId) ?? null
  const selectedPeriodName = periods?.find((period) => period.id === selectedTx?.period_id)?.name ?? 'Onbekende periode'
  const { slice: pageTx, page, totalPages, onPage } = usePagination(allTx, PAGE_SIZE)
  const total = allTx.reduce((sum, tx) => sum + tx.total_price, 0)

  useEffect(() => {
    setArmedDelete(false)
  }, [selectedTxId])

  useEffect(() => {
    if (selectedTxId && !selectedTx) {
      setSelectedTxId(null)
      setArmedDelete(false)
    }
  }, [selectedTx, selectedTxId])

  async function deleteTransaction(id: string) {
    setDeletingId(id)

    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (!error) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['all-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['period-stats'] }),
      ])
    }

    setSelectedTxId(null)
    setArmedDelete(false)
    setDeletingId(null)
  }

  return (
    <div className="px-4 space-y-3">
      <div className="flex gap-2">
        <CustomSelect
          value={selectedPeriod}
          onChange={(value) => {
            setSelectedPeriod(value)
            setSelectedTxId(null)
          }}
          options={(periods ?? []).map((period) => ({
            value: period.id,
            label: period.name,
            badge: period.is_active ? 'Actief' : undefined,
            badgeTone: 'success',
          }))}
          placeholder="Alle periodes"
          style={{ flex: 1 }}
        />
        <CustomSelect
          value={selectedGroup}
          onChange={(value) => {
            setSelectedGroup(value)
            setSelectedTxId(null)
          }}
          options={(groups ?? []).map((group) => ({ value: group.id, label: group.name }))}
          placeholder="Alle groepen"
          style={{ flex: 1 }}
        />
      </div>

      {allTx.length > 0 && (
        <div className="rounded-[14px] px-4 py-3 flex items-center justify-between" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <IconChip tone="primary" icon={Receipt} size={32} />
            <span className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {allTx.length} transacties
            </span>
          </div>
          <span className="text-[18px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            EUR {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      {!isLoading && allTx.length === 0 && (
        <div className="rounded-[14px] px-4 py-8 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-[13px] m-0" style={{ color: 'var(--color-text-muted)' }}>
            Geen transacties gevonden.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pageTx.map((tx) => (
          <button
            key={tx.id}
            type="button"
            onClick={() => setSelectedTxId(tx.id)}
            className="w-full rounded-[14px] px-3.5 py-3 text-left active:scale-[0.99] transition-transform"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontFamily: 'inherit' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {tx.full_name}
                </p>
                <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {tx.group_name} - {tx.consumption_name} x{tx.quantity}
                </p>
                <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(tx.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[14px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  EUR {tx.total_price.toFixed(2)}
                </span>
                <CaretRight size={14} color="var(--color-text-muted)" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />

      <AdminFormDrawer
        open={!!selectedTx}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTxId(null)
            setArmedDelete(false)
          }
        }}
        title={selectedTx?.full_name ?? 'Transactie'}
        description={selectedTx ? `${selectedTx.group_name} - ${selectedPeriodName}` : 'Transactiedetail'}
        dismissible={deletingId !== selectedTx?.id}
        disableClose={deletingId === selectedTx?.id}
        bodyClassName="space-y-4"
        scrollBody={false}
        footer={
          selectedTx ? (
            armedDelete ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setArmedDelete(false)}
                  disabled={deletingId === selectedTx.id}
                  className="w-full text-[14px] font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{
                    background: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)',
                    padding: '12px',
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    fontFamily: 'inherit',
                  }}
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={() => void deleteTransaction(selectedTx.id)}
                  disabled={deletingId === selectedTx.id}
                  className="w-full text-[14px] font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{
                    background: 'var(--color-danger-bg)',
                    color: 'var(--color-danger)',
                    padding: '12px',
                    borderRadius: 12,
                    border: '1px solid var(--color-danger-border)',
                    fontFamily: 'inherit',
                  }}
                >
                  {deletingId === selectedTx.id ? 'Verwijderen...' : 'Ja, verwijderen'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setArmedDelete(true)}
                disabled={deletingId === selectedTx.id}
                className="w-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                style={{
                  background: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  padding: '12px',
                  borderRadius: 12,
                  border: '1px solid var(--color-danger-border)',
                  fontFamily: 'inherit',
                }}
              >
                <Trash size={15} color="var(--color-danger)" weight="bold" />
                Transactie verwijderen
              </button>
            )
          ) : undefined
        }
      >
        {selectedTx && (
          <>
            <div className="rounded-[14px] p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.9px] m-0" style={{ color: 'var(--color-text-muted)' }}>
                Totaal
              </p>
              <p className="text-[24px] font-extrabold mt-1 mb-0 tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                EUR {selectedTx.total_price.toFixed(2)}
              </p>
              <p className="text-[12px] m-0 mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Bekijk hieronder de details van deze aankoop. Verwijderen blijft mogelijk vanuit deze drawer.
              </p>
            </div>

            <div className="space-y-2">
              <TxDetailRow label="Consumptie" value={selectedTx.consumption_name} />
              <TxDetailRow label="Aantal" value={String(selectedTx.quantity)} />
              <TxDetailRow label="Stukprijs" value={`EUR ${selectedTx.unit_price.toFixed(2)}`} />
              <TxDetailRow label="Totaal" value={`EUR ${selectedTx.total_price.toFixed(2)}`} />
              <TxDetailRow label="Groep" value={selectedTx.group_name} />
              <TxDetailRow label="Periode" value={selectedPeriodName} />
              <TxDetailRow
                label="Moment"
                value={new Date(selectedTx.created_at).toLocaleDateString('nl-BE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            </div>
          </>
        )}
      </AdminFormDrawer>
    </div>
  )
}
