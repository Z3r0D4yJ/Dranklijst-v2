import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, Hash, ArrowRight, CheckCircle, Clock, PaperPlaneTilt } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useMyGroups } from '../../hooks/useMyGroups'
import { notifyLeidingOfJoinRequest } from '../../lib/notifications'
import type { Group } from '../../lib/database.types'

type Mode = 'browse' | 'code'

export function JoinGroup() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>('browse')
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)

  // Invite code state
  const [code, setCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [joinedGroupName, setJoinedGroupName] = useState<string | null>(null)

  const { data: myMemberships } = useMyGroups()
  const myGroupIds = new Set((myMemberships ?? []).map(g => g.id))

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups-public'],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('groups')
        .select('id, name, description')
        .neq('name', 'Leiding')
        .order('name')
      return (data ?? []) as Group[]
    },
  })

  const { data: myRequests } = useQuery({
    queryKey: ['my-join-requests', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('join_requests')
        .select('group_id, status')
        .eq('user_id', user!.id)
        .in('status', ['pending', 'approved'])
      return (data ?? []) as { group_id: string; status: string }[]
    },
  })

  const pendingGroupIds = new Set((myRequests ?? []).filter(r => r.status === 'pending').map(r => r.group_id))

  async function handleRequest(groupId: string) {
    setRequestingId(groupId)
    setRequestError(null)
    const { error } = await supabase.rpc('submit_join_request', { p_group_id: groupId })
    if (error) {
      setRequestError(error.message)
    } else {
      await queryClient.invalidateQueries({ queryKey: ['my-join-requests', user?.id] })
      setSubmittedId(groupId)
      if (profile?.full_name) {
        notifyLeidingOfJoinRequest(groupId, profile.full_name)
      }
    }
    setRequestingId(null)
  }

  async function handleJoinCode() {
    if (!user || code.trim().length < 6) return
    setCodeError(null)
    setCodeLoading(true)
    const { data, error } = await supabase.rpc('join_via_invite', { p_code: code.trim().toUpperCase() })
    if (error) {
      setCodeError(error.message)
    } else {
      setJoinedGroupName(data as string)
    }
    setCodeLoading(false)
  }

  // Success screen (invite code)
  if (joinedGroupName) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--color-success-bg)' }}>
            <CheckCircle size={36} color="var(--color-success)" weight="fill" />
          </div>
          <div>
            <h2 className="text-[20px] font-extrabold tracking-[-0.4px]" style={{ color: 'var(--color-text-primary)' }}>Welkom bij {joinedGroupName}!</h2>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>Je bent toegevoegd aan de groep.</p>
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full flex items-center justify-center gap-2 text-[14px] font-bold py-3.5 rounded-[14px] active:scale-[0.98] transition-transform"
            style={{ background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-fab)' }}
          >
            Naar de app
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 16px' }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: 'var(--color-text-primary)' }}>Groep joinen</h1>
        <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Kies een groep of gebruik een uitnodigingscode</p>
      </div>

      <div className="flex-1 px-5 pt-5 pb-24 space-y-4">
        {/* Browse mode */}
        {mode === 'browse' && (
          <>
            {requestError && (
              <div className="rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                {requestError}
              </div>
            )}

            {groupsLoading && (
              <div className="flex justify-center pt-10">
                <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              </div>
            )}

            {(groups ?? []).map(g => {
              const isMember = myGroupIds.has(g.id)
              const isPending = pendingGroupIds.has(g.id)
              const justSubmitted = submittedId === g.id
              const isRequesting = requestingId === g.id

              return (
                <div
                  key={g.id}
                  className="rounded-card flex items-center justify-between px-4 py-3.5"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary-pale)' }}>
                      <Users size={16} color="var(--color-primary)" weight="bold" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{g.name}</p>
                      {g.description && (
                        <p className="text-[12px] truncate" style={{ color: 'var(--color-text-muted)' }}>{g.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="ml-3 shrink-0">
                    {isMember ? (
                      <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--color-success)' }}>
                        <CheckCircle size={14} weight="fill" />
                        Lid
                      </span>
                    ) : isPending || justSubmitted ? (
                      <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                        <Clock size={14} />
                        Aangevraagd
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequest(g.id)}
                        disabled={isRequesting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold active:scale-95 transition-transform disabled:opacity-50"
                        style={{ background: 'var(--color-primary)', color: '#fff' }}
                      >
                        <PaperPlaneTilt size={13} weight="fill" />
                        {isRequesting ? 'Bezig…' : 'Aanvragen'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            <button
              onClick={() => setMode('code')}
              className="w-full text-center text-[13px] py-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Uitnodigingscode invoeren
            </button>
          </>
        )}

        {/* Code mode */}
        {mode === 'code' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('browse')}
              className="text-[13px] font-semibold flex items-center gap-1"
              style={{ color: 'var(--color-primary)' }}
            >
              ← Terug naar groepen
            </button>

            <div className="rounded-card p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-pale)' }}>
                  <Hash size={16} color="var(--color-primary)" />
                </div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Uitnodigingscode</p>
              </div>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleJoinCode()}
                placeholder="ABC123"
                maxLength={6}
                className="w-full text-center text-2xl font-bold tracking-[0.3em] bg-transparent outline-none py-2"
                style={{ color: 'var(--color-text-primary)' }}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {codeError && (
              <div className="rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                {codeError}
              </div>
            )}

            <button
              onClick={handleJoinCode}
              disabled={code.trim().length < 6 || codeLoading}
              className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-[14px] active:scale-[0.98] transition-transform disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {codeLoading ? 'Bezig…' : 'Deelnemen'}
              {!codeLoading && <ArrowRight size={18} />}
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-[13px] py-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Overslaan voor nu
        </button>
      </div>
    </div>
  )
}
