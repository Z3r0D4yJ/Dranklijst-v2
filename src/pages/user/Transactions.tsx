import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Receipt } from '@phosphor-icons/react'
import { useActivePeriod } from '../../hooks/useActivePeriod'
import { useTransactions } from '../../hooks/useTransactions'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useSwipe } from '../../hooks/useSwipe'
import { IconChip } from '../../components/IconChip'
import { EmptyState, PageHeader } from '../../components/AdminThemePrimitives'
import { Pagination } from '../../components/Pagination'
import { usePagination } from '../../hooks/usePagination'
import type { Period, ConsumptionCategory } from '../../lib/database.types'
import { Badge, badgeVariants } from '../../components/ui/badge'

function groupByDate<T extends { created_at: string }>(items: T[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const groups: Record<string, T[]> = {}
  for (const item of items) {
    const d = new Date(item.created_at)
    d.setHours(0, 0, 0, 0)
    let key: string
    if (d.getTime() === today.getTime()) key = 'Vandaag'
    else if (d.getTime() === yesterday.getTime()) key = 'Gisteren'
    else key = new Date(item.created_at).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'Betaald', pending: 'Betaling in afwachting', unpaid: 'Nog te betalen',
}

export function Transactions() {
  useThemeColor('--color-surface')
  const { user } = useAuth()
  const { data: activePeriod } = useActivePeriod()
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data } = await supabase.from('periods').select('*').order('started_at', { ascending: false })
      return (data ?? []) as Period[]
    },
  })

  useEffect(() => {
    if (selectedPeriodId) return
    if (activePeriod) { setSelectedPeriodId(activePeriod.id); return }
    if (periods?.length) setSelectedPeriodId(periods[0].id)
  }, [activePeriod, periods, selectedPeriodId])

  const selectedPeriod = periods?.find(p => p.id === selectedPeriodId) ?? null
  const activeIndex = (periods ?? []).findIndex(p => p.id === selectedPeriodId)

  const swipe = useSwipe({
    onSwipeLeft: () => {
      if (activeIndex < (periods ?? []).length - 1) setSelectedPeriodId((periods ?? [])[activeIndex + 1].id)
    },
    onSwipeRight: () => {
      if (activeIndex > 0) setSelectedPeriodId((periods ?? [])[activeIndex - 1].id)
    },
  })

  useEffect(() => {
    const bar = tabBarRef.current
    if (!bar) return
    const active = bar.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [selectedPeriodId])

  const { data: transactions, isLoading } = useTransactions(selectedPeriod?.id)

  const allTx = transactions ?? []
  const total = allTx.reduce((s, t) => s + t.total_price, 0)
  const { slice: pageTx, page, totalPages, onPage } = usePagination(allTx, 30)
  const grouped = groupByDate(pageTx)

  const { data: payment } = useQuery({
    queryKey: ['payment', user?.id, selectedPeriod?.id],
    enabled: !!user && !!selectedPeriod,
    queryFn: async () => {
      const { data } = await supabase
        .from('payments').select('*')
        .eq('user_id', user!.id).eq('period_id', selectedPeriod!.id).maybeSingle()
      return data as { status: string; amount_due: number; amount_paid: number } | null
    },
  })

  return (
    <div className="min-h-screen pb-nav-clearance" style={{ background: 'var(--color-bg)' }} {...swipe}>
      <PageHeader title="Transacties" sub={selectedPeriod?.name} />

      {/* ─── Periode-tabs ─────────────────────────── */}
      {(periods ?? []).length > 1 && (
        <div
          ref={tabBarRef}
          data-swipe-ignore
          className="flex gap-2 overflow-x-auto px-5 py-3 shrink-0"
          style={{
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            scrollbarWidth: 'none',
          }}
        >
          {(periods ?? []).map(p => {
            const isActive = p.id === selectedPeriodId
            return (
              <button
                key={p.id}
                data-active={isActive ? 'true' : undefined}
                onClick={() => setSelectedPeriodId(p.id)}
                className={badgeVariants({
                  variant: isActive ? 'default' : 'secondary',
                  size: 'lg',
                })}
              >
                {p.name}
                {p.is_active && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: isActive ? 'rgba(255,255,255,0.7)' : 'var(--color-success)' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="px-5 pt-4 space-y-4">
        {/* ─── Total card ──────────────────────────── */}
        <div className="rounded-card overflow-hidden relative" style={{ background: 'var(--color-primary)', padding: '18px 20px', color: '#fff' }}>
          <img
            src="/fox.png"
            alt=""
            style={{ position: 'absolute', right: -20, bottom: -28, width: 150, height: 150, opacity: 0.95, pointerEvents: 'none', transform: 'rotate(8deg)' }}
          />
          <p className="text-[12px] font-semibold uppercase tracking-[0.6px] relative" style={{ opacity: 0.75 }}>Totaal verbruikt</p>
          {(!selectedPeriodId || isLoading) ? (
            <div className="h-[48px] w-36 rounded-lg mt-1 mb-2.5" style={{ background: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <p className="text-[40px] font-extrabold tracking-[-1px] mt-1 mb-2.5 tabular-nums relative">€ {total.toFixed(2).replace('.', ',')}</p>
          )}
          {payment && (
            <Badge variant="onPrimary" className="gap-1.5 px-3 relative">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {STATUS_LABEL[payment.status] ?? payment.status}
            </Badge>
          )}
        </div>

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

        {!isLoading && allTx.length === 0 && (
          <EmptyState icon={Receipt} title="Nog niets gekocht" description="Je transacties verschijnen hier." />
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
                    className="flex items-center gap-3 px-3.5 py-3.5 dl-stagger-row"
                    style={{
                      borderTop: i === 0 ? 'none' : '1px solid var(--color-border)',
                      animationDelay: `${120 + i * 45}ms`,
                    }}
                  >
                    <IconChip tone={(t as { category?: ConsumptionCategory }).category ?? 'primary'} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{t.consumption_name}</p>
                      <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t.quantity}× · {time}</p>
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
