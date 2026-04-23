import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, Hash, ArrowRight, CheckCircle, Clock, PaperPlaneTilt } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/spinner'
import { ActionPillButton } from '../../components/ui/action-button'
import { useMyGroups } from '../../hooks/useMyGroups'
import { notifyLeidingOfInviteJoinRequest, notifyLeidingOfJoinRequest } from '../../lib/notifications'
import type { Group } from '../../lib/database.types'

type Mode = 'browse' | 'code'

function parseInviteRequestResult(data: unknown) {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const result = data as { group_id?: unknown; group_name?: unknown }

    return {
      groupId: typeof result.group_id === 'string' ? result.group_id : undefined,
      groupName: typeof result.group_name === 'string' ? result.group_name : 'de groep',
    }
  }

  return {
    groupId: undefined,
    groupName: typeof data === 'string' ? data : 'de groep',
  }
}

export function JoinGroup() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>('browse')
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [joinedGroupName, setJoinedGroupName] = useState<string | null>(null)

  const { data: myMemberships } = useMyGroups()
  const myGroupIds = new Set((myMemberships ?? []).map((group) => group.id))

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

  const pendingGroupIds = new Set((myRequests ?? []).filter((request) => request.status === 'pending').map((request) => request.group_id))

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
        try {
          await notifyLeidingOfJoinRequest(groupId, profile.full_name)
        } catch (notifyError) {
          console.warn('Join request notification failed:', notifyError)
        }
      }
    }

    setRequestingId(null)
  }

  async function handleJoinCode() {
    if (!user || code.trim().length < 6) return

    setCodeError(null)
    setCodeLoading(true)
    const normalizedCode = code.trim().toUpperCase()

    const { data, error } = await supabase.rpc('submit_join_request_by_invite_code', { p_code: normalizedCode })

    if (error) {
      setCodeError(error.message)
    } else {
      const result = parseInviteRequestResult(data)
      setJoinedGroupName(result.groupName)

      if (profile?.full_name) {
        try {
          if (result.groupId) {
            await notifyLeidingOfJoinRequest(result.groupId, profile.full_name)
          } else {
            await notifyLeidingOfInviteJoinRequest(normalizedCode, profile.full_name)
          }
        } catch (notifyError) {
          console.warn('Join request notification failed:', notifyError)
        }
      }
    }

    setCodeLoading(false)
  }

  if (joinedGroupName) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--color-success-bg)' }}>
            <CheckCircle size={36} color="var(--color-success)" weight="fill" />
          </div>
          <div>
            <h2 className="text-[20px] font-extrabold tracking-[-0.4px]" style={{ color: 'var(--color-text-primary)' }}>
              Aanvraag verzonden
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
              Je aanvraag voor {joinedGroupName} is doorgestuurd naar de leiding of kas.
            </p>
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] py-3.5 text-[14px] font-bold transition-transform active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            Naar de app
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-bg)' }}>
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 16px' }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: 'var(--color-text-primary)' }}>
          Groep joinen
        </h1>
        <p className="mt-0.5 text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Kies een groep of gebruik een uitnodigingscode
        </p>
      </div>

      <div className="flex-1 space-y-4 px-5 pb-page-clearance pt-5">
        {mode === 'browse' && (
          <>
            {requestError && (
              <div className="rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                {requestError}
              </div>
            )}

            {groupsLoading && (
              <div className="flex justify-center pt-10">
                <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
              </div>
            )}

            {(groups ?? []).map((group) => {
              const isMember = myGroupIds.has(group.id)
              const isPending = pendingGroupIds.has(group.id)
              const justSubmitted = submittedId === group.id
              const isRequesting = requestingId === group.id

              return (
                <div
                  key={group.id}
                  className="rounded-card flex items-center justify-between px-4 py-3.5"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--color-primary-pale)' }}>
                      <Users size={16} color="var(--color-primary)" weight="bold" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {group.name}
                      </p>
                      {group.description && (
                        <p className="truncate text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                          {group.description}
                        </p>
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
                      <ActionPillButton
                        onClick={() => handleRequest(group.id)}
                        disabled={isRequesting}
                        variant="primary-soft"
                      >
                        <PaperPlaneTilt size={13} color="currentColor" weight="fill" />
                        {isRequesting ? 'Bezig...' : 'Aanvragen'}
                      </ActionPillButton>
                    )}
                  </div>
                </div>
              )
            })}

            <button
              onClick={() => setMode('code')}
              className="w-full py-3 text-center text-[13px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Uitnodigingscode invoeren
            </button>
          </>
        )}

        {mode === 'code' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('browse')}
              className="flex items-center gap-1 text-[13px] font-semibold"
              style={{ color: 'var(--color-primary)' }}
            >
              {'<-'} Terug naar groepen
            </button>

            <div className="rounded-card p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--color-primary-pale)' }}>
                  <Hash size={16} color="var(--color-primary)" />
                </div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Uitnodigingscode
                </p>
              </div>
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                onKeyDown={(event) => event.key === 'Enter' && handleJoinCode()}
                placeholder="ABC123"
                maxLength={6}
                className="w-full bg-transparent py-2 text-center text-2xl font-bold tracking-[0.3em] outline-none"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {codeLoading ? 'Bezig...' : 'Deelnemen'}
              {!codeLoading && <ArrowRight size={18} />}
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full py-2 text-center text-[13px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Overslaan voor nu
        </button>
      </div>
    </div>
  )
}
