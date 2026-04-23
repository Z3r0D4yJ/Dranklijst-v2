import { useEffect, useRef, useState } from 'react'
import { CalendarBlank, CurrencyEur, Receipt, TrendUp, Users } from '@phosphor-icons/react'
import { AdminEmptyState, AdminOverviewCard, AdminStatTile } from '../../components/AdminThemePrimitives'
import { IconChip } from '../../components/IconChip'
import { Badge } from '../../components/ui/badge'
import { CustomSelect } from '../../components/CustomSelect'
import { Spinner } from '../../components/ui/spinner'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../lib/formatters'

interface GroupStat { name: string; total: number }
interface PeriodOption { id: string; name: string; is_active: boolean; started_at: string; ended_at: string | null }
interface DashboardData {
  totalRevenue: number
  totalTransactions: number
  totalUsers: number
  topGroup: string
  groupStats: GroupStat[]
}

export function Dashboard() {
  const [periods, setPeriods] = useState<PeriodOption[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const manuallySelected = useRef(false)

  useEffect(() => {
    supabase
      .from('periods')
      .select('id, name, is_active, started_at, ended_at')
      .order('started_at', { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as PeriodOption[]
        setPeriods(list)
        if (list.length && !manuallySelected.current) {
          setSelectedPeriod(list[0].id)
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedPeriod) return

    let cancelled = false
    setStatsLoading(true)

    Promise.all([
      supabase.from('profiles').select('id, role'),
      supabase.from('transactions').select('user_id, total_price').eq('period_id', selectedPeriod),
      supabase.from('groups').select('id, name').neq('name', 'Leiding'),
      supabase.from('group_members').select('user_id, groups(id, name)'),
    ]).then(([profilesRes, txRes, groupsRes, membershipsRes]) => {
      if (cancelled) return

      const allProfiles = (profilesRes.data ?? []) as { id: string; role: string }[]
      const allTx = (txRes.data ?? []) as { user_id: string; total_price: number }[]
      const allGroups = (groupsRes.data ?? []) as { id: string; name: string }[]
      const allMemberships = (membershipsRes.data ?? []) as Array<{
        user_id: string
        groups: { id: string; name: string }[] | { id: string; name: string } | null
      }>

      const totalRevenue = allTx.reduce((sum, transaction) => sum + Number(transaction.total_price), 0)
      const totalTransactions = allTx.length
      const totalUsers = allProfiles.filter((profile) => profile.role === 'lid').length

      const dashboardGroupIds = new Set(allGroups.map((group) => group.id))
      const memberGroupMap: Record<string, string> = {}
      for (const membership of allMemberships) {
        const group = Array.isArray(membership.groups) ? membership.groups[0] : membership.groups
        if (!group) continue
        if (!dashboardGroupIds.has(group.id)) continue
        if (memberGroupMap[membership.user_id]) continue
        memberGroupMap[membership.user_id] = group.id
      }

      const groupTotals: Record<string, number> = {}
      for (const transaction of allTx) {
        const groupId = memberGroupMap[transaction.user_id]
        if (groupId) groupTotals[groupId] = (groupTotals[groupId] ?? 0) + Number(transaction.total_price)
      }

      const groupStats: GroupStat[] = allGroups
        .map((group) => ({ name: group.name, total: groupTotals[group.id] ?? 0 }))
        .sort((a, b) => b.total - a.total)

      const topGroup = groupStats[0]?.total > 0 ? groupStats[0].name : 'Geen omzet'

      setData({ totalRevenue, totalTransactions, totalUsers, topGroup, groupStats })
      setStatsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [selectedPeriod])

  if (loading) {
    return (
      <div className="flex justify-center mt-12">
        <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  const currentPeriod = periods.find((period) => period.id === selectedPeriod)
  const visibleGroupStats = (data?.groupStats ?? []).filter((group) => group.total > 0)

  return (
    <div className="px-4 space-y-3 pb-content-end-comfort">
      {periods.length > 0 && (
        <div
          className="rounded-card border p-3.5"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p
            className="m-0 text-[11px] font-extrabold uppercase tracking-[1.2px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Periode
          </p>
          <div className="mt-2">
            <CustomSelect
              value={selectedPeriod}
              onChange={(value) => {
                manuallySelected.current = true
                setSelectedPeriod(value)
              }}
              options={periods.map((period) => ({
                value: period.id,
                label: period.name,
                badge: period.is_active ? 'Actief' : undefined,
                badgeTone: 'success',
              }))}
              icon={<IconChip tone={currentPeriod?.is_active ? 'success' : 'neutral'} icon={CalendarBlank} size={28} />}
            />
          </div>
        </div>
      )}

      {selectedPeriod && (
        <>
          {statsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-6" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : (
            <>
              <AdminOverviewCard
                icon={TrendUp}
                tone="primary"
                eyebrow="Dashboard"
                title={currentPeriod?.name ?? 'Periode'}
                description="Een compacte samenvatting van omzet, aankopen en leden voor deze periode."
                badge={
                  currentPeriod ? (
                    <Badge variant={currentPeriod.is_active ? 'success' : 'secondary'}>
                      {currentPeriod.is_active ? 'Actief' : 'Gesloten'}
                    </Badge>
                  ) : undefined
                }
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <AdminStatTile
                    label="Omzet"
                    value={formatMoney(data?.totalRevenue ?? 0)}
                    icon={CurrencyEur}
                    tone="primary"
                    valueTone="primary"
                  />
                  <AdminStatTile
                    label="Aankopen"
                    value={String(data?.totalTransactions ?? 0)}
                    icon={Receipt}
                    tone="primary"
                  />
                  <AdminStatTile
                    label="Leden"
                    value={String(data?.totalUsers ?? 0)}
                    icon={Users}
                    tone="neutral"
                  />
                  <AdminStatTile
                    label="Top groep"
                    value={data?.topGroup ?? 'Geen omzet'}
                    icon={TrendUp}
                    tone="warning"
                    valueTone="warning"
                    valueClassName="text-[15px]"
                  />
                </div>
              </AdminOverviewCard>

              {visibleGroupStats.length > 0 && (
                <div
                  className="rounded-card p-3.5"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <p
                    className="text-[11px] font-extrabold uppercase tracking-[1.2px] m-0 mb-3"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Omzet per groep
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {visibleGroupStats.map((group) => {
                      const max = Math.max(...visibleGroupStats.map((item) => item.total), 1)
                      const pct = Math.round((group.total / max) * 100)
                      return (
                        <div key={group.name} className="flex items-center gap-2.5">
                          <span
                            className="text-[12px] font-semibold text-right shrink-0 w-14 truncate"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {group.name}
                          </span>
                          <div
                            className="flex-1 h-6 rounded-[6px] overflow-hidden"
                            style={{ background: 'var(--color-surface-alt)' }}
                          >
                            <div
                              className="h-full rounded-[6px]"
                              style={{ width: `${pct}%`, background: 'var(--color-primary)' }}
                            />
                          </div>
                          <span
                            className="w-20 shrink-0 text-right text-[12px] font-extrabold tabular-nums"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {formatMoney(group.total)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {data?.totalTransactions === 0 && (
                <AdminEmptyState
                  icon={Receipt}
                  title="Geen transacties"
                  description="Voor deze periode zijn nog geen aankopen geregistreerd."
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
