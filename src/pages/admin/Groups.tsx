import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CaretRight, CurrencyEur, Users } from '@phosphor-icons/react'
import { AdminEmptyState, AdminOverviewCard, AdminStatTile } from '../../components/AdminThemePrimitives'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/spinner'
import { Badge } from '../../components/ui/badge'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { IconChip } from '../../components/IconChip'
import { UserAvatar } from '../../components/UserAvatar'
import { ROLE_BADGE_VARIANT } from '../../lib/role-utils'
import { formatMoney } from '../../lib/formatters'

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
  admin: 'Kas',
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
  const totalMembers = (groups ?? []).reduce((sum, group) => sum + group.memberCount, 0)
  const totalTurnover = (groups ?? []).reduce((sum, group) => sum + group.total, 0)

  if (isLoading) {
    return (
      <div className="flex justify-center mt-8">
        <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div className="px-4 space-y-3 pb-content-end-comfort">
      <AdminOverviewCard
        icon={Users}
        tone="primary"
        eyebrow="Groepen"
        title={`${(groups ?? []).length} groepen`}
      >
        <div className="grid grid-cols-2 gap-2.5">
          <AdminStatTile
            label="Leden"
            value={String(totalMembers)}
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
      </AdminOverviewCard>

      <p
        className="m-0 text-[11px] font-extrabold uppercase tracking-[1.2px]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Alle groepen
      </p>

      {(groups ?? []).map((group) => (
        <button
          key={group.id}
          type="button"
          onClick={() => setSelectedGroupId(group.id)}
          className="w-full rounded-card px-4 py-3.5 text-left active:scale-[0.99] transition-transform"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontFamily: 'inherit' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <IconChip tone="primary" icon={Users} size={36} />
              <div className="min-w-0">
                <p className="text-[13px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {group.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="secondary" size="sm">{group.memberCount} leden</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[16px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                {formatMoney(group.total)}
              </span>
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
        bodyClassName="px-0 py-0"
        contentClassName="max-w-md"
        maxHeight="var(--drawer-max-height-compact)"
      >
        {selectedGroup && (
          <>
            <div className="px-5 pt-5 pb-4">
              <AdminOverviewCard
                icon={Users}
                tone="primary"
                eyebrow="Groepsdetail"
                title={selectedGroup.name}
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <AdminStatTile
                    label="Leden"
                    value={String(selectedGroup.memberCount)}
                    icon={Users}
                    tone="primary"
                  />
                  <AdminStatTile
                    label="Omzet"
                    value={formatMoney(selectedGroup.total)}
                    icon={CurrencyEur}
                    tone="primary"
                    valueTone="primary"
                  />
                </div>
              </AdminOverviewCard>
            </div>

            {selectedGroup.members.length === 0 ? (
              <div className="px-5 pb-5">
                <AdminEmptyState
                  icon={Users}
                  title="Nog geen leden"
                  description="Leden van deze groep verschijnen hier zodra ze gekoppeld zijn."
                />
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
                    </div>
                    <Badge variant={ROLE_BADGE_VARIANT[member.role as keyof typeof ROLE_BADGE_VARIANT] ?? 'secondary'} size="sm">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </Badge>
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
