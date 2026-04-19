import { useEffect, useState } from 'react'
import { Users, Check, X, Trash, Clock } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { notifyJoinRequestResolved } from '../../lib/notifications'
import { useThemeColor } from '../../hooks/useThemeColor'

interface JoinRequestWithProfile {
  id: string
  user_id: string
  group_id: string
  status: string
  created_at: string
  profiles: { full_name: string } | null
}

interface MemberWithProfile {
  id: string
  user_id: string
  joined_at: string
  profiles: { full_name: string; role: string } | null
}

export function GroupManagement() {
  useThemeColor('--color-bg')
  const { profile } = useAuth()
  const [requests, setRequests] = useState<JoinRequestWithProfile[]>([])
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [groupName, setGroupName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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

    setGroupName(ownGroup.groups?.name ?? '')
    const groupId = ownGroup.group_id

    const [requestsRes, membersRes] = await Promise.all([
      supabase
        .from('join_requests')
        .select('*, profiles(full_name)')
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .order('created_at'),
      supabase
        .from('group_members')
        .select('*, profiles(full_name, role)')
        .eq('group_id', groupId)
        .order('joined_at'),
    ])

    if (requestsRes.data) setRequests(requestsRes.data as unknown as JoinRequestWithProfile[])
    if (membersRes.data) setMembers(membersRes.data as unknown as MemberWithProfile[])
    setLoading(false)
  }

  async function resolveRequest(requestId: string, userId: string, groupId: string, approve: boolean) {
    setActionLoading(requestId)

    const { error } = await supabase
      .from('join_requests')
      .update({
        status: approve ? 'approved' : 'rejected',
        resolved_at: new Date().toISOString(),
        resolved_by: profile?.id,
      })
      .eq('id', requestId)

    if (!error && approve) {
      await supabase.from('group_members').insert({ user_id: userId, group_id: groupId })
    }
    if (!error) {
      notifyJoinRequestResolved(userId, groupName, approve)
    }

    await loadData()
    setActionLoading(null)
  }

  async function removeMember(memberId: string, memberUserId: string) {
    if (memberUserId === profile?.id) return
    setActionLoading(memberId)
    await supabase.from('group_members').delete().eq('id', memberId)
    await loadData()
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-8">
      <div className="bg-white dark:bg-[#1E293B] border-b border-[#F1F5F9] dark:border-[#334155] px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">Groepsbeheer</h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">{groupName}</p>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Join-aanvragen */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <Clock size={15} color="#2563EB" />
            </div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">Aanvragen</h2>
            {requests.length > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="bg-white dark:bg-[#1E293B] rounded-[14px] border border-[#F1F5F9] dark:border-[#334155] px-4 py-6 text-center">
              <p className="text-sm text-[#94A3B8]">Geen openstaande aanvragen</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(req => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-[#1E293B] rounded-[14px] border border-[#F1F5F9] dark:border-[#334155] px-4 py-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-full flex items-center justify-center">
                      <Users size={16} color="#2563EB" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                        {req.profiles?.full_name ?? 'Onbekend'}
                      </p>
                      <p className="text-xs text-[#94A3B8]">
                        {new Date(req.created_at).toLocaleDateString('nl-BE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveRequest(req.id, req.user_id, req.group_id, false)}
                      disabled={actionLoading === req.id}
                      className="w-9 h-9 bg-[#FEF2F2] dark:bg-[#450A0A] rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <X size={18} color="#EF4444" weight="bold" />
                    </button>
                    <button
                      onClick={() => resolveRequest(req.id, req.user_id, req.group_id, true)}
                      disabled={actionLoading === req.id}
                      className="w-9 h-9 bg-[#ECFDF5] dark:bg-[#064E3B] rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <Check size={18} color="#10B981" weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Leden */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <Users size={15} color="#2563EB" />
            </div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">Leden</h2>
            <span className="text-xs text-[#94A3B8] font-medium">{members.length}</span>
          </div>

          {members.length === 0 ? (
            <div className="bg-white dark:bg-[#1E293B] rounded-[14px] border border-[#F1F5F9] dark:border-[#334155] px-4 py-6 text-center">
              <p className="text-sm text-[#94A3B8]">Nog geen leden in deze groep</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(member => {
                const isSelf = member.user_id === profile?.id
                return (
                  <div
                    key={member.id}
                    className="bg-white dark:bg-[#1E293B] rounded-[14px] border border-[#F1F5F9] dark:border-[#334155] px-4 py-3.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-full flex items-center justify-center">
                        <Users size={16} color="#2563EB" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                          {member.profiles?.full_name ?? 'Onbekend'}
                          {isSelf && (
                            <span className="ml-2 text-xs text-[#94A3B8] font-normal">(jij)</span>
                          )}
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          {member.profiles?.role === 'leiding' ? 'Leiding' : 'Lid'} · {new Date(member.joined_at).toLocaleDateString('nl-BE')}
                        </p>
                      </div>
                    </div>
                    {!isSelf && (
                      <button
                        onClick={() => removeMember(member.id, member.user_id)}
                        disabled={actionLoading === member.id}
                        className="w-9 h-9 bg-[#FEF2F2] dark:bg-[#450A0A] rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <Trash size={16} color="#EF4444" />
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
