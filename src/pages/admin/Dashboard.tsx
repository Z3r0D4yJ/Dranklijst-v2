import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CalendarBlank, CurrencyEur, Receipt, TrendUp } from '@phosphor-icons/react'
import { AdminEmptyState, AdminSectionLabel, AdminStatTile, AdminSurface, SkeletonStatTiles } from '../../components/AdminThemePrimitives'
import { IconChip } from '../../components/IconChip'
import { CustomSelect } from '../../components/CustomSelect'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../lib/formatters'

interface GroupStat { name: string; total: number }
interface PeriodOption { id: string; name: string; is_active: boolean; started_at: string; ended_at: string | null }
interface DashboardData {
  totalRevenue: number
  totalTransactions: number
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
      supabase.from('transactions').select('user_id, total_price').eq('period_id', selectedPeriod),
      supabase.from('groups').select('id, name').neq('name', 'Leiding'),
      supabase.from('group_members').select('user_id, groups(id, name)'),
    ]).then(([txRes, groupsRes, membershipsRes]) => {
      if (cancelled) return

      const allTx = (txRes.data ?? []) as { user_id: string; total_price: number }[]
      const allGroups = (groupsRes.data ?? []) as { id: string; name: string }[]
      const allMemberships = (membershipsRes.data ?? []) as Array<{
        user_id: string
        groups: { id: string; name: string }[] | { id: string; name: string } | null
      }>

      const totalRevenue = allTx.reduce((sum, transaction) => sum + Number(transaction.total_price), 0)
      const totalTransactions = allTx.length

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

      setData({ totalRevenue, totalTransactions, topGroup, groupStats })
      setStatsLoading(false)
    }).catch(() => {
      if (!cancelled) {
        setStatsLoading(false)
        toast.error('Dashboard kon niet geladen worden.')
      }
    })

    return () => {
      cancelled = true
    }
  }, [selectedPeriod])

  if (loading) {
    return (
      <div className="px-5 space-y-3 pb-content-end-comfort">
        <section className="space-y-2">
          <AdminSectionLabel>Dashboard</AdminSectionLabel>
          <SkeletonStatTiles count={3} fullWidthLast />
        </section>
      </div>
    )
  }

  const currentPeriod = periods.find((period) => period.id === selectedPeriod)
  const visibleGroupStats = (data?.groupStats ?? []).filter((group) => group.total > 0)
  const maxVisibleGroupTotal = Math.max(...visibleGroupStats.map((group) => group.total), 1)

  return (
    <div className="px-5 space-y-3 pb-content-end-comfort">
      {periods.length > 0 && (
        <section className="space-y-2 dl-stagger-card" style={{ animationDelay: '0ms' }}>
          <AdminSectionLabel>Periode</AdminSectionLabel>
          <CustomSelect
            value={selectedPeriod}
            onChange={(value) => {
              manuallySelected.current = true
              setSelectedPeriod(value)
            }}
            options={periods.map((period) => ({
              value: period.id,
              label: period.name,
              statusDot: period.is_active ? 'success' : undefined,
            }))}
            icon={<IconChip tone={currentPeriod?.is_active ? 'success' : 'neutral'} icon={CalendarBlank} size={28} />}
          />
        </section>
      )}

      {selectedPeriod && (
        <>
          {statsLoading ? (
            <section className="space-y-2">
              <AdminSectionLabel>Dashboard</AdminSectionLabel>
              <SkeletonStatTiles count={3} fullWidthLast />
            </section>
          ) : (
            <>
              <section className="space-y-2">
                <AdminSectionLabel>Dashboard</AdminSectionLabel>

                <div className="grid grid-cols-2 gap-2.5">
                  <AdminStatTile
                    label="Omzet"
                    value={formatMoney(data?.totalRevenue ?? 0)}
                    icon={CurrencyEur}
                    tone="primary"
                    valueTone="primary"
                    className="dl-stagger-tile"
                    style={{ animationDelay: '0ms' }}
                  />
                  <AdminStatTile
                    label="Aankopen"
                    value={String(data?.totalTransactions ?? 0)}
                    icon={Receipt}
                    tone="primary"
                    className="dl-stagger-tile"
                    style={{ animationDelay: '65ms' }}
                  />
                  <AdminStatTile
                    label="Top groep"
                    value={data?.topGroup ?? 'Geen omzet'}
                    icon={TrendUp}
                    tone="warning"
                    valueTone="warning"
                    valueClassName="text-[15px]"
                    className="col-span-2 dl-stagger-tile"
                    style={{ animationDelay: '130ms' }}
                  />
                </div>
              </section>

              {visibleGroupStats.length > 0 && (
                <section className="space-y-2">
                  <AdminSectionLabel>Omzet per groep</AdminSectionLabel>
                  <AdminSurface padded>
                  <div className="flex flex-col gap-2.5">
                    {visibleGroupStats.map((group, i) => {
                      const percentage = Math.max(6, Math.round((group.total / maxVisibleGroupTotal) * 100))

                      return (
                        <div
                          key={group.name}
                          className="rounded-chip border px-3 py-2.5 dl-stagger-card"
                          style={{
                            background: 'var(--color-surface-alt)',
                            borderColor: 'var(--color-border)',
                            animationDelay: `${200 + i * 45}ms`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className="min-w-0 truncate text-[12px] font-semibold"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {group.name}
                            </span>
                            <span
                              className="shrink-0 text-right text-[12px] font-extrabold tabular-nums"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {formatMoney(group.total)}
                            </span>
                          </div>
                          <div
                            className="mt-2 h-2 overflow-hidden rounded-full"
                            style={{ background: 'var(--color-surface)' }}
                          >
                            <div
                              className="h-full rounded-full dl-bar-grow"
                              style={{
                                width: `${percentage}%`,
                                background: 'var(--color-primary)',
                                animationDelay: `${350 + i * 60}ms`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  </AdminSurface>
                </section>
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
