import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CaretRight, CurrencyEur, Receipt, Trash } from '@phosphor-icons/react'
import { useSearchParams } from 'react-router-dom'
import { AdminEmptyState, AdminSectionLabel, AdminStatTile, AdminSurface } from '../../components/AdminThemePrimitives'
import { IconChip } from '../../components/IconChip'
import { supabase } from '../../lib/supabase'
import { CustomSelect } from '../../components/CustomSelect'
import { Spinner } from '../../components/ui/spinner'
import { Pagination } from '../../components/Pagination'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { Badge } from '../../components/ui/badge'
import { ActionPillButton } from '../../components/ui/action-button'
import { usePagination } from '../../hooks/usePagination'
import { formatMoney } from '../../lib/formatters'
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

function TxDetailRow({ label, value, first = false }: { label: string; value: string; first?: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3.5 py-3"
      style={{ borderTop: first ? 'none' : '1px solid var(--color-border)' }}
    >
      <span className="text-[12px] font-bold uppercase tracking-[1.2px]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="text-[13px] font-bold text-right" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  )
}

function formatTransactionMoment(iso: string) {
  return new Date(iso).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AllTransactions() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [armedDelete, setArmedDelete] = useState(false)
  const selectedPeriod = searchParams.get('period') ?? ''

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

  useEffect(() => {
    setSelectedTxId(null)
    setArmedDelete(false)
  }, [selectedPeriod, selectedGroup])

  function updatePeriodFilter(value: string) {
    const nextSearchParams = new URLSearchParams(searchParams)

    if (value) {
      nextSearchParams.set('period', value)
    } else {
      nextSearchParams.delete('period')
    }

    setSearchParams(nextSearchParams, { replace: true })
  }

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
    <div className="px-4 space-y-3 pb-content-end-comfort">
      <section className="space-y-2">
        <AdminSectionLabel>Transactieoverzicht</AdminSectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          <AdminStatTile
            label="Aantal"
            value={String(allTx.length)}
            icon={Receipt}
            tone="primary"
          />
          <AdminStatTile
            label="Omzet"
            value={formatMoney(total)}
            icon={CurrencyEur}
            tone="primary"
            valueTone="primary"
          />
        </div>
      </section>

      <section className="space-y-2">
        <AdminSectionLabel>Filters</AdminSectionLabel>
        <div className="flex flex-col gap-2.5">
          <CustomSelect
            value={selectedPeriod}
            onChange={updatePeriodFilter}
            options={(periods ?? []).map((period) => ({
              value: period.id,
              label: period.name,
              statusDot: period.is_active ? 'success' : undefined,
            }))}
            placeholder="Alle periodes"
            style={{ minWidth: 0 }}
          />
          <CustomSelect
            value={selectedGroup}
            onChange={setSelectedGroup}
            options={(groups ?? []).map((group) => ({ value: group.id, label: group.name }))}
            placeholder="Alle groepen"
            style={{ minWidth: 0 }}
          />
        </div>
      </section>

      {isLoading && (
        <div className="flex justify-center mt-8">
          <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      {!isLoading && allTx.length === 0 && (
        <AdminEmptyState
          icon={Receipt}
          title="Geen transacties gevonden"
          description="Pas je filters aan of wacht tot er nieuwe aankopen in deze periode verschijnen."
        />
      )}

      {allTx.length > 0 && (
        <section className="space-y-2">
          <AdminSectionLabel>Transacties</AdminSectionLabel>
          <AdminSurface>
            {pageTx.map((tx, index) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => setSelectedTxId(tx.id)}
                className="w-full px-3.5 py-3.5 text-left active:opacity-70 transition-opacity"
                style={{
                  borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                }}
              >
                <div className="flex items-start gap-3">
                  <IconChip tone="primary" icon={Receipt} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {tx.full_name}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge variant="secondary" size="sm">
                            {tx.group_name}
                          </Badge>
                          <Badge
                            variant="secondary"
                            size="sm"
                            className="max-w-full whitespace-normal break-words text-left leading-[1.25]"
                          >
                            {tx.consumption_name} x{tx.quantity}
                          </Badge>
                          <Badge variant="muted" size="sm">
                            {formatTransactionMoment(tx.created_at)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[16px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                          {formatMoney(tx.total_price)}
                        </span>
                        <CaretRight size={14} color="var(--color-text-muted)" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </AdminSurface>
        </section>
      )}

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
        description={selectedTx ? `${selectedTx.group_name} - ${selectedPeriodName}` : undefined}
        dismissible={deletingId !== selectedTx?.id}
        disableClose={deletingId === selectedTx?.id}
        bodyClassName="space-y-3"
        footer={
          selectedTx ? (
            armedDelete ? (
              <div className="grid grid-cols-2 gap-2">
                <ActionPillButton
                  type="button"
                  onClick={() => setArmedDelete(false)}
                  disabled={deletingId === selectedTx.id}
                  variant="neutral"
                  size="md"
                  className="w-full"
                >
                  Annuleren
                </ActionPillButton>
                <ActionPillButton
                  type="button"
                  onClick={() => void deleteTransaction(selectedTx.id)}
                  disabled={deletingId === selectedTx.id}
                  variant="danger-soft"
                  size="md"
                  className="w-full"
                >
                  {deletingId === selectedTx.id ? 'Verwijderen...' : 'Ja, verwijderen'}
                </ActionPillButton>
              </div>
            ) : (
              <ActionPillButton
                type="button"
                onClick={() => setArmedDelete(true)}
                disabled={deletingId === selectedTx.id}
                variant="danger-soft"
                size="md"
                className="w-full"
              >
                <Trash size={15} color="currentColor" weight="bold" />
                Transactie verwijderen
              </ActionPillButton>
            )
          ) : undefined
        }
      >
        {selectedTx && (
          <>
            <section className="space-y-2">
              <AdminSectionLabel>Totaal</AdminSectionLabel>
              <AdminSurface padded>
                <p className="m-0 text-[24px] font-extrabold tracking-[-0.6px] tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {formatMoney(selectedTx.total_price)}
                </p>
              </AdminSurface>
            </section>

            <section className="space-y-2">
              <AdminSectionLabel>Details</AdminSectionLabel>
              <AdminSurface>
              <TxDetailRow first label="Consumptie" value={selectedTx.consumption_name} />
              <TxDetailRow label="Aantal" value={String(selectedTx.quantity)} />
              <TxDetailRow label="Stukprijs" value={formatMoney(selectedTx.unit_price)} />
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
              </AdminSurface>
            </section>
          </>
        )}
      </AdminFormDrawer>
    </div>
  )
}
