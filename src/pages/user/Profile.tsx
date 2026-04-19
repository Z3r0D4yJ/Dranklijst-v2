import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { FC } from 'react'
import type { IconProps } from '@phosphor-icons/react'
import { SignOut, Users, Clock, CheckCircle, XCircle, Warning, Bell, BellSlash, DownloadSimple, Sun, Moon, Monitor, X, User, CaretRight, Gear, UsersThree, Receipt } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { usePushSubscription } from '../../hooks/usePushSubscription'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { useTheme, type ThemeMode } from '../../context/ThemeContext'
import { IconChip } from '../../components/IconChip'
import { useThemeColor } from '../../hooks/useThemeColor'

interface JoinRequestWithGroup {
  id: string
  status: string
  created_at: string
  groups: { name: string } | null
}

interface OpenPayment {
  id: string
  period_id: string
  amount_due: number
  amount_paid: number
  status: string
  period_name: string
}

const ROLE_LABELS: Record<string, string> = {
  lid: 'Lid', leiding: 'Leiding', groepsleiding: 'Groepsleiding', kas: 'Kas', admin: 'Admin',
}

const THEME_OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'light',  label: 'Licht',   Icon: Sun     },
  { value: 'dark',   label: 'Donker',  Icon: Moon    },
  { value: 'system', label: 'Auto',    Icon: Monitor },
]

function AccountRow({ icon, tone, label, sub, trailing, first, onClick }: {
  icon: FC<IconProps>
  tone?: string
  label: string
  sub?: string
  trailing?: React.ReactNode
  first?: boolean
  onClick?: () => void
}) {
  const inner = (
    <>
      <IconChip tone={(tone as never) ?? 'neutral'} icon={icon as never} size={36} />
      <div className="flex-1">
        <p className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        {sub && <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>}
      </div>
      {trailing ?? (onClick && <CaretRight size={16} color="var(--color-text-muted)" />)}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3.5 py-3.5 text-left active:opacity-70 transition-opacity"
        style={{ borderTop: first ? 'none' : '1px solid var(--color-border)' }}
      >
        {inner}
      </button>
    )
  }

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3.5"
      style={{ borderTop: first ? 'none' : '1px solid var(--color-border)' }}
    >
      {inner}
    </div>
  )
}

interface GroupMember {
  user_id: string
  full_name: string
  role: string
}

function GroupMembersSheet({ groupId, groupName, onClose }: { groupId: string; groupName: string; onClose: () => void }) {
  const { data: members, isLoading } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data } = await supabase
        .from('group_members')
        .select('user_id, profiles(full_name, role)')
        .eq('group_id', groupId)
      return ((data ?? []) as unknown as Array<{ user_id: string; profiles: { full_name: string; role: string } | null }>)
        .map(m => ({ user_id: m.user_id, full_name: m.profiles?.full_name ?? '?', role: m.profiles?.role ?? 'lid' })) as GroupMember[]
    },
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] pb-safe"
        style={{ background: 'var(--color-surface)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--color-border-mid)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="text-[17px] font-extrabold tracking-[-0.3px]" style={{ color: 'var(--color-text-primary)' }}>{groupName}</h2>
            {!isLoading && <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{members?.length ?? 0} leden</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-alt)' }}>
            <X size={16} color="var(--color-text-secondary)" weight="bold" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-1">
          {isLoading && [0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="dl-skel w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="dl-skel h-3 w-1/2 rounded" />
                <div className="dl-skel h-2.5 w-1/4 rounded" />
              </div>
            </div>
          ))}
          {!isLoading && (members ?? []).map(m => (
            <div key={m.user_id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-bg)', border: '1.5px solid var(--color-accent-border)' }}>
                <User size={16} color="var(--color-accent)" weight="bold" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{m.full_name}</p>
                <p className="text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{ROLE_LABELS[m.role] ?? m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function Profile() {
  useThemeColor('--color-bg')
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const push = usePushSubscription()
  const pwa = usePWAInstall()
  const { mode, setMode } = useTheme()
  const [joinRequests, setJoinRequests] = useState<JoinRequestWithGroup[]>([])
  const [myGroups, setMyGroups] = useState<{ id: string; name: string }[]>([])
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [groupSheetId, setGroupSheetId] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('join_requests').select('*, groups(name)').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('group_members').select('groups(id, name)').eq('user_id', profile.id),
    ]).then(([reqRes, memberRes]) => {
      if (reqRes.data) setJoinRequests(reqRes.data as unknown as JoinRequestWithGroup[])
      if (memberRes.data) {
        const groups = (memberRes.data as unknown as Array<{ groups: { id: string; name: string } | null }>)
          .map(m => m.groups).filter((g): g is { id: string; name: string } => !!g)
        setMyGroups(groups)
      }
    })
  }, [profile])

  const { data: openPayments } = useQuery({
    queryKey: ['open-payments', profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from('payments').select('*, periods(name)')
        .eq('user_id', profile!.id).neq('status', 'paid').order('period_id')
      return (data as unknown as Array<{
        id: string; period_id: string; amount_due: number; amount_paid: number
        status: string; periods: { name: string } | null
      }>).map(p => ({ ...p, period_name: p.periods?.name ?? 'Onbekende periode' })) as OpenPayment[]
    },
  })

  async function markAsPaid(paymentId: string) {
    setMarkingPaid(paymentId)
    await supabase.from('payments').update({ status: 'pending' }).eq('id', paymentId)
    queryClient.invalidateQueries({ queryKey: ['open-payments', profile?.id] })
    setMarkingPaid(null)
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true

  const userEmail = (profile as unknown as { email?: string })?.email ?? ''
  const myGroupName = myGroups[0]?.name ?? ''

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* ─── Header ──────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 16px' }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: 'var(--color-text-primary)' }}>Profiel</h1>
      </div>

      <div className="px-5 pt-4 pb-24 space-y-3.5">
        {/* ─── Identity card ──────────────────────── */}
        <div className="rounded-card p-[18px] flex items-center gap-3.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="w-[62px] h-[62px] rounded-full overflow-hidden shrink-0" style={{ background: 'var(--color-accent-bg)', border: '2px solid var(--color-accent-border)' }}>
            <img src="/fox.png" alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 18%' }} />
          </div>
          <div className="flex-1">
            <p className="text-[16px] font-extrabold tracking-[-0.3px]" style={{ color: 'var(--color-text-primary)' }}>{profile?.full_name}</p>
            {userEmail && <p className="text-[13px] font-medium mt-0.5 mb-2" style={{ color: 'var(--color-text-muted)' }}>{userEmail}</p>}
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] tracking-[0.2px]"
                style={{ background: 'var(--color-primary-pale)', color: 'var(--color-primary-on)', border: '1px solid var(--color-primary-border)' }}>
                {ROLE_LABELS[profile?.role ?? 'lid']}
              </span>
              {myGroupName && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] tracking-[0.2px]"
                  style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                  {myGroupName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── Open payments ──────────────────────── */}
        {(openPayments ?? []).length > 0 && (openPayments ?? []).map(payment => (
          <div key={payment.id} className="rounded-card p-4" style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <IconChip tone="warning" icon={Warning} size={32} />
              <h2 className="text-[14px] font-extrabold tracking-[-0.2px]" style={{ color: 'var(--color-text-primary)' }}>Nog te betalen</h2>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{payment.period_name}</p>
                <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {payment.status === 'pending' ? 'Wacht op bevestiging kas' : 'Nog te betalen'}
                </p>
              </div>
              <p className="text-[22px] font-extrabold tracking-[-0.5px] tabular-nums" style={{ color: 'var(--color-warning)' }}>
                € {payment.amount_due.toFixed(2).replace('.', ',')}
              </p>
            </div>
            {payment.status === 'unpaid' && (
              <button
                onClick={() => markAsPaid(payment.id)}
                disabled={markingPaid === payment.id}
                className="w-full py-3 rounded-[12px] text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                <CheckCircle size={16} weight="bold" />
                {markingPaid === payment.id ? 'Bezig…' : 'Ik heb betaald'}
              </button>
            )}
            {payment.status === 'pending' && (
              <div className="flex items-center gap-2 rounded-[10px] px-3 py-2" style={{ background: 'rgba(0,0,0,0.05)' }}>
                <Clock size={14} color="var(--color-warning)" />
                <p className="text-[12px] font-medium" style={{ color: 'var(--color-warning)' }}>Wacht op bevestiging van de kas</p>
              </div>
            )}
          </div>
        ))}

        {/* ─── Theme ──────────────────────────────── */}
        <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] ml-0.5 mt-1" style={{ color: 'var(--color-text-muted)' }}>Weergave</p>
        <div className="rounded-card p-3.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-3 gap-1.5 rounded-[12px] p-1" style={{ background: 'var(--color-surface-alt)' }}>
            {THEME_OPTIONS.map(opt => {
              const isActive = mode === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-[8px] text-[12px] font-bold transition-all active:scale-95"
                  style={{
                    background: isActive ? 'var(--color-surface)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  <opt.Icon size={15} weight="bold" color={isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Account rows ───────────────────────── */}
        <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] ml-0.5 mt-1" style={{ color: 'var(--color-text-muted)' }}>Account</p>
        <div className="rounded-card overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <AccountRow
            first
            icon={push.subscribed ? Bell : BellSlash}
            tone={push.subscribed ? 'success' : 'neutral'}
            label="Meldingen"
            sub={
              !push.supported
                ? isStandalone
                  ? 'Niet beschikbaar op dit toestel (iOS 16.4+ vereist)'
                  : 'Voeg de app toe aan het startscherm'
                : push.subscribed ? 'Ingeschakeld' : 'Uitgeschakeld'
            }
            trailing={
              push.supported ? (
                <button
                  onClick={push.subscribed ? push.disable : push.enable}
                  disabled={push.loading}
                  className="relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60"
                  style={{ background: push.subscribed ? 'var(--color-success)' : 'var(--color-border-mid)' }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                    style={{ transform: push.subscribed ? 'translateX(18px)' : 'translateX(2px)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                  />
                </button>
              ) : undefined
            }
          />
          {pwa.canInstall && (
            <AccountRow
              first={false}
              icon={DownloadSimple}
              label="Installeer app"
              sub="Voeg toe aan startscherm"
              trailing={
                <button onClick={pwa.install} className="text-[12px] font-bold px-3 py-1 rounded-[8px] active:scale-95 transition-transform" style={{ background: 'var(--color-primary-pale)', color: 'var(--color-primary)' }}>
                  Installen
                </button>
              }
            />
          )}
          {myGroups.length > 0 && (
            <AccountRow
              first={false}
              icon={Users}
              label="Mijn groep"
              sub={myGroups.map(g => g.name).join(', ')}
              onClick={() => setGroupSheetId(myGroups[0].id)}
            />
          )}
          {joinRequests.filter(r => r.status === 'pending').length > 0 && (
            <AccountRow
              icon={Clock}
              tone="warning"
              label="Aanvragen in behandeling"
              sub={joinRequests.filter(r => r.status === 'pending').map(r => r.groups?.name).join(', ')}
            />
          )}
          {joinRequests.filter(r => r.status === 'approved').length > 0 && (
            <AccountRow icon={CheckCircle} tone="success" label="Aanvraag goedgekeurd" />
          )}
          {joinRequests.filter(r => r.status === 'rejected').length > 0 && (
            <AccountRow icon={XCircle} tone="danger" label="Aanvraag afgewezen" />
          )}
        </div>

        {/* ─── Leiding / Beheer navigation ────────── */}
        {(profile?.role === 'leiding' || profile?.role === 'groepsleiding' || profile?.role === 'kas' || profile?.role === 'admin') && (
          <>
            <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] ml-0.5 mt-1" style={{ color: 'var(--color-text-muted)' }}>Beheer</p>
            <div className="rounded-card overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {(profile.role === 'leiding') && (
                <AccountRow
                  first
                  icon={UsersThree}
                  tone="primary"
                  label="Groepsbeheer"
                  sub="Aanvragen & leden"
                  onClick={() => navigate('/leiding/groep')}
                />
              )}
              {(profile.role === 'leiding') && (
                <AccountRow
                  icon={Receipt}
                  tone="primary"
                  label="Groepstransacties"
                  sub="Aankopen van jouw groep"
                  onClick={() => navigate('/leiding/transacties')}
                />
              )}
              {(profile.role === 'groepsleiding' || profile.role === 'kas' || profile.role === 'admin') && (
                <AccountRow
                  first
                  icon={Gear}
                  tone="primary"
                  label="Beheerpanel"
                  sub="Dashboard, transacties & meer"
                  onClick={() => navigate('/admin')}
                />
              )}
            </div>
          </>
        )}

        {/* ─── Sign out ───────────────────────────── */}
        <button
          onClick={signOut}
          className="w-full py-3.5 px-4 rounded-[14px] text-[14px] font-bold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}
        >
          <SignOut size={18} weight="bold" color="var(--color-danger)" />
          Uitloggen
        </button>
      </div>

      {/* ─── Group members sheet ────────────────── */}
      {groupSheetId && (
        <GroupMembersSheet
          groupId={groupSheetId}
          groupName={myGroups.find(g => g.id === groupSheetId)?.name ?? ''}
          onClose={() => setGroupSheetId(null)}
        />
      )}
    </div>
  )
}
