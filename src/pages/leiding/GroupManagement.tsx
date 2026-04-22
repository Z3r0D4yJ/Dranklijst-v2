import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, X, Trash, ArrowsClockwise, Copy, CheckCircle } from '@phosphor-icons/react'
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

  const { data: requests } = useJoinRequests(groupId)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    if (!profile) return

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, groups(name)')
      .eq('user_id', profile.id)

    const ownGroup = (memberships as unknown as Array<{ group_id: string; groups: { name: string } | null }>)
      ?.find((membership) => membership.groups?.name !== 'Leiding')

    if (!ownGroup) {
      setLoading(false)
      return
    }

    const nextGroupId = ownGroup.group_id
    setGroupName(ownGroup.groups?.name ?? '')
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

  async function resolveRequest(requestId: string, userId: string, approve: boolean) {
    setActionLoading(requestId)

    const { error } = await supabase.rpc('resolve_join_request', {
      p_request_id: requestId,
      p_approved: approve,
    })

    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ['join-requests', groupId] })

      if (approve) {
        const { data } = await supabase
          .from('group_members')
          .select('*, profiles(full_name, role, avatar_url)')
          .eq('group_id', groupId!)
          .order('joined_at')

        if (data) setMembers(data as unknown as MemberWithProfile[])
      }

      notifyJoinRequestResolved(userId, groupName, approve)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Spinner className="size-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg)' }}>
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 16px' }}>
        <h1 className="m-0 mb-0.5 text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: 'var(--color-text-primary)' }}>
          Groepsbeheer
        </h1>
        <p className="m-0 text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {groupName} - {members.length} leden
        </p>
      </div>

      <div className="flex flex-col gap-5 px-5 pb-8 pt-4">
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
          <SectionLabel count={(requests ?? []).length}>Aanvragen</SectionLabel>
          {(requests ?? []).length === 0 ? (
            <div className="rounded-[14px] px-4 py-[18px] text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="m-0 text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                Geen openstaande aanvragen
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {requests!.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 rounded-[14px] p-3.5"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <UserAvatar
                    avatarUrl={request.profiles?.avatar_url}
                    size={38}
                    bg="var(--color-primary-pale)"
                    border="1.5px solid var(--color-primary-border)"
                    iconColor="var(--color-primary)"
                  />
                  <div className="flex-1">
                    <p className="m-0 text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {request.profiles?.full_name ?? 'Onbekend'}
                    </p>
                    <p className="m-0 mt-0.5 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(request.created_at).toLocaleDateString('nl-BE')}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <IconActionButton
                      onClick={() => resolveRequest(request.id, request.user_id, false)}
                      disabled={actionLoading === request.id}
                      variant="danger-soft"
                      aria-label={`Weiger ${request.profiles?.full_name ?? 'aanvraag'}`}
                    >
                      <X size={16} color="currentColor" weight="bold" />
                    </IconActionButton>
                    <IconActionButton
                      onClick={() => resolveRequest(request.id, request.user_id, true)}
                      disabled={actionLoading === request.id}
                      variant="success-soft"
                      aria-label={`Keur ${request.profiles?.full_name ?? 'aanvraag'} goed`}
                    >
                      <Check size={16} color="currentColor" weight="bold" />
                    </IconActionButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionLabel count={members.length}>Leden</SectionLabel>
          {members.length === 0 ? (
            <div className="rounded-card px-4 py-6 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="m-0 text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                Nog geen leden in deze groep
              </p>
            </div>
          ) : (
            <div className="rounded-card overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {members.map((member, index) => {
                const isSelf = member.user_id === profile?.id

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-3.5 py-3"
                    style={{ borderTop: index === 0 ? 'none' : '1px solid var(--color-border)' }}
                  >
                    <UserAvatar
                      avatarUrl={member.profiles?.avatar_url}
                      size={38}
                      bg={isSelf ? 'var(--color-accent-bg)' : 'var(--color-surface-alt)'}
                      border={`1.5px solid ${isSelf ? 'var(--color-accent-border)' : 'var(--color-border)'}`}
                      iconColor={isSelf ? 'var(--color-accent)' : 'var(--color-text-secondary)'}
                    />
                    <div className="flex-1">
                      <p className="m-0 text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {member.profiles?.full_name ?? 'Onbekend'}
                        {isSelf && (
                          <span className="ml-1.5 text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                            (jij)
                          </span>
                        )}
                      </p>
                      <p className="m-0 mt-0.5 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                        {member.profiles?.role === 'leiding' ? 'Leiding' : 'Lid'}
                      </p>
                    </div>
                    {!isSelf && (
                      <IconActionButton
                        onClick={() => removeMember(member.id, member.user_id)}
                        disabled={actionLoading === member.id}
                        variant="danger-soft"
                        size="sm"
                        aria-label={`Verwijder ${member.profiles?.full_name ?? 'lid'}`}
                      >
                        <Trash size={14} color="currentColor" />
                      </IconActionButton>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
