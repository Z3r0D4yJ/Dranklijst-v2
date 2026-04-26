import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CalendarBlank, Stop, Plus, Check } from '@phosphor-icons/react'
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
import { scopesEqual } from '../../lib/period-resolver'
import type { Period } from '../../lib/database.types'

interface PeriodWithGroups extends Period {
  group_ids: string[]
}

interface PeriodStats {
  period: PeriodWithGroups
  user_count: number
  total: number
}

interface GroupRow {
  id: string
  name: string
}

function formatMemberCount(count: number) {
  return `${count} ${count === 1 ? 'lid' : 'leden'}`
}

function ScopeBadges({ groupIds, groups }: { groupIds: string[]; groups: GroupRow[] }) {
  if (groupIds.length === 0) {
    return <Badge variant="primary" size="sm">Alle groepen</Badge>
  }

  const groupMap = new Map(groups.map(g => [g.id, g.name]))
  const visible = groupIds.slice(0, 2)
  const overflow = groupIds.length - visible.length

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(id => (
        <Badge key={id} variant="secondary" size="sm">{groupMap.get(id) ?? '?'}</Badge>
      ))}
      {overflow > 0 && <Badge variant="secondary" size="sm">+{overflow}</Badge>}
    </div>
  )
}

export function Periods() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [scopeMode, setScopeMode] = useState<'all' | 'specific'>('all')
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [closing, setClosing] = useState<string | null>(null)
  const [armedClose, setArmedClose] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: groups } = useQuery({
    queryKey: ['groups-list-all'],
    queryFn: async () => {
      const { data } = await supabase.from('groups').select('id, name').order('name')
      return (data ?? []) as GroupRow[]
    },
  })

  const { data: stats, isLoading } = useQuery({
    queryKey: ['period-stats'],
    queryFn: async () => {
      const { data: periods } = await supabase
        .from('periods')
        .select('id, name, started_at, ended_at, is_active, created_by, period_groups(group_id)')
        .order('started_at', { ascending: false })

      if (!periods) return []

      const periodRows = (periods as unknown as Array<Period & { period_groups: { group_id: string }[] | null }>).map(p => ({
        id: p.id,
        name: p.name,
        started_at: p.started_at,
        ended_at: p.ended_at,
        is_active: p.is_active,
        created_by: p.created_by,
        group_ids: (p.period_groups ?? []).map(pg => pg.group_id),
      })) as PeriodWithGroups[]

      const result: PeriodStats[] = await Promise.all(
        periodRows.map(async (period) => {
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
    setScopeMode('all')
    setSelectedGroups(new Set())
  }

  function toggleGroup(groupId: string) {
    setSelectedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const newScopeIds = useMemo(
    () => (scopeMode === 'specific' ? Array.from(selectedGroups) : []),
    [scopeMode, selectedGroups],
  )

  const submitDisabled =
    loading ||
    !newName.trim() ||
    (scopeMode === 'specific' && selectedGroups.size === 0)

  async function startPeriod() {
    if (!newName.trim() || !user) return
    if (scopeMode === 'specific' && selectedGroups.size === 0) return
    setLoading(true)

    try {
      const activePeriods = (stats ?? []).filter(s => s.period.is_active)
      const conflict = activePeriods.find(s => scopesEqual(s.period.group_ids, newScopeIds))
      if (conflict) {
        const label = newScopeIds.length === 0 ? 'voor alle groepen' : 'voor deze groepen'
        toast.error(`Er loopt al een actieve periode ${label}. Sluit die eerst af.`)
        return
      }

      const { data: created, error } = await supabase
        .from('periods')
        .insert({
          name: newName.trim(),
          is_active: true,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (error || !created) {
        toast.error('Kon periode niet starten.')
        return
      }

      if (newScopeIds.length > 0) {
        const { error: scopeErr } = await supabase
          .from('period_groups')
          .insert(newScopeIds.map(gid => ({ period_id: created.id, group_id: gid })))

        if (scopeErr) {
          await supabase.from('periods').delete().eq('id', created.id)
          toast.error('Kon scope niet opslaan, periode geannuleerd.')
          return
        }
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
  const allGroups = groups ?? []

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
        bodyClassName="space-y-5"
        footer={
          <ActionPillButton
            onClick={startPeriod}
            disabled={submitDisabled}
            variant="accent"
            size="md"
            className="w-full"
          >
            {loading ? 'Bezig...' : 'Starten'}
          </ActionPillButton>
        }
      >
        <div className="space-y-1.5">
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
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-[11px] font-extrabold uppercase tracking-[1px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Voor welke groepen?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <ScopeToggle
              active={scopeMode === 'all'}
              onClick={() => setScopeMode('all')}
              label="Alle groepen"
            />
            <ScopeToggle
              active={scopeMode === 'specific'}
              onClick={() => setScopeMode('specific')}
              label="Specifieke groepen"
            />
          </div>

          {scopeMode === 'specific' && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allGroups.map(group => {
                const selected = selectedGroups.has(group.id)
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-[12px] font-bold transition-colors active:scale-95"
                    style={{
                      background: selected ? 'var(--color-primary-pale)' : 'var(--color-surface)',
                      borderColor: selected ? 'var(--color-primary-border)' : 'var(--color-border-mid)',
                      color: selected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {selected && <Check size={11} weight="bold" color="currentColor" />}
                    {group.name}
                  </button>
                )
              })}
            </div>
          )}

          {scopeMode === 'specific' && selectedGroups.size === 0 && (
            <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Selecteer minstens één groep.
            </p>
          )}
        </div>
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
          <AdminSurface padded className="space-y-3 dl-stagger-card" style={{ animationDelay: '60ms' }}>
            <button
              type="button"
              onClick={() => goToTransactions(period.id)}
              className="block w-full text-left space-y-3 active:opacity-80 transition-opacity"
              style={{ fontFamily: 'inherit' }}
            >
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
                  <div className="mt-2">
                    <ScopeBadges groupIds={period.group_ids} groups={allGroups} />
                  </div>
                </div>
              </div>

              <div
                className="rounded-chip px-3.5 py-2.5"
                style={{
                  background: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-border)',
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
              </div>
            </button>

            {armedClose === period.id ? (
              <div className="grid grid-cols-2 gap-2">
                <ActionPillButton
                  type="button"
                  onClick={() => setArmedClose(null)}
                  disabled={closing === period.id}
                  variant="neutral"
                  size="md"
                  className="w-full"
                >
                  Annuleren
                </ActionPillButton>
                <ActionPillButton
                  type="button"
                  onClick={() => { void closePeriod(period.id, period.name) }}
                  disabled={closing === period.id}
                  variant="danger-soft"
                  size="md"
                  className="w-full"
                >
                  <Stop size={13} weight="fill" />
                  {closing === period.id ? 'Bezig...' : 'Ja, afsluiten'}
                </ActionPillButton>
              </div>
            ) : (
              <ActionPillButton
                onClick={() => setArmedClose(period.id)}
                disabled={closing === period.id}
                variant="danger-soft"
                size="md"
                className="w-full"
              >
                <Stop size={13} weight="fill" />
                Periode afsluiten
              </ActionPillButton>
            )}
          </AdminSurface>
        </section>
      ))}

      {closedStats.length > 0 && (
        <section className="space-y-2">
          <div className="dl-stagger-card" style={{ animationDelay: '120ms' }}>
            <AdminSectionLabel>Afgesloten periodes</AdminSectionLabel>
          </div>
          <AdminSurface>
            {closedStats.map(({ period, user_count, total }, index) => (
              <button
                key={period.id}
                type="button"
                onClick={() => goToTransactions(period.id)}
                className="w-full px-3.5 py-3.5 text-left active:opacity-70 transition-opacity"
                style={{ borderTop: index === 0 ? 'none' : '1px solid var(--color-border)' }}
              >
                <div className="flex items-start gap-3 dl-stagger-row" style={{ animationDelay: `${120 + index * 45}ms` }}>
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
                        <div className="mt-1.5">
                          <ScopeBadges groupIds={period.group_ids} groups={allGroups} />
                        </div>
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

function ScopeToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border px-3 h-11 text-[13px] font-bold transition-colors active:scale-[0.98]"
      style={{
        background: active ? 'var(--color-primary-pale)' : 'var(--color-surface)',
        borderColor: active ? 'var(--color-primary-border)' : 'var(--color-border-mid)',
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
      }}
    >
      {label}
    </button>
  )
}
