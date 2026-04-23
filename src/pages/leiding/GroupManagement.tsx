import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowsClockwise, CaretRight, Check, CheckCircle, Copy, CurrencyEur, Trash, Users, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Spinner } from '../../components/ui/spinner'
import { UserAvatar } from '../../components/UserAvatar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { notifyJoinRequestResolved } from '../../lib/notifications'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useJoinRequests } from '../../hooks/useJoinRequests'
import { Badge } from '../../components/ui/badge'
import { ActionPillButton, IconActionButton } from '../../components/ui/action-button'
import { CustomSelect } from '../../components/CustomSelect'
import { AdminEmptyState, AdminSectionLabel, AdminStatTile, AdminSurface, PageHeader } from '../../components/AdminThemePrimitives'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { IconChip } from '../../components/IconChip'
import { ROLE_BADGE_VARIANT } from '../../lib/role-utils'
import { formatMoney } from '../../lib/formatters'
import type { Period, Role } from '../../lib/database.types'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

interface InviteCode {
  id: string
  code: string
}

interface MemberWithProfile {
  id: string
  user_id: string
  joined_at: string
  profiles: { full_name: string; role: string; avatar_url: string | null } | null
}

const ROLE_LABELS: Record<string, string> = {
  lid: 'Lid',
  leiding: 'Leiding',
  kas: 'Kas',
}

function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <p className="m-0 text-[11px] font-extrabold uppercase tracking-[1.2px]" style={{ color: 'var(--color-text-muted)' }}>
        {children}
      </p>
      {count != null && (
        <Badge
          variant={count > 0 ? 'default' : 'secondary'}
          className="min-w-6"
        >
          {count}
        </Badge>
      )}
    </div>
  )
}

function normalizeRole(role: string | null | undefined): Role {
  if (role === 'lid' || role === 'leiding' || role === 'kas') return role
  return 'lid'
}

export function GroupManagement() {
  useThemeColor('--color-surface')
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [groupName, setGroupName] = useState<string>('')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [codeLoading, setCodeLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false)
  const [requestsDrawerOpen, setRequestsDrawerOpen] = useState(false)

  const { data: requests, error: requestsError } = useJoinRequests(groupId)

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data } = await supabase.from('periods').select('*').order('started_at', { ascending: false })
      return (data ?? []) as Period[]
    },
  })

  const { data: memberTotals } = useQuery({
    queryKey: ['leiding-member-turnover', groupId, members.map((member) => member.user_id).join(','), selectedPeriod],
    enabled: !!groupId && members.length > 0,
    queryFn: async () => {
      const memberIds = members.map((member) => member.user_id)
      let query = supabase
        .from('transactions')
        .select('user_id, total_price')
        .in('user_id', memberIds)

      if (selectedPeriod) query = query.eq('period_id', selectedPeriod)

      const { data } = await query
      const totals: Record<string, number> = {}

      for (const tx of (data ?? []) as Array<{ user_id: string; total_price: number }>) {
        totals[tx.user_id] = (totals[tx.user_id] ?? 0) + tx.total_price
      }

      return totals
    },
  })

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    if (!profile) return

    let nextGroupId: string | null = null
    let nextGroupName = ''

    const { data: managedGroupId } = await supabase.rpc('get_my_leiding_group')

    if (typeof managedGroupId === 'string') {
      const { data: managedGroup } = await supabase
        .from('groups')
        .select('id, name')
        .eq('id', managedGroupId)
        .maybeSingle()

      if (managedGroup) {
        nextGroupId = managedGroup.id
        nextGroupName = managedGroup.name
      }
    }

    if (!nextGroupId) {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, groups(name)')
        .eq('user_id', profile.id)

      const ownGroup = (memberships as unknown as Array<{ group_id: string; groups: { name: string } | null }>)
        ?.find((membership) => membership.groups?.name !== 'Leiding')

      if (ownGroup) {
        nextGroupId = ownGroup.group_id
        nextGroupName = ownGroup.groups?.name ?? ''
      }
    }

    if (!nextGroupId) {
      setLoading(false)
      return
    }

    setGroupName(nextGroupName)
    setGroupId(nextGroupId)

    const [membersRes, inviteRes] = await Promise.all([
      supabase
        .from('group_members')
        .select('*, profiles(full_name, role, avatar_url)')
        .eq('group_id', nextGroupId)
        .order('joined_at'),
      supabase
        .from('invite_codes')
        .select('id, code')
        .eq('group_id', nextGroupId)
        .maybeSingle(),
    ])

    if (membersRes.data) setMembers(membersRes.data as unknown as MemberWithProfile[])
    if (inviteRes.data) setInviteCode(inviteRes.data as InviteCode)
    setLoading(false)
  }

  async function resolveRequest(requestId: string, userId: string, approve: boolean, requestGroupName: string) {
    setActionLoading(requestId)

    const { error } = await supabase.rpc('resolve_join_request', {
      p_request_id: requestId,
      p_approved: approve,
    })

    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ['join-requests'] })

      if (approve) {
        const { data } = await supabase
          .from('group_members')
          .select('*, profiles(full_name, role, avatar_url)')
          .eq('group_id', groupId!)
          .order('joined_at')

        if (data) setMembers(data as unknown as MemberWithProfile[])
      }

      try {
        await notifyJoinRequestResolved(userId, requestGroupName, approve)
      } catch {
        toast.warning('Aanvraag verwerkt, maar de melding kon niet verstuurd worden.')
      }
    } else {
      toast.error(error.message)
    }

    setActionLoading(null)
  }

  async function removeMember(memberId: string, memberUserId: string) {
    if (memberUserId === profile?.id) return

    setActionLoading(memberId)
    await supabase.from('group_members').delete().eq('id', memberId)
    await loadData()
    setActionLoading(null)
  }

  async function handleGenerateCode() {
    if (!groupId || !profile) return

    setCodeLoading(true)
    const code = generateCode()
    const { data } = await supabase
      .from('invite_codes')
      .upsert({ group_id: groupId, code, created_by: profile.id }, { onConflict: 'group_id' })
      .select('id, code')
      .single()

    if (data) setInviteCode(data as InviteCode)
    setCodeLoading(false)
  }

  function inviteLink() {
    return `${window.location.origin}/join/${inviteCode?.code ?? ''}`
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link gekopieerd!')
  }

  const memberRows = members
    .map((member) => ({
      ...member,
      total: memberTotals?.[member.user_id] ?? 0,
      role: normalizeRole(member.profiles?.role),
      fullName: member.profiles?.full_name ?? 'Onbekend',
      avatarUrl: member.profiles?.avatar_url ?? null,
    }))
    .sort((a, b) => b.total - a.total || a.fullName.localeCompare(b.fullName))

  const totalTurnover = memberRows.reduce((sum, member) => sum + member.total, 0)
  const requestCount = requests?.length ?? 0

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Spinner className="size-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-nav-clearance" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Groepsbeheer"
        sub={groupName ? `${groupName} · ${members.length} ${members.length === 1 ? 'lid' : 'leden'}` : undefined}
      />

      <div className="flex flex-col gap-5 px-5 pt-4 pb-content-end-comfort">
        <section>
          <SectionLabel>Periode</SectionLabel>
          <CustomSelect
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={(periods ?? []).map((period) => ({
              value: period.id,
              label: period.name,
              statusDot: period.is_active ? 'success' : undefined,
            }))}
            placeholder="Alle periodes"
            style={{ minWidth: 0 }}
          />
        </section>

        <section>
          <SectionLabel>Uitnodigingslink</SectionLabel>
          <div className="rounded-card p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            {inviteCode ? (
              <>
                <div className="mb-3.5 flex items-center justify-between">
                  <div>
                    <p className="m-0 mb-1 text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: 'var(--color-text-muted)' }}>
                      Code
                    </p>
                    <p className="m-0 text-[26px] font-extrabold tracking-[0.28em] tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                      {inviteCode.code}
                    </p>
                  </div>
                  <IconActionButton
                    onClick={handleGenerateCode}
                    disabled={codeLoading}
                    variant="neutral"
                    title="Nieuwe code genereren"
                    aria-label="Nieuwe code genereren"
                  >
                    <ArrowsClockwise size={15} color="currentColor" className={codeLoading ? 'animate-spin' : ''} />
                  </IconActionButton>
                </div>

                <ActionPillButton
                  onClick={copyLink}
                  variant={copied ? 'success-soft' : 'primary-soft'}
                  size="md"
                  className="w-full"
                >
                  {copied ? <CheckCircle size={14} color="currentColor" weight="fill" /> : <Copy size={14} color="currentColor" />}
                  {copied ? 'Link gekopieerd!' : 'Kopieer uitnodigingslink'}
                </ActionPillButton>
              </>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                  Nog geen uitnodigingscode aangemaakt
                </p>
                <ActionPillButton
                  onClick={handleGenerateCode}
                  disabled={codeLoading}
                  variant="primary-soft"
                  size="md"
                >
                  {codeLoading ? 'Bezig...' : 'Code aanmaken'}
                </ActionPillButton>
              </div>
            )}
          </div>
        </section>

        <section>
          <SectionLabel>Aanvragen</SectionLabel>
          <button
            type="button"
            onClick={() => setRequestsDrawerOpen(true)}
            className="w-full rounded-card px-4 py-3.5 text-left active:opacity-70 transition-opacity"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              fontFamily: 'inherit',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <IconChip tone={requestsError ? 'danger' : requestCount > 0 ? 'warning' : 'neutral'} icon={Users} size={36} />
                <div className="min-w-0">
                  <p className="m-0 truncate text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Openstaande aanvragen
                  </p>
                  <p className="m-0 mt-0.5 truncate text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {requestsError
                      ? 'Kon niet geladen worden'
                      : requestCount === 0
                        ? 'Geen aanvragen om te behandelen'
                        : `${requestCount} ${requestCount === 1 ? 'aanvraag' : 'aanvragen'} · tik om te behandelen`}
                  </p>
                </div>
              </div>

              <CaretRight size={14} color="var(--color-text-muted)" className="shrink-0" />
            </div>
          </button>
        </section>

        <section>
          <SectionLabel>Leden</SectionLabel>
          {members.length === 0 ? (
            <div className="rounded-card px-4 py-6 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="m-0 text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                Nog geen leden in deze groep
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMembersDrawerOpen(true)}
              className="w-full rounded-card px-4 py-3.5 text-left active:opacity-70 transition-opacity"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                fontFamily: 'inherit',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <IconChip tone="primary" icon={Users} size={36} />
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {groupName}
                    </p>
                    <p className="m-0 mt-0.5 truncate text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {members.length} {members.length === 1 ? 'lid' : 'leden'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[16px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                    {formatMoney(totalTurnover)}
                  </span>
                  <CaretRight size={14} color="var(--color-text-muted)" />
                </div>
              </div>
            </button>
          )}
        </section>
      </div>

      <AdminFormDrawer
        open={requestsDrawerOpen}
        onOpenChange={setRequestsDrawerOpen}
        title="Aanvragen"
        description={groupName ? `Nieuwe leden voor ${groupName}` : undefined}
        bodyClassName="space-y-3"
        contentClassName="max-w-md"
        maxHeight="var(--drawer-max-height-compact)"
      >
        {requestsError ? (
          <div
            className="rounded-card px-4 py-6 text-center"
            style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)' }}
          >
            <p className="m-0 text-[13px] font-semibold" style={{ color: 'var(--color-danger)' }}>
              Aanvragen konden niet geladen worden
            </p>
          </div>
        ) : requestCount === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="Geen openstaande aanvragen"
            description="Nieuwe aanvragen verschijnen hier zodra iemand je groep wil joinen."
            tone="neutral"
          />
        ) : (
          <section className="space-y-2">
            <AdminSectionLabel>Te behandelen</AdminSectionLabel>
            <AdminSurface>
              {requests!.map((request, index) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 px-3.5 py-3.5"
                  style={{ borderTop: index > 0 ? '1px solid var(--color-border)' : undefined }}
                >
                  <UserAvatar
                    avatarUrl={request.profiles?.avatar_url}
                    size={38}
                    bg="var(--color-primary-pale)"
                    border="none"
                    iconColor="var(--color-primary)"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {request.profiles?.full_name ?? 'Onbekend'}
                    </p>
                    <p className="m-0 mt-0.5 truncate text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(request.created_at).toLocaleDateString('nl-BE')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <IconActionButton
                      onClick={() => resolveRequest(request.id, request.user_id, false, request.groups?.name ?? groupName)}
                      disabled={actionLoading === request.id}
                      variant="danger-soft"
                      aria-label={`Weiger ${request.profiles?.full_name ?? 'aanvraag'}`}
                    >
                      <X size={16} color="currentColor" weight="bold" />
                    </IconActionButton>
                    <IconActionButton
                      onClick={() => resolveRequest(request.id, request.user_id, true, request.groups?.name ?? groupName)}
                      disabled={actionLoading === request.id}
                      variant="success-soft"
                      aria-label={`Keur ${request.profiles?.full_name ?? 'aanvraag'} goed`}
                    >
                      <Check size={16} color="currentColor" weight="bold" />
                    </IconActionButton>
                  </div>
                </div>
              ))}
            </AdminSurface>
          </section>
        )}
      </AdminFormDrawer>

      <AdminFormDrawer
        open={membersDrawerOpen}
        onOpenChange={setMembersDrawerOpen}
        title={groupName || 'Groep'}
        bodyClassName="space-y-3"
        contentClassName="max-w-md"
        maxHeight="var(--drawer-max-height-compact)"
      >
        <section className="space-y-2">
          <AdminSectionLabel>Overzicht</AdminSectionLabel>
          <div className="grid grid-cols-2 gap-2.5">
            <AdminStatTile
              label="Leden"
              value={String(memberRows.length)}
              icon={Users}
              tone="primary"
            />
            <AdminStatTile
              label="Omzet"
              value={formatMoney(totalTurnover)}
              icon={CurrencyEur}
              tone="primary"
              valueTone="primary"
            />
          </div>
        </section>

        {memberRows.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="Nog geen leden"
            description="Leden van deze groep verschijnen hier zodra ze gekoppeld zijn."
          />
        ) : (
          <section className="space-y-2">
            <AdminSectionLabel>Leden</AdminSectionLabel>
            <AdminSurface>
              {memberRows.map((member, index) => {
                const isSelf = member.user_id === profile?.id

                return (
                  <div
                    key={`${member.user_id}-${index}`}
                    className="flex items-center gap-3 px-3.5 py-3.5"
                    style={{ borderTop: index > 0 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <UserAvatar
                      avatarUrl={member.avatarUrl}
                      size={36}
                      bg="var(--color-primary-pale)"
                      border="none"
                      iconColor="var(--color-primary)"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {member.fullName}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={ROLE_BADGE_VARIANT[member.role]} size="sm">
                          {ROLE_LABELS[member.role] ?? 'Lid'}
                        </Badge>
                      </div>
                    </div>
                    <span className="shrink-0 text-[15px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                      {formatMoney(member.total)}
                    </span>
                    {!isSelf && (
                      <IconActionButton
                        onClick={() => removeMember(member.id, member.user_id)}
                        disabled={actionLoading === member.id}
                        variant="danger-soft"
                        size="sm"
                        aria-label={`Verwijder ${member.fullName}`}
                      >
                        <Trash size={14} color="currentColor" />
                      </IconActionButton>
                    )}
                  </div>
                )
              })}
            </AdminSurface>
          </section>
        )}
      </AdminFormDrawer>
    </div>
  )
}
