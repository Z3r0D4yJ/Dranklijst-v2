import { useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bell, CalendarBlank, CurrencyEur, Users } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useMyGroup } from '../../hooks/useMyGroup'
import { useGroupConsumptions, type GroupConsumptionItem } from '../../hooks/useGroupConsumptions'
import { useActivePeriod } from '../../hooks/useActivePeriod'
import { useTransactions } from '../../hooks/useTransactions'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useCountUp } from '../../hooks/useCountUp'
import { useThemeColor } from '../../hooks/useThemeColor'
import { usePushSubscription } from '../../hooks/usePushSubscription'
import { useNotifications } from '../../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { BuyModal } from '../../components/BuyModal'
import { NotificationsSheet } from '../../components/NotificationsSheet'
import { HEADER_USER_AVATAR_STYLE, UserAvatar } from '../../components/UserAvatar'
import { IconChip } from '../../components/IconChip'
import type { IconChipTone } from '../../components/IconChip'
import { Badge } from '../../components/ui/badge'
import { ActionPillButton } from '../../components/ui/action-button'
import { EmptyState } from '../../components/AdminThemePrimitives'

const ROLE_LABELS: Record<string, string> = {
  lid: 'Lid',
  leiding: 'Leiding',
  kas: 'Kas',
}

const CATEGORY_ORDER = ['niet-alcoholisch', 'alcoholisch'] as const
const CATEGORY_LABELS: Record<string, string> = {
  'niet-alcoholisch': 'Frisdrank',
  'alcoholisch':      'Alcohol',
}

interface Bubble { id: string; x: number; y: number }

export function Home() {
  useThemeColor('--color-header')
  const navigate = useNavigate()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  usePushSubscription()
  const { unreadCount } = useNotifications()
  const [showNotifs, setShowNotifs] = useState(false)
  const { data: group, isLoading: groupLoading } = useMyGroup()
  const { data: consumptions, isLoading: consLoading } = useGroupConsumptions(group?.id)
  const { data: period } = useActivePeriod()
  const { data: txs } = useTransactions(period?.id)
  const { data: lbGroups } = useLeaderboard(period?.id)

  const [selected, setSelected] = useState<GroupConsumptionItem | null>(null)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const totalSpend = (txs ?? []).reduce((s, t) => s + Number(t.total_price), 0)
  const animatedSpend = useCountUp(totalSpend, 550)

  const myEntry = lbGroups?.flatMap(g => g.entries).find(e => e.user_id === profile?.id)
  const myRank = myEntry?.rank ?? null

  function handleBuy(item: GroupConsumptionItem, ev: React.MouseEvent) {
    const containerEl = containerRef.current
    if (!containerEl) { setSelected(item); return }
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
    const parentRect = containerEl.getBoundingClientRect()
    const x = rect.left - parentRect.left + rect.width / 2
    const y = rect.top  - parentRect.top  + 22
    const id = Math.random().toString(36).slice(2)
    setBubbles(b => [...b, { id, x, y }])
    setTimeout(() => setBubbles(b => b.filter(bub => bub.id !== id)), 750)
    setSelected(item)
  }

  const handleSuccess = useCallback(() => {
    const name = selected!.name
    setSelected(null)
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    queryClient.invalidateQueries({ queryKey: ['my-groups'] })
    toast.success(`${name} gekocht`)
  }, [selected, queryClient])

  const grouped = CATEGORY_ORDER.reduce<Record<string, GroupConsumptionItem[]>>((acc, cat) => {
    const items = (consumptions ?? []).filter(c => c.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  const isLoading = groupLoading || consLoading
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div ref={containerRef} className="min-h-screen pb-nav-fab-clearance relative" style={{ background: 'var(--color-bg)' }}>
      {/* ─── Header ─────────────────────────────── */}
      <div style={{ background: 'var(--color-header)', padding: '14px 20px 32px', color: 'var(--color-header-fg)', position: 'relative', overflow: 'hidden' }}>
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'var(--auth-header-pattern-image)',
            backgroundRepeat: 'repeat',
            backgroundSize: '100px 100px',
            backgroundPosition: '0 calc(-1 * var(--safe-area-top))',
            opacity: 'var(--auth-header-pattern-opacity)',
          }}
        />
        <div className="flex justify-between items-center mb-[18px]">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="shrink-0 rounded-full active:scale-95 transition-transform"
              aria-label="Ga naar profiel"
            >
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                size={54}
                {...HEADER_USER_AVATAR_STYLE}
              />
            </button>
            <div>
              <p className="text-[13px] font-medium opacity-70 leading-none">Hoi {firstName}</p>
              <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.4px] mt-0.5">Dorst?</h1>
            </div>
          </div>
          <button
            onClick={() => setShowNotifs(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center relative active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <Bell size={20} color="var(--color-header-fg)" />
            {unreadCount > 0 && (
              <span
                className="absolute top-[7px] right-[8px] min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-extrabold"
                style={{ background: 'var(--color-accent)', color: 'var(--color-white)', border: '1.5px solid var(--color-header)', padding: '0 3px' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {profile && (
          <div className="flex gap-2 items-center flex-wrap">
            <Badge variant="glass" className="gap-1.5 px-3">
              {ROLE_LABELS[profile.role]}
            </Badge>
            {period && (
              <Badge variant="glass" className="gap-1.5 px-3">
                {period.is_active && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 dl-pulse-dot" style={{ background: 'var(--color-success)' }} />
                )}
                {period.name}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ─── Balance card ───────────────────────── */}
      {group && period && (
        <div className="mx-5 relative z-10" style={{ marginTop: -22 }}>
          <div
            className="rounded-card border p-4 flex items-center gap-3.5 dl-stagger-card"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', animationDelay: '40ms' }}
          >
            <IconChip tone="primary" icon={CurrencyEur} size={44} />
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.8px] leading-none" style={{ color: 'var(--color-text-muted)' }}>Deze periode</p>
              <p className="text-[22px] font-extrabold tracking-[-0.5px] mt-1 tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                € {animatedSpend.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.8px] leading-none" style={{ color: 'var(--color-text-muted)' }}>Rang</p>
              <p className="text-[22px] font-extrabold tracking-[-0.5px] mt-1" style={{ color: 'var(--color-primary)' }}>
                {myRank ? `#${myRank}` : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Empty / no-group states ─────────────── */}
      {!groupLoading && !group && (
        <div className="px-5 mt-6">
          <EmptyState
            icon={Users}
            title="Nog geen groep"
            description="Dien een join-aanvraag in bij je groep om consumpties te kunnen kopen."
            action={
              <ActionPillButton onClick={() => navigate('/join-group')} variant="accent" size="md">
                <Users size={16} weight="bold" />
                Groep joinen
              </ActionPillButton>
            }
          />
        </div>
      )}

      {!isLoading && group && !period && (
        <div className="px-5 mt-6">
          <EmptyState
            icon={CalendarBlank}
            title="Geen actieve periode"
            description="Er is momenteel geen actieve periode. Neem contact op met de kas."
          />
        </div>
      )}

      {/* ─── Skeleton ───────────────────────────── */}
      {isLoading && (
        <div className="px-5 pt-[22px] space-y-5" style={{ '--skel-base': 'var(--color-surface-alt)', '--skel-hl': 'var(--color-border)' } as React.CSSProperties}>
          {[6, 2].map((count, sectionIndex) => (
            <section key={sectionIndex}>
              <div className="flex items-baseline justify-between mb-3 px-0.5">
                <div className="dl-skel h-3 w-24 rounded" />
                <div className="dl-skel h-3 w-12 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-[10px]">
                {Array.from({ length: count }).map((_, i) => (
                  <div key={i} className="rounded-card p-3.5 space-y-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="dl-skel w-[38px] h-[38px] rounded-chip" />
                    <div className="space-y-2">
                      <div className="dl-skel h-3 w-3/5 rounded" />
                      <div className="dl-skel h-4 w-2/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ─── Consumption grid ───────────────────── */}
      {!isLoading && group && period && (
        <div className="px-5 pt-[22px] space-y-5">
          {(() => {
            let globalTileIndex = 0
            return Object.entries(grouped).map(([category, items], sectionIndex) => (
              <section key={category}>
                <div
                  className="flex items-baseline justify-between mb-3 px-0.5 dl-stagger-card"
                  style={{ animationDelay: `${120 + sectionIndex * 60}ms` }}
                >
                  <h2 className="text-[11px] font-extrabold uppercase tracking-[1.2px]" style={{ color: 'var(--color-text-muted)' }}>
                    {CATEGORY_LABELS[category] ?? category}
                  </h2>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>{items.length} items</span>
                </div>
                <div className="grid grid-cols-2 gap-[10px]">
                  {items.map(item => {
                    const tileIndex = globalTileIndex++
                    return (
                      <button
                        key={item.id}
                        onClick={e => handleBuy(item, e)}
                        className="rounded-card p-3.5 text-left active:scale-[0.96] flex flex-col gap-3 dl-stagger-tile"
                        style={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          transitionProperty: 'transform',
                          transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
                          transitionDuration: '180ms',
                          animationDelay: `${180 + tileIndex * 45}ms`,
                        }}
                      >
                        <IconChip tone={item.category as IconChipTone} colorName={item.color ?? undefined} iconName={item.icon ?? undefined} size={38} />
                        <div>
                          <p className="text-[14px] font-bold tracking-[-0.1px] leading-tight" style={{ color: 'var(--color-text-primary)' }}>{item.name}</p>
                          <p className="text-[17px] font-extrabold tracking-[-0.3px] mt-0.5 tabular-nums" style={{ color: 'var(--color-primary)' }}>
                            € {item.price.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))
          })()}

          {Object.keys(grouped).length === 0 && (
            <div className="text-center mt-8">
              <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Geen consumpties beschikbaar voor jouw groep.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Bubble bursts ──────────────────────── */}
      {bubbles.map(b => (
        <BubbleBurst key={b.id} x={b.x} y={b.y} />
      ))}

      {/* ─── Buy modal ──────────────────────────── */}
      {selected && period && group && (
        <BuyModal
          item={selected}
          periodId={period.id}
          groupId={group.id}
          onClose={() => setSelected(null)}
          onSuccess={handleSuccess}
        />
      )}

      {showNotifs && <NotificationsSheet onClose={() => setShowNotifs(false)} />}
    </div>
  )
}

function BubbleBurst({ x, y }: { x: number; y: number }) {
  const dots = [
    { dx: -14, size: 5,  delay: 0   },
    { dx:  10, size: 7,  delay: 40  },
    { dx:   2, size: 4,  delay: 90  },
    { dx: -22, size: 6,  delay: 130 },
    { dx:  18, size: 5,  delay: 170 },
  ]
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 20, pointerEvents: 'none' }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: -d.size / 2,
            top: -d.size / 2,
            width: d.size,
            height: d.size,
            borderRadius: d.size / 2,
            background: 'var(--color-accent)',
            opacity: 0,
            ['--dx' as string]: `${d.dx}px`,
            animation: `dl-bubble-up 640ms cubic-bezier(0.22, 0.61, 0.36, 1) ${d.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  )
}

