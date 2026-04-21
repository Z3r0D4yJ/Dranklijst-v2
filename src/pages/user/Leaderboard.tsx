import { useState, useRef, useEffect } from 'react'
import { Crown, Medal } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useActivePeriod } from '../../hooks/useActivePeriod'
import { useLeaderboard, type LeaderboardEntry, type LeaderboardGroup } from '../../hooks/useLeaderboard'
import { useMyGroups } from '../../hooks/useMyGroups'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useSwipe } from '../../hooks/useSwipe'
import { badgeVariants } from '../../components/ui/badge'

function Pillar({ rank, name, total, height }: { rank: number; name: string; total: number; height: number }) {
  const tone = rank === 1 ? 'var(--color-accent)' : rank === 2 ? 'var(--color-silver)' : 'var(--color-bronze)'
  const toneSoft = `color-mix(in oklch, ${tone} 60%, transparent)`
  const toneGlow = `color-mix(in oklch, ${tone} 35%, transparent)`
  const IconEl = rank === 1 ? Crown : Medal

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: 86 }}>
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
        style={{ background: tone, boxShadow: rank === 1 ? `0 6px 14px ${toneGlow}` : 'none' }}
      >
        <IconEl size={22} color="#fff" weight="bold" />
      </div>
      <p className="text-[13px] font-bold text-center leading-tight truncate w-full px-1" style={{ color: 'var(--color-text-primary)' }}>{name}</p>
      <p className="text-[13px] font-extrabold tabular-nums" style={{ color: 'var(--color-primary)' }}>€ {total.toFixed(2).replace('.', ',')}</p>
      <div
        className="w-full flex items-start justify-center pt-2.5 text-white text-[22px] font-extrabold tracking-[-0.5px] rounded-[10px_10px_4px_4px]"
        style={{ height, background: `linear-gradient(180deg, ${tone} 0%, ${toneSoft} 100%)` }}
      >
        {rank}
      </div>
    </div>
  )
}

function EntryRow({ entry, isMe, index }: { entry: LeaderboardEntry; isMe: boolean; index: number }) {
  const isPodium = entry.rank <= 3
  const tone = entry.rank === 1 ? 'var(--color-accent)' : entry.rank === 2 ? 'var(--color-silver)' : entry.rank === 3 ? 'var(--color-bronze)' : null
  const delay = index * 40

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3.5"
      style={{
        borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
        background: isMe ? 'var(--color-primary-pale)' : 'transparent',
        animation: `dl-fade-in 180ms ${delay}ms both`,
      }}
    >
      <div
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-extrabold tracking-[-0.2px] shrink-0"
        style={{
          background: tone ?? 'var(--color-surface-alt)',
          color: isPodium ? '#fff' : 'var(--color-text-secondary)',
        }}
      >
        {entry.rank}
      </div>
      <p className="flex-1 text-[14px] font-bold truncate" style={{ color: isMe ? 'var(--color-primary-on)' : 'var(--color-text-primary)' }}>
        {entry.full_name}
        {isMe && <span className="ml-1.5 text-[12px] font-semibold opacity-70">(jij)</span>}
      </p>
      <p className="text-[14px] font-extrabold tabular-nums shrink-0" style={{ color: isMe ? 'var(--color-primary-on)' : 'var(--color-text-primary)' }}>
        € {entry.total.toFixed(2).replace('.', ',')}
      </p>
    </div>
  )
}

function GroupView({ group, userId }: { group: LeaderboardGroup; userId: string | undefined }) {
  return (
    <div className="px-5 pb-24 space-y-3" style={{ paddingTop: 58 }}>
      {group.entries.length >= 2 && (
        <div className="rounded-card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '22px 16px 18px' }}>
          <div className="flex items-end justify-center gap-2" style={{ height: 180 }}>
            <Pillar rank={2} name={group.entries[1]?.full_name.split(' ')[0] ?? ''} total={group.entries[1]?.total ?? 0} height={100} />
            <Pillar rank={1} name={group.entries[0]?.full_name.split(' ')[0] ?? ''} total={group.entries[0]?.total ?? 0} height={140} />
            {group.entries[2] && (
              <Pillar rank={3} name={group.entries[2].full_name.split(' ')[0]} total={group.entries[2].total} height={74} />
            )}
          </div>
        </div>
      )}

      <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] pt-1 ml-0.5" style={{ color: 'var(--color-text-muted)' }}>Volledige ranking</p>

      <div className="rounded-card overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {group.entries.map((entry, i) => (
          <EntryRow key={entry.user_id} entry={entry} isMe={entry.user_id === userId} index={i} />
        ))}
        {group.entries.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Nog niemand gekocht.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function Leaderboard() {
  useThemeColor('--color-surface')
  const { profile } = useAuth()
  const { data: period } = useActivePeriod()
  const { data: allGroups, isLoading } = useLeaderboard(period?.id)
  const { data: myGroups } = useMyGroups()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)

  const canSeeAll = profile?.role === 'kas'
  const isLeaderLike = profile?.role === 'leiding' || profile?.role === 'kas'
  const myGroupIds = new Set((myGroups ?? []).map(g => g.id))
  const ownLeaderGroupId = (myGroups ?? []).find(g => g.name !== 'Leiding')?.id ?? null

  const baseVisibleGroups = canSeeAll
    ? (allGroups ?? [])
    : (allGroups ?? []).filter(g => myGroupIds.has(g.group_id))

  const visibleGroups = isLeaderLike
    ? [...baseVisibleGroups].sort((a, b) => {
      const priorityA = a.group_name === 'Leiding' ? 0 : a.group_id === ownLeaderGroupId ? 1 : 2
      const priorityB = b.group_name === 'Leiding' ? 0 : b.group_id === ownLeaderGroupId ? 1 : 2

      if (priorityA !== priorityB) return priorityA - priorityB
      return a.group_name.localeCompare(b.group_name)
    })
    : baseVisibleGroups

  const activeGroup = visibleGroups.find(g => g.group_id === selectedId) ?? visibleGroups[0] ?? null
  const activeIndex = visibleGroups.findIndex(g => g.group_id === (activeGroup?.group_id ?? null))

  const swipe = useSwipe({
    onSwipeLeft: () => {
      if (activeIndex < visibleGroups.length - 1) setSelectedId(visibleGroups[activeIndex + 1].group_id)
    },
    onSwipeRight: () => {
      if (activeIndex > 0) setSelectedId(visibleGroups[activeIndex - 1].group_id)
    },
  })

  useEffect(() => {
    const bar = tabBarRef.current
    if (!bar) return
    const active = bar.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [activeGroup?.group_id])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }} {...swipe}>
      {/* ─── Header ──────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 16px', position: 'relative', zIndex: 10 }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: 'var(--color-text-primary)' }}>Leaderboard</h1>
        {period && (
          <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{period.name}</p>
        )}
      </div>

      {/* ─── Group tabs (only when multiple groups) ── */}
      {!isLoading && visibleGroups.length > 1 && (
        <div
          ref={tabBarRef}
          className="flex gap-2 overflow-x-auto px-5 py-3 shrink-0"
          style={{
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            scrollbarWidth: 'none',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {visibleGroups.map(g => {
            const isActive = g.group_id === (activeGroup?.group_id ?? null)
            return (
              <button
                key={g.group_id}
                data-active={isActive ? 'true' : undefined}
                onClick={() => setSelectedId(g.group_id)}
                className={badgeVariants({
                  variant: isActive ? 'default' : 'secondary',
                  size: 'lg',
                })}
              >
                {g.group_name}
              </button>
            )
          })}
        </div>
      )}

      {/* ─── Skeleton ─────────────────────────────── */}
      {isLoading && (
        <div className="px-5 pt-5 space-y-3" style={{ '--skel-base': 'var(--color-surface-alt)', '--skel-hl': 'var(--color-border)' } as React.CSSProperties}>
          <div className="rounded-card p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-end justify-center gap-2 h-40">
              {[100, 140, 74].map((h, i) => (
                <div key={i} className="dl-skel flex-1 rounded-t-[10px]" style={{ height: h }} />
              ))}
            </div>
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-card p-3.5 flex items-center gap-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="dl-skel w-[30px] h-[30px] rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="dl-skel h-3 w-2/3 rounded" />
              </div>
              <div className="dl-skel h-3.5 w-14 rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !period && (
        <div className="px-5 mt-10 text-center">
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Geen actieve periode.</p>
        </div>
      )}

      {!isLoading && period && visibleGroups.length === 0 && (
        <div className="px-5 mt-10 text-center">
          <img src="/fox.png" alt="" className="w-16 h-16 object-cover rounded-full mx-auto mb-3 opacity-60" style={{ animation: 'dl-wiggle 2.6s ease-in-out infinite' }} />
          <p className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Nog geen scores</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Koop iets om op het leaderboard te komen.</p>
        </div>
      )}

      {!isLoading && activeGroup && (
        <GroupView group={activeGroup} userId={profile?.id} />
      )}
    </div>
  )
}
