import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CalendarBlank, Stop, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { ActionPillButton } from '../../components/ui/action-button'
import { IconChip } from '../../components/IconChip'
import { AdminSectionLabel, AdminSurface, SkeletonList } from '../../components/AdminThemePrimitives'
import { Badge } from '../../components/ui/badge'
import { useAuth } from '../../context/AuthContext'
import { notifyPeriodClosed } from '../../lib/notifications'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { formatMoney } from '../../lib/formatters'
import type { Period } from '../../lib/database.types'

interface PeriodStats {
  period: Period
  user_count: number
  total: number
}

function formatMemberCount(count: number) {
  return `${count} ${count === 1 ? 'lid' : 'leden'}`
}

export function Periods() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [closing, setClosing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['period-stats'],
    queryFn: async () => {
      const { data: periods } = await supabase
        .from('periods')
        .select('*')
        .order('started_at', { ascending: false })

      if (!periods) return []

      const result: PeriodStats[] = await Promise.all(
        (periods as Period[]).map(async (period) => {
          const { data } = await supabase
            .from('transactions')
            .select('user_id, total_price')
            .eq('period_id', period.id)

          const rows = (data ?? []) as { user_id: string; total_price: number }[]
          const userCount = new Set(rows.map((row) => row.user_id)).size
          const total = rows.reduce((sum, row) => sum + row.total_price, 0)

          return { period, user_count: userCount, total }
        }),
      )

      return result
    },
  })

  function closeNewDrawer() {
    setShowNew(false)
    setNewName('')
  }

  async function startPeriod() {
    if (!newName.trim() || !user) return
    setLoading(true)

    try {
      const { error } = await supabase.from('periods').insert({
        name: newName.trim(),
        is_active: true,
        created_by: user.id,
      })

      if (error) {
        toast.error('Kon periode niet starten.')
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['period-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['active-period'] }),
        queryClient.invalidateQueries({ queryKey: ['periods'] }),
      ])

      closeNewDrawer()
      toast.success('Periode gestart.')
    } finally {
      setLoading(false)
    }
  }

  async function closePeriod(periodId: string, periodName: string) {
    setClosing(periodId)

    const { error } = await supabase.rpc('close_period', { p_period_id: periodId })

    if (error) {
      toast.error('Kon periode niet afsluiten.')
    } else {
      queryClient.invalidateQueries({ queryKey: ['period-stats'] })
      queryClient.invalidateQueries({ queryKey: ['active-period'] })
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['open-payments'] })
      notifyPeriodClosed(periodId, periodName)
      navigate('/admin/financieel')
    }

    setClosing(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('nl-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function goToTransactions(periodId: string) {
    const params = new URLSearchParams({ period: periodId })
    navigate(`/admin/transacties?${params.toString()}`)
  }

  const activeStats = (stats ?? []).filter(({ period }) => period.is_active)
  const closedStats = (stats ?? []).filter(({ period }) => !period.is_active)

  return (
    <div className="px-5 space-y-3 pb-content-end-comfort">
      <ActionPillButton
        onClick={() => setShowNew(true)}
        variant="accent"
        size="md"
        className="w-full dl-stagger-card"
        style={{ animationDelay: '0ms' }}
      >
        <Plus size={16} weight="bold" />
        Nieuwe periode starten
      </ActionPillButton>

      <AdminFormDrawer
        open={showNew}
        onOpenChange={(open) => {
          if (!open) closeNewDrawer()
        }}
        title="Nieuwe periode"
        dismissible={!loading}
        disableClose={loading}
        scrollBody
        fixed={false}
        repositionInputs={false}
        bodyClassName="space-y-1.5"
        footer={
          <ActionPillButton
            onClick={startPeriod}
            disabled={!newName.trim() || loading}
            variant="accent"
            size="md"
            className="w-full"
          >
            {loading ? 'Bezig...' : 'Starten'}
          </ActionPillButton>
        }
      >
        <label
          className="text-[11px] font-extrabold uppercase tracking-[1px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Naam
        </label>
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="bv. Zomerkamp 2025"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          className="dl-input text-[13px]"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void startPeriod()
            }
          }}
        />
      </AdminFormDrawer>

      {isLoading && (
        <section className="space-y-2">
          <AdminSectionLabel>Periodes</AdminSectionLabel>
          <SkeletonList rows={4} trailing="amount" />
        </section>
      )}

      {activeStats.map(({ period, user_count, total }) => (
        <section key={period.id} className="space-y-2">
          <AdminSectionLabel>Actieve periode</AdminSectionLabel>
          <AdminSurface padded className="space-y-3 dl-stagger-card" style={{ animationDelay: '80ms' }}>
            <div className="flex items-start gap-3">
              <IconChip tone="primary" icon={CalendarBlank} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p
                    className="m-0 truncate text-[16px] font-extrabold tracking-[-0.4px]"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {period.name}
                  </p>
                  <Badge variant="success" dot dotPulse>Lopend</Badge>
                </div>
                <p className="m-0 mt-1 text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Sinds {formatDate(period.started_at)} · {formatMemberCount(user_count)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => goToTransactions(period.id)}
              className="w-full rounded-[12px] px-3.5 py-2.5 text-left active:scale-[0.99] transition-transform"
              style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                fontFamily: 'inherit',
              }}
            >
              <p
                className="m-0 text-[11px] font-extrabold uppercase tracking-[1.2px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Huidige omzet
              </p>
              <p
                className="mt-1 text-[16px] font-extrabold tracking-[-0.35px] tabular-nums"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {formatMoney(total)}
              </p>
            </button>

            <ActionPillButton
              onClick={() => closePeriod(period.id, period.name)}
              disabled={closing === period.id}
              variant="danger-soft"
              size="md"
              className="w-full"
            >
              <Stop size={13} weight="fill" />
              {closing === period.id ? 'Periode wordt afgesloten...' : 'Periode afsluiten'}
            </ActionPillButton>
          </AdminSurface>
        </section>
      ))}

      {closedStats.length > 0 && (
        <section className="space-y-2">
          <div className="dl-stagger-card" style={{ animationDelay: '160ms' }}>
            <AdminSectionLabel>Afgesloten periodes</AdminSectionLabel>
          </div>
          <AdminSurface>
            {closedStats.map(({ period, user_count, total }, index) => (
              <button
                key={period.id}
                type="button"
                onClick={() => goToTransactions(period.id)}
                className="w-full px-3.5 py-3.5 text-left active:opacity-70 transition-opacity dl-stagger-row"
                style={{
                  borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                  animationDelay: `${220 + index * 45}ms`,
                }}
              >
                <div className="flex items-start gap-3">
                  <IconChip tone="neutral" icon={CalendarBlank} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {period.name}
                        </p>
                        <p className="m-0 mt-1 text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                          {formatDate(period.started_at)} – {formatDate(period.ended_at ?? period.started_at)} · {formatMemberCount(user_count)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[16px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                          {formatMoney(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </AdminSurface>
        </section>
      )}
    </div>
  )
}
