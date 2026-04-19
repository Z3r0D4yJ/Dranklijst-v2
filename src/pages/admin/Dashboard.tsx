import { useState, useEffect, useRef } from 'react'
import { Users, CurrencyEur, Receipt, TrendUp, CalendarBlank } from '@phosphor-icons/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'

interface GroupStat { name: string; total: number }
interface PeriodOption { id: string; name: string; is_active: boolean; started_at: string; ended_at: string | null }
interface DashboardData {
  totalRevenue: number
  totalTransactions: number
  totalUsers: number
  topGroup: string
  groupStats: GroupStat[]
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#94A3B8]">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  )
}

const BAR_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF']

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
      supabase.from('group_members').select('user_id, group_id'),
    ]).then(([profilesRes, txRes, groupsRes, membershipsRes]) => {
      if (cancelled) return

      const allProfiles = (profilesRes.data ?? []) as { id: string; role: string }[]
      const allTx = (txRes.data ?? []) as { user_id: string; total_price: number }[]
      const allGroups = (groupsRes.data ?? []) as { id: string; name: string }[]
      const allMemberships = (membershipsRes.data ?? []) as { user_id: string; group_id: string }[]

      const totalRevenue = allTx.reduce((s, t) => s + Number(t.total_price), 0)
      const totalTransactions = allTx.length
      const totalUsers = allProfiles.filter(p => p.role === 'lid').length

      const memberGroupMap: Record<string, string> = {}
      for (const m of allMemberships) memberGroupMap[m.user_id] = m.group_id

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
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentPeriod = periods.find(p => p.id === selectedPeriod)

  return (
    <div className="px-4 space-y-4">
      {periods.length > 0 && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-[14px] px-4 py-3 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${currentPeriod?.is_active ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' : 'bg-[#F8FAFC] dark:bg-[#334155]'}`}>
            <CalendarBlank size={15} color={currentPeriod?.is_active ? '#10B981' : '#94A3B8'} />
          </div>
          <select
            value={selectedPeriod}
            onChange={e => { manuallySelected.current = true; setSelectedPeriod(e.target.value) }}
            className="flex-1 bg-transparent text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}{p.is_active ? ' (actief)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPeriod && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <TrendUp size={15} color="#2563EB" weight="bold" />
            <p className="text-xs font-bold text-primary uppercase tracking-wider">{currentPeriod?.name}</p>
          </div>

          {statsLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Omzet" value={`€${(data?.totalRevenue ?? 0).toFixed(2)}`}
                  icon={<CurrencyEur size={16} color="#10B981" />} color="text-[#10B981]" bg="bg-[#ECFDF5] dark:bg-[#064E3B]" />
                <StatCard label="Transacties" value={String(data?.totalTransactions ?? 0)}
                  icon={<Receipt size={16} color="#2563EB" />} color="text-[#0F172A] dark:text-[#F1F5F9]" bg="bg-[#EFF6FF] dark:bg-[#1E3A8A]" />
                <StatCard label="Leden totaal" value={String(data?.totalUsers ?? 0)}
                  icon={<Users size={16} color="#8B5CF6" />} color="text-[#0F172A] dark:text-[#F1F5F9]" bg="bg-[#F5F3FF] dark:bg-[#2E1065]" />
                <StatCard label="Top groep" value={data?.topGroup ?? '—'}
                  icon={<TrendUp size={16} color="#F59E0B" />} color="text-[#0F172A] dark:text-[#F1F5F9]" bg="bg-[#FFFBEB] dark:bg-[#44250A]" />
              </div>

              {(data?.groupStats?.filter(g => g.total > 0).length ?? 0) > 0 && (
                <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] p-4">
                  <p className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4">Omzet per groep</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data?.groupStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                      <Tooltip
                        formatter={(v) => [`€${Number(v).toFixed(2)}`, 'Omzet']}
                        contentStyle={{ borderRadius: 10, border: '1px solid #334155', fontSize: 12, backgroundColor: '#1E293B', color: '#F1F5F9' }}
                      />
                      <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                        {data?.groupStats.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data?.totalTransactions === 0 && (
                <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] px-4 py-6 text-center">
                  <p className="text-sm text-[#94A3B8]">Geen transacties voor deze periode.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
