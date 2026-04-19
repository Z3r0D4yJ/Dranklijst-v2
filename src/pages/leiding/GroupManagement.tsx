import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, X, Trash, ArrowsClockwise, Copy, CheckCircle, User } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { notifyJoinRequestResolved } from '../../lib/notifications'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useJoinRequests } from '../../hooks/useJoinRequests'

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
  profiles: { full_name: string; role: string } | null
}

function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] m-0" style={{ color: 'var(--color-text-muted)' }}>{children}</p>
      {count != null && (
        <span
          className="text-[11px] font-extrabold rounded-full leading-4"
          style={{
            color: count > 0 ? '#fff' : 'var(--color-text-muted)',
            background: count > 0 ? 'var(--color-primary)' : 'var(--color-surface-alt)',
            padding: '1px 6px',
          }}
        >
          {count}
        </span>
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
    loadData()
  }, [])

  async function loadData() {
    if (!profile) return

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, groups(name)')
      .eq('user_id', profile.id)

    const ownGroup = (memberships as unknown as Array<{ group_id: string; groups: { name: string } | null }>)
      ?.find(m => m.groups?.name !== 'Leiding')

    if (!ownGroup) {
      setLoading(false)
      return
    }

    const gId = ownGroup.group_id
    setGroupName(ownGroup.groups?.name ?? '')
    setGroupId(gId)

    const [membersRes, inviteRes] = await Promise.all([
      supabase
        .from('group_members')
        .select('*, profiles(full_name, role)')
        .eq('group_id', gId)
        .order('joined_at'),
      supabase
        .from('invite_codes')
        .select('id, code')
        .eq('group_id', gId)
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
          .select('*, profiles(full_name, role)')
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
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg)' }}>
      {/* ─── Header ──────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 16px' }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] m-0 mb-0.5" style={{ color: 'var(--color-text-primary)' }}>Groepsbeheer</h1>
        <p className="text-[12px] font-medium m-0" style={{ color: 'var(--color-text-muted)' }}>{groupName} · {members.length} leden</p>
      </div>

      <div className="px-5 pt-4 pb-8 flex flex-col gap-5">

        {/* ─── Uitnodigingslink ─────────────────────── */}
        <section>
          <SectionLabel>Uitnodigingslink</SectionLabel>
          <div className="rounded-card p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            {inviteCode ? (
              <>
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[1px] m-0 mb-1" style={{ color: 'var(--color-text-muted)' }}>Code</p>
                    <p className="text-[26px] font-extrabold tracking-[0.28em] m-0 tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{inviteCode.code}</p>
                  </div>
                  <button
                    onClick={handleGenerateCode}
                    disabled={codeLoading}
                    className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                    style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
                    title="Nieuwe code genereren"
                  >
                    <ArrowsClockwise size={15} color="var(--color-text-muted)" className={codeLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
                <button
                  onClick={copyLink}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-bold active:scale-[0.98] transition-all"
                  style={{
                    background: copied ? 'var(--color-success-bg)' : 'var(--color-primary-pale)',
                    color: copied ? 'var(--color-success)' : 'var(--color-primary)',
                    border: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  {copied ? <CheckCircle size={14} weight="fill" /> : <Copy size={14} />}
                  {copied ? 'Link gekopieerd!' : 'Kopieer uitnodigingslink'}
                </button>
              </>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Nog geen uitnodigingscode aangemaakt</p>
                <button
                  onClick={handleGenerateCode}
                  disabled={codeLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', fontFamily: 'inherit' }}
                >
                  {codeLoading ? 'Bezig…' : 'Code aanmaken'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ─── Aanvragen ──────────────────────────── */}
        <section>
          <SectionLabel count={(requests ?? []).length}>Aanvragen</SectionLabel>
          {(requests ?? []).length === 0 ? (
            <div className="rounded-[14px] px-4 py-[18px] text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-[13px] m-0" style={{ color: 'var(--color-text-muted)' }}>Geen openstaande aanvragen</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {requests!.map(req => (
                <div
                  key={req.id}
                  className="rounded-[14px] flex items-center gap-3 p-3.5"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-primary-pale)', border: '1.5px solid var(--color-primary-border)' }}
                  >
                    <User size={17} color="var(--color-primary)" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>
                      {req.profiles?.full_name ?? 'Onbekend'}
                    </p>
                    <p className="text-[12px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(req.created_at).toLocaleDateString('nl-BE')}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => resolveRequest(req.id, req.user_id, false)}
                      disabled={actionLoading === req.id}
                      className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                      style={{ background: 'var(--color-danger-bg)', border: 'none' }}
                    >
                      <X size={16} color="var(--color-danger)" weight="bold" />
                    </button>
                    <button
                      onClick={() => resolveRequest(req.id, req.user_id, true)}
                      disabled={actionLoading === req.id}
                      className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                      style={{ background: 'var(--color-success-bg)', border: 'none' }}
                    >
                      <Check size={16} color="var(--color-success)" weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Leden ──────────────────────────────── */}
        <section>
          <SectionLabel count={members.length}>Leden</SectionLabel>
          {members.length === 0 ? (
            <div className="rounded-card px-4 py-6 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-[13px] m-0" style={{ color: 'var(--color-text-muted)' }}>Nog geen leden in deze groep</p>
            </div>
          ) : (
            <div className="rounded-card overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {members.map((member, i) => {
                const isSelf = member.user_id === profile?.id
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-3.5 py-3"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}
                  >
                    <div
                      className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: isSelf ? 'var(--color-accent-bg)' : 'var(--color-surface-alt)',
                        border: `1.5px solid ${isSelf ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
                      }}
                    >
                      <User size={17} color={isSelf ? 'var(--color-accent)' : 'var(--color-text-secondary)'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>
                        {member.profiles?.full_name ?? 'Onbekend'}
                        {isSelf && <span className="ml-1.5 text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>(jij)</span>}
                      </p>
                      <p className="text-[12px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {member.profiles?.role === 'leiding' ? 'Leiding' : 'Lid'}
                      </p>
                    </div>
                    {!isSelf && (
                      <button
                        onClick={() => removeMember(member.id, member.user_id)}
                        disabled={actionLoading === member.id}
                        className="w-8 h-8 rounded-[8px] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                        style={{ background: 'var(--color-danger-bg)', border: 'none' }}
                      >
                        <Trash size={14} color="var(--color-danger)" />
                      </button>
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
