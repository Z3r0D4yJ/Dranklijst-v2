import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CaretRight, CurrencyEur, Users } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/spinner'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { IconChip } from '../../components/IconChip'
import { UserAvatar } from '../../components/UserAvatar'

interface GroupMemberRow {
  full_name: string
  role: string
  avatar_url: string | null
}

interface GroupRow {
  id: string
  name: string
  memberCount: number
  total: number
  members: GroupMemberRow[]
}

const ROLE_LABELS: Record<string, string> = {
  lid: 'Lid',
  leiding: 'Leiding',
  kas: 'Kas',
  admin: 'Admin',
  groepsleiding: 'Groepsleiding',
}

export function Groups() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  const { data: groups, isLoading } = useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => {
      const [{ data: groupsData }, { data: memberships }, { data: activePeriod }] = await Promise.all([
        supabase.from('groups').select('id, name').order('name'),
        supabase.from('group_members').select('user_id, group_id, profiles(full_name, role, avatar_url)'),
        supabase.from('periods').select('id').eq('is_active', true).maybeSingle(),
      ])

      const memberRows = (memberships ?? []) as unknown as Array<{
        user_id: string
        group_id: string
        profiles: { full_name: string; role: string; avatar_url: string | null }[] | { full_name: string; role: string; avatar_url: string | null } | null
      }>

      const txMap: Record<string, number> = {}
      if (activePeriod) {
        const { data: txData } = await supabase
          .from('transactions')
          .select('user_id, total_price')
          .eq('period_id', activePeriod.id)

        const memberGroupMap: Record<string, string> = {}
        for (const member of memberRows) {
          memberGroupMap[member.user_id] = member.group_id
        }

        for (const tx of (txData ?? []) as Array<{ user_id: string; total_price: number }>) {
          const groupId = memberGroupMap[tx.user_id]
          if (groupId) {
            txMap[groupId] = (txMap[groupId] ?? 0) + tx.total_price
          }
        }
      }

      return ((groupsData ?? []) as Array<{ id: string; name: string }>).map((group) => {
        const groupMembers = memberRows
          .filter((member) => member.group_id === group.id)
          .map((member) => {
            const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
            return {
              full_name: profile?.full_name ?? 'Onbekend',
              role: profile?.role ?? 'lid',
              avatar_url: profile?.avatar_url ?? null,
            }
          })

        return {
          id: group.id,
          name: group.name,
          memberCount: groupMembers.length,
          total: txMap[group.id] ?? 0,
          members: groupMembers,
        } satisfies GroupRow
      })
    },
  })

  const selectedGroup = (groups ?? []).find((group) => group.id === selectedGroupId) ?? null

  if (isLoading) {
    return (
      <div className="flex justify-center mt-8">
        <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div className="px-4 space-y-3">
      {(groups ?? []).map((group) => (
        <button
          key={group.id}
          type="button"
          onClick={() => setSelectedGroupId(group.id)}
          className="w-full rounded-[14px] px-4 py-3.5 text-left active:scale-[0.99] transition-transform"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontFamily: 'inherit' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-primary-pale)' }}
              >
                <Users size={16} color="var(--color-primary)" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {group.name}
                </p>
                <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {group.memberCount} leden
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {group.total > 0 && (
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                  style={{ background: 'var(--color-success-bg)' }}
                >
                  <CurrencyEur size={11} color="var(--color-success)" />
                  <span className="text-[11px] font-bold" style={{ color: 'var(--color-success)' }}>
                    {group.total.toFixed(2)}
                  </span>
                </div>
              )}
              <CaretRight size={14} color="var(--color-text-muted)" />
            </div>
          </div>
        </button>
      ))}

      <AdminFormDrawer
        open={!!selectedGroup}
        onOpenChange={(open) => {
          if (!open) setSelectedGroupId(null)
        }}
        title={selectedGroup?.name ?? 'Groep'}
        description={
          selectedGroup
            ? `${selectedGroup.memberCount} ${selectedGroup.memberCount === 1 ? 'lid' : 'leden'}`
            : 'Groepsleden'
        }
        bodyClassName="px-0 py-0"
        contentClassName="max-w-md"
        maxHeight="80vh"
      >
        {selectedGroup && (
          <>
            <div className="grid grid-cols-2 gap-2.5 px-5 pt-5 pb-4">
              <div className="rounded-[14px] p-3.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.8px] m-0 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Leden
                </p>
                <p className="text-[20px] font-extrabold m-0 tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedGroup.memberCount}
                </p>
              </div>
              <div className="rounded-[14px] p-3.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.8px] m-0 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Actieve periode
                </p>
                <p className="text-[20px] font-extrabold m-0 tabular-nums" style={{ color: 'var(--color-success)' }}>
                  EUR {selectedGroup.total.toFixed(2)}
                </p>
              </div>
            </div>

            {selectedGroup.members.length === 0 ? (
              <div className="px-5 pb-5">
                <div
                  className="rounded-card px-4 py-12 flex flex-col items-center text-center"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <IconChip tone="primary" icon={Users} size={48} />
                  <p className="text-[14px] font-bold mt-3" style={{ color: 'var(--color-text-primary)' }}>
                    Nog geen leden
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Leden van deze groep verschijnen hier.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--color-border)' }}>
                {selectedGroup.members.map((member, index) => (
                  <div
                    key={`${member.full_name}-${index}`}
                    className="flex items-center gap-3 px-5 py-3.5"
                    style={{ borderTop: index > 0 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <UserAvatar
                      avatarUrl={member.avatar_url}
                      size={36}
                      bg="var(--color-primary-pale)"
                      border="none"
                      iconColor="var(--color-primary)"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {member.full_name}
                      </p>
                      <p className="text-[12px] font-medium m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {ROLE_LABELS[member.role] ?? member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </AdminFormDrawer>
    </div>
  )
}
