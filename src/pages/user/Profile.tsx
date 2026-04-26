import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { FC } from 'react'
import type { IconProps } from '@phosphor-icons/react'
import { SignOut, Users, Clock, CheckCircle, Warning, Bell, BellSlash, DownloadSimple, Sun, Moon, Monitor, XCircle, User, CaretRight, CloudSlash, Gear, UsersThree, Receipt, PencilSimple, Camera, Lock, Eye, EyeSlash, X } from '@phosphor-icons/react'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { Spinner } from '../../components/ui/spinner'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Switch } from '../../components/ui/switch'
import { Badge } from '../../components/ui/badge'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '../../components/ui/drawer'
import { ROLE_BADGE_VARIANT } from '../../lib/role-utils'
import type { Role } from '../../lib/database.types'
import { usePushSubscription } from '../../hooks/usePushSubscription'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { useTheme, type ThemeMode } from '../../context/ThemeContext'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { IconChip } from '../../components/IconChip'
import { useThemeColor } from '../../hooks/useThemeColor'
import { SURFACE_USER_AVATAR_STYLE, UserAvatar } from '../../components/UserAvatar'
import { ActionPillButton, IconActionButton } from '../../components/ui/action-button'
import { PageHeader } from '../../components/AdminThemePrimitives'
import { PaymentDrawer } from '../../components/PaymentDrawer'

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
  lid: 'Lid',
  leiding: 'Leiding',
  kas: 'Kas',
}

const THEME_OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'light',  label: 'Licht',   Icon: Sun     },
  { value: 'dark',   label: 'Donker',  Icon: Moon    },
  { value: 'system', label: 'Auto',    Icon: Monitor },
]

const PAYMENT_STATUS_UI: Record<'unpaid' | 'pending', {
  label: string
  badgeVariant: 'warning' | 'primary'
  chipTone: 'warning' | 'primary'
  icon: FC<IconProps>
  note: string
}> = {
  unpaid: {
    label: 'Openstaand',
    badgeVariant: 'warning',
    chipTone: 'warning',
    icon: Warning,
    note: 'Betaal eerst en markeer daarna hieronder dat het bedrag voldaan is.',
  },
  pending: {
    label: 'In afwachting',
    badgeVariant: 'primary',
    chipTone: 'primary',
    icon: Clock,
    note: 'De kas controleert je betaling. Je krijgt bevestiging zodra alles nagekeken is.',
  },
}

function AccountRow({ icon, tone, label, sub, trailing, first, onClick, disabled }: {
  icon: FC<IconProps>
  tone?: string
  label: string
  sub?: string
  trailing?: React.ReactNode
  first?: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  const computedTrailing = disabled
    ? <CloudSlash size={16} color="var(--color-text-muted)" weight="bold" />
    : trailing ?? (onClick && <CaretRight size={16} color="var(--color-text-muted)" />)

  const inner = (
    <>
      <IconChip tone={(tone as never) ?? 'neutral'} icon={icon as never} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold leading-tight truncate" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        {sub && <p className="text-[12px] font-medium mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>}
      </div>
      {computedTrailing}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center gap-3 px-3.5 py-3.5 text-left active:opacity-70 transition-opacity disabled:opacity-55 disabled:active:opacity-55 disabled:cursor-not-allowed"
        style={{ borderTop: first ? 'none' : '1px solid var(--color-border)' }}
      >
        {inner}
      </button>
    )
  }

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3.5"
      style={{
        borderTop: first ? 'none' : '1px solid var(--color-border)',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {inner}
    </div>
  )
}

interface GroupMember {
  user_id: string
  full_name: string
  role: string
  avatar_url: string | null
}

function GroupMembersSheet({ groupId, groupName, onClose }: { groupId: string; groupName: string; onClose: () => void }) {
  const { data: members, isLoading } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data } = await supabase
        .from('group_members')
        .select('user_id, profiles(full_name, role, avatar_url)')
        .eq('group_id', groupId)
      return ((data ?? []) as unknown as Array<{ user_id: string; profiles: { full_name: string; role: string; avatar_url: string | null } | null }>)
        .map(m => ({ user_id: m.user_id, full_name: m.profiles?.full_name ?? '?', role: m.profiles?.role ?? 'lid', avatar_url: m.profiles?.avatar_url ?? null })) as GroupMember[]
    },
  })

  return (
    <Drawer open onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DrawerContent
        className="rounded-t-[20px] px-0"
        style={{ background: 'var(--color-surface)', maxHeight: 'var(--drawer-max-height-compact)' }}
      >
        <DrawerHeader className="flex items-center justify-between border-b border-[var(--color-border)]">
          <div>
            <DrawerTitle style={{ color: 'var(--color-text-primary)' }}>{groupName}</DrawerTitle>
            {!isLoading && (
              <DrawerDescription style={{ color: 'var(--color-text-muted)' }}>
                {members?.length ?? 0} leden
              </DrawerDescription>
            )}
          </div>
          <DrawerClose asChild>
            <IconActionButton
              size="sm"
              variant="neutral"
              aria-label="Sluiten"
            >
              <X size={16} color="currentColor" weight="bold" />
            </IconActionButton>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {isLoading && [0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="dl-skel w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="dl-skel h-3 w-1/2 rounded" />
                <div className="dl-skel h-2.5 w-1/4 rounded" />
              </div>
            </div>
          ))}
          {!isLoading && (members ?? []).map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-3 py-2.5"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <UserAvatar avatarUrl={member.avatar_url} size={36} />
              <div className="flex-1">
                <p className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {member.full_name}
                </p>
                <p className="text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {ROLE_LABELS[member.role] ?? member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function EditProfileSheet({ onClose }: { onClose: () => void }) {
  const { profile, user, refreshProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile?.full_name ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  const [saving, setSaving] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!profile || !user) return
    setSaving(true)

    try {
      let avatarUrl = profile.avatar_url ?? null

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${user.id}/avatar.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (uploadErr) throw uploadErr
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = `${data.publicUrl}?t=${Date.now()}`
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: name.trim(), avatar_url: avatarUrl })
        .eq('id', profile.id)
      if (profileErr) throw profileErr

      if (newPw) {
        if (!currentPw) throw new Error('Vul je huidige wachtwoord in')
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: currentPw,
        })
        if (signInErr) throw new Error('Huidig wachtwoord klopt niet')
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPw })
        if (pwErr) throw pwErr
      }

      await refreshProfile()
      toast.success('Profiel opgeslagen.')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminFormDrawer
      open
      onOpenChange={(open) => { if (!open) onClose() }}
      title="Profiel bewerken"
      dismissible={!saving}
      disableClose={saving}
      repositionInputs={false}
      bodyClassName="space-y-5"
      footer={
        <ActionPillButton
          type="button"
          onClick={handleSave}
          disabled={saving}
          variant="accent"
          size="md"
          className="w-full"
        >
          {saving
            ? <Spinner className="size-[18px]" style={{ color: 'white' }} />
            : <Lock size={18} weight="bold" />}
          {saving ? 'Opslaan...' : 'Opslaan'}
        </ActionPillButton>
      }
    >
      <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative h-[88px] w-[88px] shrink-0 active:scale-95 transition-transform"
            >
              <div
                className="h-full w-full rounded-full overflow-hidden"
                style={{ background: 'var(--color-surface-alt)', border: '2.5px solid var(--color-border)' }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview ?? undefined} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User size={36} color="var(--color-text-secondary)" weight="bold" />
                  </div>
                )}
              </div>
              <span
                className="absolute bottom-0 right-0 inline-flex h-7 w-7 items-center justify-center rounded-full border font-bold text-white"
                style={{ background: 'var(--color-primary)', border: '2px solid var(--color-surface)' }}
                aria-hidden="true"
              >
                <Camera size={13} color="currentColor" weight="bold" />
              </span>
            </button>
            <p className="text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Tik op de foto om te wijzigen
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: 'var(--color-text-muted)' }}>
              Naam
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jouw naam"
              className="dl-input text-[15px] font-semibold"
              style={{
                borderWidth: 1,
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: 'var(--color-text-muted)' }}>
              Wachtwoord wijzigen
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(event) => setCurrentPw(event.target.value)}
                  placeholder="Huidig wachtwoord"
                  className="dl-input text-[15px] font-semibold"
                  style={{
                    borderWidth: 1,
                    paddingRight: 48,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showCurrentPw
                    ? <EyeSlash size={18} color="var(--color-text-muted)" />
                    : <Eye size={18} color="var(--color-text-muted)" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(event) => setNewPw(event.target.value)}
                  placeholder="Nieuw wachtwoord"
                  className="dl-input text-[15px] font-semibold"
                  style={{
                    borderWidth: 1,
                    paddingRight: 48,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showNewPw
                    ? <EyeSlash size={18} color="var(--color-text-muted)" />
                    : <Eye size={18} color="var(--color-text-muted)" />}
                </button>
              </div>
              <p className="px-1 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Laat leeg als je het wachtwoord niet wilt wijzigen
              </p>
            </div>
          </div>
    </AdminFormDrawer>
  )

}

export function Profile() {
  useThemeColor('--color-surface')
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const push = usePushSubscription()
  const pwa = usePWAInstall()
  const { mode, setMode } = useTheme()
  const online = useOnlineStatus()
  const [joinRequests, setJoinRequests] = useState<JoinRequestWithGroup[]>([])
  const [myGroups, setMyGroups] = useState<{ id: string; name: string }[]>([])
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [groupSheetId, setGroupSheetId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [paymentDrawerId, setPaymentDrawerId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try { return sessionStorage.getItem('payment-drawer-id') } catch { return null }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (paymentDrawerId) sessionStorage.setItem('payment-drawer-id', paymentDrawerId)
      else sessionStorage.removeItem('payment-drawer-id')
    } catch {
      // ignore
    }
  }, [paymentDrawerId])

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('join_requests').select('*, groups(name)').eq('user_id', profile.id).in('status', ['pending', 'rejected']).order('created_at', { ascending: false }),
      supabase.from('group_members').select('groups(id, name)').eq('user_id', profile.id),
    ]).then(([reqRes, memberRes]) => {
      if (reqRes.data) setJoinRequests(reqRes.data as unknown as JoinRequestWithGroup[])
      if (memberRes.data) {
        const groups = (memberRes.data as unknown as Array<{ groups: { id: string; name: string } | null }>)
          .map(m => m.groups).filter((g): g is { id: string; name: string } => !!g)
          .sort((a, b) => {
            if (a.name === 'Leiding') return 1
            if (b.name === 'Leiding') return -1
            return a.name.localeCompare(b.name)
          })
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

  async function markAsPaid(paymentId: string): Promise<boolean> {
    setMarkingPaid(paymentId)
    const { error } = await supabase.from('payments').update({ status: 'pending' }).eq('id', paymentId)
    await queryClient.invalidateQueries({ queryKey: ['open-payments', profile?.id] })
    setMarkingPaid(null)
    if (error) {
      toast.error('Er ging iets mis. Probeer opnieuw.')
      return false
    }
    toast.success('Betaling gemarkeerd. Wacht op bevestiging van de kas.')
    return true
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true

  const role = profile?.role as string | undefined
  const userEmail = (profile as unknown as { email?: string })?.email ?? ''
  const myGroupName = myGroups[0]?.name ?? ''
  const canManageOwnGroup = role === 'leiding' || role === 'kas'
  const canSeeManagement = role === 'leiding' || role === 'kas'
  const canOpenAdminPanel = role === 'kas'

  return (
    <div className="min-h-screen pb-nav-clearance" style={{ background: 'var(--color-bg)' }}>
      <PageHeader title="Profiel" />

      <div className="px-5 pt-4 space-y-3.5 pb-content-end-comfort">
        {/* ─── Identity card ──────────────────────── */}
        <div
          className="rounded-card p-4 flex items-center gap-3.5 dl-stagger-card"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', animationDelay: '0ms' }}
        >
          <div className="relative shrink-0">
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              size={54}
              {...SURFACE_USER_AVATAR_STYLE}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-extrabold tracking-[-0.3px] truncate" style={{ color: 'var(--color-text-primary)' }}>{profile?.full_name}</p>
            {userEmail && <p className="text-[13px] font-medium mt-0.5 mb-2 truncate" style={{ color: 'var(--color-text-muted)' }}>{userEmail}</p>}
            <div className="flex gap-1.5 flex-wrap">
              <Badge variant={ROLE_BADGE_VARIANT[(profile?.role ?? 'lid') as Role] ?? 'secondary'}>
                {ROLE_LABELS[profile?.role ?? 'lid']}
              </Badge>
              {myGroupName && (
                <Badge variant="secondary">
                  {myGroupName}
                </Badge>
              )}
            </div>
          </div>
          <IconActionButton
            onClick={() => setEditOpen(true)}
            disabled={!online}
            variant="primary-soft"
            className="shrink-0"
            aria-label={online ? 'Profiel bewerken' : 'Profiel bewerken (offline)'}
          >
            <PencilSimple size={16} color="currentColor" weight="bold" />
          </IconActionButton>
        </div>

        {/* ─── Open payments ──────────────────────── */}
        {(openPayments ?? []).length > 0 && (openPayments ?? []).map(payment => {
          const isPending = payment.status === 'pending'
          const statusUi = PAYMENT_STATUS_UI[isPending ? 'pending' : 'unpaid']

          return (
            <div
              key={payment.id}
              className="rounded-card p-4 dl-stagger-card"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', animationDelay: '60ms' }}
            >
              <div className="flex items-start gap-3">
                <IconChip tone={statusUi.chipTone} icon={statusUi.icon} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="m-0 text-[11px] font-extrabold uppercase tracking-[1.2px]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Openstaand bedrag
                      </p>
                      <p
                        className="mt-1 truncate text-[15px] font-bold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {payment.period_name}
                      </p>
                    </div>
                    <Badge variant={statusUi.badgeVariant}>
                      {statusUi.label}
                    </Badge>
                  </div>

                  <p
                    className="mt-3 text-[28px] font-extrabold tracking-[-0.7px] tabular-nums"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    € {payment.amount_due.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              <div
                className="mt-3 rounded-xl px-3.5 py-3"
                style={{
                  background: isPending ? 'var(--color-primary-pale)' : 'var(--color-warning-bg)',
                  border: `1px solid ${isPending ? 'var(--color-primary-border)' : 'var(--color-warning-border)'}`,
                }}
              >
                <p className="m-0 text-[12px] font-medium leading-[1.55]" style={{ color: 'var(--color-text-secondary)' }}>
                  {statusUi.note}
                </p>
              </div>

              <ActionPillButton
                onClick={() => setPaymentDrawerId(payment.id)}
                variant={isPending ? 'neutral' : 'accent'}
                size="md"
                className="mt-3 w-full"
              >
                <CheckCircle size={16} color="currentColor" weight="bold" />
                {isPending ? 'Bekijk betaalgegevens' : 'Hoe betalen'}
              </ActionPillButton>
            </div>
          )
        })}

{/* ─── Theme ──────────────────────────────── */}
        <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] ml-0.5 mt-1" style={{ color: 'var(--color-text-muted)' }}>Weergave</p>
        <div
          className="rounded-card p-3.5 dl-stagger-card"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', animationDelay: '120ms' }}
        >
          <div className="relative grid grid-cols-3 gap-1.5 rounded-xl p-1" style={{ background: 'var(--color-surface-alt)' }}>
            
            {/* ─── De Glijdende Achtergrond (Slider) ─── */}
            <div
              className="absolute top-1 bottom-1 rounded-lg transition-transform duration-300 ease-out z-0"
              style={{
                width: 'calc((100% - 8px - 12px) / 3)',
                transform: `translateX(calc(${THEME_OPTIONS.findIndex(o => o.value === mode)} * 100% + ${THEME_OPTIONS.findIndex(o => o.value === mode)} * 6px))`,
                left: '4px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-mid)',
              }}
            />

            {THEME_OPTIONS.map(opt => {
              const isActive = mode === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className="relative z-10 flex flex-col items-center gap-1 py-2.5 rounded-lg text-[12px] font-bold transition-all duration-300 active:scale-95"
                  style={{
                    background: 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    boxShadow: 'none',
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
        <div
          className="rounded-card overflow-hidden dl-stagger-card"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', animationDelay: '180ms' }}
        >
          <AccountRow
            first
            icon={push.subscribed ? Bell : BellSlash}
            tone={push.subscribed ? 'success' : 'neutral'}
            label="Meldingen"
            disabled={!online}
            sub={
              !push.supported
                ? isStandalone
                  ? 'Niet beschikbaar op dit toestel (iOS 16.4+ vereist)'
                  : 'Voeg de app toe aan het startscherm'
                : push.subscribed ? 'Ingeschakeld' : 'Uitgeschakeld'
            }
            trailing={
              push.supported ? (
                <Switch
                  checked={push.subscribed}
                  onCheckedChange={(checked) => checked ? push.enable() : push.disable()}
                  disabled={push.loading || !online}
                />
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
                <ActionPillButton onClick={pwa.install} variant="primary-soft">
                  Installen
                </ActionPillButton>
              }
            />
          )}
          {myGroups.length > 0 && (
            <AccountRow
              first={false}
              icon={Users}
              label="Mijn groep"
              sub={myGroups.map(g => g.name).join(', ')}
              disabled={!online}
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
          {joinRequests.filter(r => r.status === 'rejected').length > 0 && (
            <AccountRow
              icon={XCircle}
              tone="danger"
              label="Aanvraag afgewezen"
              sub={joinRequests.filter(r => r.status === 'rejected').map(r => r.groups?.name).join(', ')}
            />
          )}
        </div>

        {/* ─── Leiding / Beheer navigation ────────── */}
        {canSeeManagement && (
          <>
            <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] ml-0.5 mt-1" style={{ color: 'var(--color-text-muted)' }}>Beheer</p>
            <div
              className="rounded-card overflow-hidden dl-stagger-card"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', animationDelay: '240ms' }}
            >
              {canManageOwnGroup && (
                <AccountRow
                  first
                  icon={UsersThree}
                  tone="primary"
                  label="Groepsbeheer"
                  sub="Aanvragen & leden"
                  disabled={!online}
                  onClick={() => navigate('/leiding/groep')}
                />
              )}
              {canManageOwnGroup && (
                <AccountRow
                  icon={Receipt}
                  tone="primary"
                  label="Groepstransacties"
                  sub="Aankopen van jouw groep"
                  disabled={!online}
                  onClick={() => navigate('/leiding/transacties')}
                />
              )}
              {canOpenAdminPanel && (
                <AccountRow
                  first={!canManageOwnGroup}
                  icon={Gear}
                  tone="primary"
                  label="Beheerpanel"
                  sub="Dashboard, transacties & meer"
                  disabled={!online}
                  onClick={() => navigate('/admin')}
                />
              )}
            </div>
          </>
        )}

        {/* ─── Sign out ───────────────────────────── */}
        <ActionPillButton
          onClick={signOut}
          variant="neutral"
          size="md"
          className="w-full"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-danger)',
          }}
        >
          <SignOut size={16} weight="bold" color="currentColor" />
          Uitloggen
        </ActionPillButton>
      </div>

      {/* ─── Group members sheet ────────────────── */}
      {groupSheetId && (
        <GroupMembersSheet
          groupId={groupSheetId}
          groupName={myGroups.find(g => g.id === groupSheetId)?.name ?? ''}
          onClose={() => setGroupSheetId(null)}
        />
      )}

      {/* ─── Edit profile sheet ─────────────────── */}
      {editOpen && <EditProfileSheet onClose={() => setEditOpen(false)} />}

      {/* ─── Payment drawer ─────────────────────── */}
      {paymentDrawerId && (() => {
        const payment = (openPayments ?? []).find(p => p.id === paymentDrawerId)
        if (!payment) return null
        const status = (payment.status === 'pending' ? 'pending' : 'unpaid') as 'pending' | 'unpaid'
        return (
          <PaymentDrawer
            paymentId={payment.id}
            amountDue={payment.amount_due}
            periodName={payment.period_name}
            status={status}
            isMarkingPaid={markingPaid === payment.id}
            onMarkAsPaid={async () => {
              const ok = await markAsPaid(payment.id)
              if (ok) setPaymentDrawerId(null)
            }}
            onClose={() => setPaymentDrawerId(null)}
          />
        )
      })()}
    </div>
  )
}
