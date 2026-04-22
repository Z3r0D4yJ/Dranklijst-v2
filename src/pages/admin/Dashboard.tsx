import { useState, useEffect, useRef } from 'react'
import { Users, CurrencyEur, Receipt, TrendUp, CalendarBlank } from '@phosphor-icons/react'
import { IconChip } from '../../components/IconChip'
import { supabase } from '../../lib/supabase'
import { CustomSelect } from '../../components/CustomSelect'
import { Spinner } from '../../components/ui/spinner'

interface GroupStat { name: string; total: number }
interface PeriodOption { id: string; name: string; is_active: boolean; started_at: string; ended_at: string | null }
interface DashboardData {
  totalRevenue: number
  totalTransactions: number
  totalUsers: number
  topGroup: string
  groupStats: GroupStat[]
}

function StatCard({ label, value, icon, iconBg, valueColor }: {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  valueColor: string
}) {
  return (
    <div className="rounded-card p-3.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-[1.2px] m-0" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <div className="w-7 h-7 rounded-[9px] flex items-center justify-center" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <p className="text-[20px] font-extrabold tracking-[-0.5px] m-0 tabular-nums" style={{ color: valueColor }}>{value}</p>
    </div>
  )
}

const BAR_COLORS = ['var(--color-primary)', 'oklch(0.60 0.18 221)', 'oklch(0.65 0.15 221)', 'oklch(0.70 0.12 221)', 'oklch(0.75 0.09 221)']

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

      const totalRevenue = allTx.reduce((s, t) => s + Number(t.total_price), 0)
      const totalTransactions = allTx.length
      const totalUsers = allProfiles.filter(p => p.role === 'lid').length

      const dashboardGroupIds = new Set(allGroups.map(group => group.id))
      const memberGroupMap: Record<string, string> = {}
      for (const membership of allMemberships) {
        const group = Array.isArray(membership.groups) ? membership.groups[0] : membership.groups
        if (!group) continue
        if (!dashboardGroupIds.has(group.id)) continue
        if (memberGroupMap[membership.user_id]) continue
        memberGroupMap[membership.user_id] = group.id
      }

      const groupTotals: Record<string, number> = {}
      for (const t of allTx) {
        const gid = memberGroupMap[t.user_id]
        if (gid) groupTotals[gid] = (groupTotals[gid] ?? 0) + Number(t.total_price)
      }

      const groupStats: GroupStat[] = allGroups
        .map(g => ({ name: g.name, total: groupTotals[g.id] ?? 0 }))
        .sort((a, b) => b.total - a.total)

      const topGroup = groupStats[0]?.total > 0 ? groupStats[0].name : '—'

      setData({ totalRevenue, totalTransactions, totalUsers, topGroup, groupStats })
      setStatsLoading(false)
    })

    return () => { cancelled = true }
  }, [selectedPeriod])

  if (loading) {
    return (
      <div className="flex justify-center mt-12">
        <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  const currentPeriod = periods.find(p => p.id === selectedPeriod)

  return (
    <div className="px-4 space-y-3 pb-content-end-comfort">
      {/* Period picker */}
      {periods.length > 0 && (
        <CustomSelect
          value={selectedPeriod}
          onChange={v => { manuallySelected.current = true; setSelectedPeriod(v) }}
          options={periods.map(p => ({
            value: p.id,
            label: p.name,
            badge: p.is_active ? 'Actief' : undefined,
            badgeTone: 'success',
          }))}
          icon={<IconChip tone={currentPeriod?.is_active ? 'success' : 'neutral'} icon={CalendarBlank} size={28} />}
        />
      )}

      {selectedPeriod && (
        <>
          {statsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-6" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard
                  label="Omzet"
                  value={`€${(data?.totalRevenue ?? 0).toFixed(2)}`}
                  icon={<CurrencyEur size={13} color="var(--color-success)" />}
                  iconBg="var(--color-success-bg)"
                  valueColor="var(--color-success)"
                />
                <StatCard
                  label="Transacties"
                  value={String(data?.totalTransactions ?? 0)}
                  icon={<Receipt size={13} color="var(--color-primary)" />}
                  iconBg="var(--color-primary-pale)"
                  valueColor="var(--color-primary)"
                />
                <StatCard
                  label="Leden"
                  value={String(data?.totalUsers ?? 0)}
                  icon={<Users size={13} color="var(--color-accent)" />}
                  iconBg="var(--color-accent-bg)"
                  valueColor="var(--color-accent)"
                />
                <StatCard
                  label="Top groep"
                  value={data?.topGroup ?? '—'}
                  icon={<TrendUp size={13} color="var(--color-gold)" />}
                  iconBg="color-mix(in oklch, var(--color-gold) 14%, transparent)"
                  valueColor="var(--color-gold)"
                />
              </div>

              {(data?.groupStats?.filter(g => g.total > 0).length ?? 0) > 0 && (
                <div className="rounded-card p-3.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] m-0 mb-3" style={{ color: 'var(--color-text-muted)' }}>Omzet per groep</p>
                  <div className="flex flex-col gap-2.5">
                    {(data?.groupStats ?? []).filter(g => g.total > 0).map((b, i) => {
                      const max = Math.max(...(data?.groupStats ?? []).map(g => g.total), 1)
                      const pct = Math.round((b.total / max) * 100)
                      return (
                        <div key={i} className="flex items-center gap-2.5">
                          <span className="text-[12px] font-semibold text-right shrink-0 w-11" style={{ color: 'var(--color-text-secondary)' }}>{b.name}</span>
                          <div className="flex-1 h-6 rounded-[6px] overflow-hidden" style={{ background: 'var(--color-surface-alt)' }}>
                            <div
                              className="h-full rounded-[6px] flex items-center justify-end pr-2"
                              style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                            >
                              <span className="text-[11px] font-extrabold text-white tabular-nums">€{Math.round(b.total)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {data?.totalTransactions === 0 && (
                <div className="rounded-card px-4 py-6 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <p className="text-[13px] m-0" style={{ color: 'var(--color-text-muted)' }}>Geen transacties voor deze periode.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
