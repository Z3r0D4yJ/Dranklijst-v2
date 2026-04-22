import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useThemeColor } from '../../hooks/useThemeColor'
import { IconChip } from '../../components/IconChip'
import { Receipt } from '@phosphor-icons/react'
import { Pagination } from '../../components/Pagination'
import { usePagination } from '../../hooks/usePagination'
import type { ConsumptionCategory } from '../../lib/database.types'

interface TxRow {
  id: string
  user_id: string
  full_name: string
  consumption_name: string
  category: ConsumptionCategory | null
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

interface PeriodOption { id: string; name: string; is_active: boolean }

function groupByDate<T extends { created_at: string }>(items: T[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const groups: Record<string, T[]> = {}
  for (const item of items) {
    const d = new Date(item.created_at); d.setHours(0, 0, 0, 0)
    let key: string
    if (d.getTime() === today.getTime()) key = 'Vandaag'
    else if (d.getTime() === yesterday.getTime()) key = 'Gisteren'
    else key = new Date(item.created_at).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

export function GroupTransactions() {
  useThemeColor('--color-surface')
  const { profile } = useAuth()

  const { data: groupInfo } = useQuery({
    queryKey: ['leiding-group', profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from('group_members')
        .select('group_id, groups(name)')
        .eq('user_id', profile!.id)
      const memberships = (data ?? []) as unknown as Array<{ group_id: string; groups: { name: string } | null }>
      const own = memberships.find(m => m.groups?.name !== 'Leiding')
      return own ? { id: own.group_id, name: own.groups?.name ?? '' } : null
    },
  })

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data } = await supabase.from('periods').select('id, name, is_active').order('started_at', { ascending: false })
      return (data ?? []) as PeriodOption[]
    },
  })

  const activePeriod = periods?.find(p => p.is_active) ?? periods?.[0]

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['group-transactions', groupInfo?.id, activePeriod?.id],
    enabled: !!groupInfo && !!activePeriod,
    queryFn: async () => {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupInfo!.id)

      const userIds = (members ?? []).map(m => m.user_id)
      if (!userIds.length) return []

      const { data } = await supabase
        .from('transactions')
        .select('id, user_id, quantity, unit_price, total_price, created_at, profiles(full_name), consumptions(name, category)')
        .in('user_id', userIds)
        .eq('period_id', activePeriod!.id)
        .order('created_at', { ascending: false })

      return ((data ?? []) as unknown as Array<{
        id: string; user_id: string; quantity: number; unit_price: number
        total_price: number; created_at: string
        profiles: { full_name: string } | null
        consumptions: { name: string; category: string } | null
      }>).map(r => ({
        id: r.id,
        user_id: r.user_id,
        full_name: r.profiles?.full_name ?? 'Onbekend',
        consumption_name: r.consumptions?.name ?? 'Onbekend',
        category: (r.consumptions?.category ?? null) as ConsumptionCategory | null,
        quantity: r.quantity,
        unit_price: r.unit_price,
        total_price: r.total_price,
        created_at: r.created_at,
      })) as TxRow[]
    },
  })

  const allTx = transactions ?? []
  const total = allTx.reduce((s, t) => s + t.total_price, 0)
  const { slice: pageTx, page, totalPages, onPage } = usePagination(allTx, 30)
  const grouped = groupByDate(pageTx)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* ─── Header ──────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 16px' }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: 'var(--color-text-primary)' }}>Groepstransacties</h1>
        {groupInfo && activePeriod && (
          <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{groupInfo.name} · {activePeriod.name}</p>
        )}
      </div>

      <div className="px-5 pt-4 pb-24 space-y-4">
        {/* ─── Total card ──────────────────────────── */}
        {(transactions ?? []).length > 0 && (
          <div className="rounded-card px-4 py-3.5 flex items-center justify-between" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2.5">
              <IconChip tone="primary" icon={Receipt} size={32} />
              <span className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{transactions?.length} transacties</span>
            </div>
            <span className="text-[18px] font-extrabold tabular-nums tracking-[-0.3px]" style={{ color: 'var(--color-text-primary)' }}>
              € {total.toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        {/* ─── Skeleton ─────────────────────────────── */}
        {isLoading && (
          <div className="space-y-3" style={{ '--skel-base': 'var(--color-surface-alt)', '--skel-hl': 'var(--color-border)' } as React.CSSProperties}>
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-card p-3.5 flex items-center gap-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="dl-skel w-9 h-9 rounded-chip shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="dl-skel h-3 w-2/3 rounded" />
                  <div className="dl-skel h-2.5 w-1/3 rounded" />
                </div>
                <div className="dl-skel h-4 w-12 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* ─── Empty state ─────────────────────────── */}
        {!isLoading && allTx.length === 0 && (
          <div className="rounded-card px-4 py-10 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <IconChip tone="primary" icon={Receipt} size={48} />
            <p className="text-[14px] font-bold mt-3" style={{ color: 'var(--color-text-primary)' }}>Nog geen transacties</p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Transacties van jouw groep verschijnen hier.</p>
          </div>
        )}

        {/* ─── Grouped list ─────────────────────────── */}
        {Object.entries(grouped).map(([date, items]) => (
          <section key={date}>
            <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] mb-2.5 ml-0.5" style={{ color: 'var(--color-text-muted)' }}>{date}</p>
            <div className="rounded-card overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {items.map((t, i) => {
                const time = new Date(t.created_at).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-3.5 py-3.5"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}
                  >
                    <IconChip tone={t.category ?? 'primary'} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t.consumption_name}</p>
                      <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {t.full_name} · {t.quantity}× · {time}
                      </p>
                    </div>
                    <p className="text-[15px] font-extrabold tracking-[-0.2px] tabular-nums shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                      −€{t.total_price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <Pagination page={page} totalPages={totalPages} onPage={onPage} />
      </div>
    </div>
  )
}
