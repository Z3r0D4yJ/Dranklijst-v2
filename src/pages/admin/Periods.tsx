import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CalendarBlank, Stop, Plus, CheckCircle, Users, CurrencyEur } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/spinner'
import { Badge } from '../../components/ui/badge'
import { ActionPillButton } from '../../components/ui/action-button'
import { IconChip } from '../../components/IconChip'
import { useAuth } from '../../context/AuthContext'
import { notifyPeriodClosed } from '../../lib/notifications'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import type { Period } from '../../lib/database.types'

interface PeriodStats {
  period: Period
  user_count: number
  total: number
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

  const inputStyle = {
    background: 'var(--color-surface-alt)',
    border: '1.5px solid var(--color-border-mid)',
    borderRadius: 12,
    padding: '10px 14px',
    color: 'var(--color-text-primary)',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    width: '100%',
    outline: 'none',
  }

  return (
    <div className="px-4 space-y-3">
      <button
        onClick={() => setShowNew(true)}
        className="w-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        style={{
          background: 'var(--color-primary)',
          color: '#fff',
          padding: 13,
          borderRadius: 14,
          border: 'none',
          boxShadow: 'var(--shadow-fab)',
          fontFamily: 'inherit',
        }}
      >
        <Plus size={16} weight="bold" />
        Nieuwe periode starten
      </button>

      <AdminFormDrawer
        open={showNew}
        onOpenChange={(open) => {
          if (!open) closeNewDrawer()
        }}
        title="Nieuwe periode"
        description="Geef de nieuwe actieve periode een duidelijke naam."
        dismissible={!loading}
        disableClose={loading}
        scrollBody
        fixed={false}
        repositionInputs={false}
        bodyClassName="space-y-1.5"
        footer={
          <button
            onClick={startPeriod}
            disabled={!newName.trim() || loading}
            className="w-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Bezig...' : 'Starten'}
          </button>
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
          style={inputStyle}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void startPeriod()
            }
          }}
        />
      </AdminFormDrawer>

      {isLoading && (
        <div className="flex justify-center mt-8">
          <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {(stats ?? []).map(({ period, user_count, total }) => (
          <div
            key={period.id}
            className="rounded-card p-3.5 relative overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              border: `1px solid ${period.is_active ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
            }}
          >
            {period.is_active && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: 'var(--color-primary)',
                }}
              />
            )}
            <div className="flex items-start gap-3" style={{ paddingLeft: period.is_active ? 8 : 0 }}>
              <IconChip tone={period.is_active ? 'primary' : 'neutral'} icon={CalendarBlank} size={34} />
              <div className="flex-1">
                <p className="text-[14px] font-bold m-0 mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {period.name}
                </p>
                <p className="text-[12px] m-0" style={{ color: 'var(--color-text-muted)' }}>
                  {formatDate(period.started_at)}
                  {period.ended_at ? ` -> ${formatDate(period.ended_at)}` : ' · Actief'}
                </p>
              </div>
              {period.is_active && (
                <ActionPillButton
                  onClick={() => closePeriod(period.id, period.name)}
                  disabled={closing === period.id}
                  variant="danger-soft"
                  size="sm"
                >
                  <Stop size={12} weight="fill" />
                  {closing === period.id ? 'Bezig...' : 'Afsluiten'}
                </ActionPillButton>
              )}
              {!period.is_active && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle size={14} weight="fill" />
                  Gesloten
                </Badge>
              )}
            </div>

            <div
              className="flex gap-4 mt-3 pt-2.5"
              style={{ borderTop: '1px solid var(--color-border)', paddingLeft: period.is_active ? 8 : 0 }}
            >
              {[
                { icon: Users, value: `${user_count} leden` },
                { icon: CurrencyEur, value: `EUR ${total.toFixed(2)} totaal` },
              ].map(({ icon, value }, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <IconChip tone="primary" icon={icon} size={24} />
                  <span className="text-[12px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
