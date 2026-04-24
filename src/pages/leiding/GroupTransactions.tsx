import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CaretRight, Receipt } from '@phosphor-icons/react'
import { AdminEmptyState, AdminSectionLabel, AdminSurface, DetailRow, PageHeader, SkeletonList } from '../../components/AdminThemePrimitives'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { CustomSelect } from '../../components/CustomSelect'
import { IconChip } from '../../components/IconChip'
import { Pagination } from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { usePagination } from '../../hooks/usePagination'
import { useThemeColor } from '../../hooks/useThemeColor'
import { formatMoney } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'
import type { ConsumptionCategory, Period } from '../../lib/database.types'

const PAGE_SIZE = 50

interface TxRow {
  id: string
  user_id: string
  full_name: string
  group_id: string
  group_name: string
  consumption_name: string
  category: ConsumptionCategory | null
  icon: string | null
  color: string | null
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  period_id: string
}

function formatTransactionMoment(iso: string) {
  return new Date(iso).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function GroupTransactions() {
  useThemeColor('--color-surface')
  const { profile } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)

  const { data: groupInfo, isLoading: isGroupLoading } = useQuery({
    queryKey: ['leiding-group', profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data: managedGroupId } = await supabase.rpc('get_my_leiding_group')

      if (typeof managedGroupId === 'string') {
        const { data: managedGroup } = await supabase
          .from('groups')
          .select('id, name')
          .eq('id', managedGroupId)
          .maybeSingle()

        if (managedGroup) return managedGroup
      }

      const { data } = await supabase
        .from('group_members')
        .select('group_id, groups(name)')
        .eq('user_id', profile!.id)

      const memberships = (data ?? []) as unknown as Array<{ group_id: string; groups: { name: string } | null }>
      const own = memberships.find((membership) => membership.groups?.name !== 'Leiding')

      return own ? { id: own.group_id, name: own.groups?.name ?? '' } : null
    },
  })

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data } = await supabase.from('periods').select('*').order('started_at', { ascending: false })
      return (data ?? []) as Period[]
    },
  })

  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['group-transactions', groupInfo?.id, selectedPeriod],
    enabled: !!groupInfo,
    queryFn: async () => {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupInfo!.id)

      const userIds = (members ?? []).map((member) => member.user_id)
      if (!userIds.length) return []

      let query = supabase
        .from('transactions')
        .select('id, user_id, quantity, unit_price, total_price, created_at, period_id, profiles(full_name), consumptions(name, category, icon, color)')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })

      if (selectedPeriod) query = query.eq('period_id', selectedPeriod)

      const { data } = await query

      return ((data ?? []) as unknown as Array<{
        id: string
        user_id: string
        quantity: number
        unit_price: number
        total_price: number
        created_at: string
        period_id: string
        profiles: { full_name: string }[] | { full_name: string } | null
        consumptions:
          | { name: string; category: ConsumptionCategory | null; icon: string | null; color: string | null }[]
          | { name: string; category: ConsumptionCategory | null; icon: string | null; color: string | null }
          | null
      }>).map((row) => {
        const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        const consumption = Array.isArray(row.consumptions) ? row.consumptions[0] : row.consumptions

        return {
          id: row.id,
          user_id: row.user_id,
          full_name: profileRow?.full_name ?? 'Onbekend',
          group_id: groupInfo!.id,
          group_name: groupInfo!.name,
          consumption_name: consumption?.name ?? 'Onbekend',
          category: consumption?.category ?? null,
          icon: consumption?.icon ?? null,
          color: consumption?.color ?? null,
          quantity: row.quantity,
          unit_price: row.unit_price,
          total_price: row.total_price,
          created_at: row.created_at,
          period_id: row.period_id,
        } satisfies TxRow
      })
    },
  })

  const allTx = transactions ?? []
  const selectedTx = allTx.find((tx) => tx.id === selectedTxId) ?? null
  const selectedTxPeriodName = periods?.find((period) => period.id === selectedTx?.period_id)?.name ?? 'Onbekende periode'
  const { slice: pageTx, page, totalPages, onPage } = usePagination(allTx, PAGE_SIZE)
  const total = allTx.reduce((sum, tx) => sum + tx.total_price, 0)
  const isLoading = isGroupLoading || isTransactionsLoading

  return (
    <div className="min-h-screen pb-nav-clearance" style={{ background: 'var(--color-bg)' }}>
      <PageHeader title="Groepstransacties" sub={groupInfo?.name} />

      <div className="px-5 pt-4 space-y-3 pb-content-end-comfort">
        <section className="space-y-2 dl-stagger-card" style={{ animationDelay: '0ms' }}>
          <AdminSectionLabel>Periode</AdminSectionLabel>
          <CustomSelect
            value={selectedPeriod}
            onChange={(value) => {
              setSelectedPeriod(value)
              setSelectedTxId(null)
            }}
            options={(periods ?? []).map((period) => ({
              value: period.id,
              label: period.name,
              statusDot: period.is_active ? 'success' : undefined,
            }))}
            placeholder="Alle periodes"
            style={{ minWidth: 0 }}
          />
        </section>

        {isLoading && (
          <section className="space-y-2">
            <AdminSectionLabel>Transacties</AdminSectionLabel>
            <SkeletonList rows={6} trailing="caret" />
          </section>
        )}

        {!isLoading && !groupInfo && (
          <AdminEmptyState
            icon={Receipt}
            title="Geen groep gevonden"
            description="Je account is nog niet gekoppeld aan een groep."
          />
        )}

        {!isLoading && groupInfo && allTx.length === 0 && (
          <AdminEmptyState
            icon={Receipt}
            title="Geen transacties gevonden"
            description="Kies een andere periode of wacht tot er aankopen in jouw groep verschijnen."
          />
        )}

        {allTx.length > 0 && (
          <section className="space-y-2">
            <div
              className="flex items-baseline justify-between gap-3 dl-stagger-card"
              style={{ animationDelay: '80ms' }}
            >
              <AdminSectionLabel>Transacties</AdminSectionLabel>
              <span className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                {allTx.length} {allTx.length === 1 ? 'transactie' : 'transacties'} · {formatMoney(total)}
              </span>
            </div>
            <AdminSurface>
              {pageTx.map((tx, index) => (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => setSelectedTxId(tx.id)}
                  className="w-full px-3.5 py-3.5 text-left active:opacity-70 transition-opacity dl-stagger-row"
                  style={{
                    borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
                    fontFamily: 'inherit',
                    animationDelay: `${120 + index * 45}ms`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <IconChip
                      tone={tx.category ?? 'primary'}
                      colorName={tx.color ?? undefined}
                      iconName={tx.icon ?? undefined}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {tx.full_name}
                          </p>
                          <p className="m-0 mt-0.5 text-[12px] font-medium truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {tx.consumption_name} · {tx.quantity}× · {formatTransactionMoment(tx.created_at)}
                          </p>
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
      </div>

      <AdminFormDrawer
        open={!!selectedTx}
        onOpenChange={(open) => {
          if (!open) setSelectedTxId(null)
        }}
        title={selectedTx?.consumption_name ?? 'Transactie'}
        description={selectedTxPeriodName}
        bodyClassName="space-y-3"
      >
        {selectedTx && (
          <>
            <div className="flex items-center gap-3">
              <IconChip
                tone={selectedTx.category ?? 'primary'}
                colorName={selectedTx.color ?? undefined}
                iconName={selectedTx.icon ?? undefined}
                size={56}
              />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[18px] font-extrabold tracking-[-0.3px]" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedTx.consumption_name}
                </p>
                <p className="m-0 mt-0.5 text-[22px] font-extrabold tracking-[-0.5px] tabular-nums" style={{ color: 'var(--color-primary)' }}>
                  {formatMoney(selectedTx.total_price)}
                </p>
              </div>
            </div>

            <AdminSurface>
              <DetailRow first label="Lid" value={selectedTx.full_name} />
              <DetailRow label="Aantal" value={`${selectedTx.quantity}×`} />
              <DetailRow label="Stukprijs" value={formatMoney(selectedTx.unit_price)} />
              <DetailRow label="Totaal" value={formatMoney(selectedTx.total_price)} />
              <DetailRow
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
          </>
        )}
      </AdminFormDrawer>
    </div>
  )
}
