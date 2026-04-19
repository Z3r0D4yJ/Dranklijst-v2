import { useQuery } from '@tanstack/react-query'
import { Receipt } from '@phosphor-icons/react'
import { useActivePeriod } from '../../hooks/useActivePeriod'
import { useTransactions } from '../../hooks/useTransactions'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useThemeColor } from '../../hooks/useThemeColor'
import { IconChip } from '../../components/IconChip'
import type { Period, ConsumptionCategory } from '../../lib/database.types'

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
  useThemeColor('--color-bg')
  const { user } = useAuth()
  const { data: activePeriod } = useActivePeriod()

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data } = await supabase.from('periods').select('*').order('started_at', { ascending: false })
      return (data ?? []) as Period[]
    },
  })

  const selectedPeriod = activePeriod ?? periods?.[0]
  const { data: transactions, isLoading } = useTransactions(selectedPeriod?.id)

  const total = (transactions ?? []).reduce((s, t) => s + t.total_price, 0)
  const grouped = groupByDate(transactions ?? [])

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
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* ─── Header ──────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 16px' }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: 'var(--color-text-primary)' }}>Transacties</h1>
        {selectedPeriod && (
          <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{selectedPeriod.name}</p>
        )}
      </div>

      <div className="px-5 pt-4 pb-24 space-y-4">
        {/* ─── Total card ──────────────────────────── */}
        <div className="rounded-[20px] overflow-hidden relative" style={{ background: 'var(--color-primary)', padding: '18px 20px', color: '#fff' }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70, background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 30, bottom: -20, width: 80, height: 80, borderRadius: 40, background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          {/* Fox */}
          <img
            src="/fox.png"
            alt=""
            style={{ position: 'absolute', right: -20, bottom: -28, width: 150, height: 150, opacity: 0.95, pointerEvents: 'none', transform: 'rotate(8deg)' }}
          />
          <p className="text-[12px] font-semibold uppercase tracking-[0.6px] relative" style={{ opacity: 0.75 }}>Totaal verbruikt</p>
          <p className="text-[40px] font-extrabold tracking-[-1px] mt-1 mb-2.5 tabular-nums relative">€ {total.toFixed(2).replace('.', ',')}</p>
          {payment && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold tracking-[0.3px] relative" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {STATUS_LABEL[payment.status] ?? payment.status}
            </div>
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

        {/* ─── Empty state ─────────────────────────── */}
        {!isLoading && (transactions ?? []).length === 0 && (
          <div className="rounded-card px-4 py-10 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <IconChip tone="primary" icon={Receipt} size={48} />
            <p className="text-[14px] font-bold mt-3" style={{ color: 'var(--color-text-primary)' }}>Nog niets gekocht</p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Je transacties verschijnen hier.</p>
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
      </div>
    </div>
  )
}
