import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CaretRight, CurrencyEur, Users } from '@phosphor-icons/react'
import { AdminEmptyState, AdminSectionLabel, AdminStatTile, AdminSurface } from '../../components/AdminThemePrimitives'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/spinner'
import { Badge } from '../../components/ui/badge'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { IconChip } from '../../components/IconChip'
import { UserAvatar } from '../../components/UserAvatar'
import { ROLE_BADGE_VARIANT } from '../../lib/role-utils'
import { formatMoney } from '../../lib/formatters'
import { CustomSelect } from '../../components/CustomSelect'
import type { Period, Role } from '../../lib/database.types'

interface GroupMemberRow {
  user_id: string
  full_name: string
  role: string
  avatar_url: string | null
  total: number
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
}

function normalizeRole(role: string | null | undefined): Role {
  if (role === 'lid' || role === 'leiding' || role === 'kas') return role
  return 'lid'
}

export function Groups() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('')

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data } = await supabase.from('periods').select('*').order('started_at', { ascending: false })
      return (data ?? []) as Period[]
    },
  })

  const { data: groups, isLoading } = useQuery({
    queryKey: ['admin-groups', selectedPeriod],
    queryFn: async () => {
      const [{ data: groupsData }, { data: memberships }] = await Promise.all([
        supabase.from('groups').select('id, name').order('name'),
        supabase.from('group_members').select('user_id, group_id, profiles(full_name, role, avatar_url)'),
      ])

      const memberRows = (memberships ?? []) as unknown as Array<{
        user_id: string
        group_id: string
        profiles: { full_name: string; role: string; avatar_url: string | null }[] | { full_name: string; role: string; avatar_url: string | null } | null
      }>

      let txQuery = supabase
        .from('transactions')
        .select('user_id, total_price')

      if (selectedPeriod) txQuery = txQuery.eq('period_id', selectedPeriod)

      const { data: txData } = await txQuery
      const memberTotals: Record<string, number> = {}

      for (const tx of (txData ?? []) as Array<{ user_id: string; total_price: number }>) {
        memberTotals[tx.user_id] = (memberTotals[tx.user_id] ?? 0) + tx.total_price
      }

      return ((groupsData ?? []) as Array<{ id: string; name: string }>).map((group) => {
        const groupMembers = memberRows
          .filter((member) => member.group_id === group.id)
          .map((member) => {
            const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
            return {
              user_id: member.user_id,
              full_name: profile?.full_name ?? 'Onbekend',
              role: profile?.role ?? 'lid',
              avatar_url: profile?.avatar_url ?? null,
              total: memberTotals[member.user_id] ?? 0,
            }
          })
          .sort((a, b) => b.total - a.total || a.full_name.localeCompare(b.full_name))

        return {
          id: group.id,
          name: group.name,
          memberCount: groupMembers.length,
          total: groupMembers.reduce((sum, member) => sum + member.total, 0),
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
      <section className="space-y-2">
        <AdminSectionLabel>Groepen</AdminSectionLabel>
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
      </section>

      <section className="space-y-2">
        <AdminSectionLabel>Periode</AdminSectionLabel>
        <CustomSelect
          value={selectedPeriod}
          onChange={(value) => {
            setSelectedPeriod(value)
            setSelectedGroupId(null)
          }}
          options={(periods ?? []).map((period) => ({
            value: period.id,
            label: period.name,
            statusDot: period.is_active ? 'success' : undefined,
          }))}
          placeholder="Alle periodes"
          style={{ minWidth: 0 }}
        />
      </section>

      <section className="space-y-2">
        <AdminSectionLabel>Alle groepen</AdminSectionLabel>
        <AdminSurface>
          {(groups ?? []).map((group, index) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
              className="w-full px-4 py-3.5 text-left active:opacity-70 transition-opacity"
              style={{
                borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
                fontFamily: 'inherit',
              }}
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
        </AdminSurface>
      </section>

      <AdminFormDrawer
        open={!!selectedGroup}
        onOpenChange={(open) => {
          if (!open) setSelectedGroupId(null)
        }}
        title={selectedGroup?.name ?? 'Groep'}
        bodyClassName="space-y-3"
        contentClassName="max-w-md"
        maxHeight="var(--drawer-max-height-compact)"
      >
        {selectedGroup && (
          <>
            <section className="space-y-2">
              <AdminSectionLabel>Overzicht</AdminSectionLabel>
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
            </section>

            {selectedGroup.members.length === 0 ? (
              <AdminEmptyState
                icon={Users}
                title="Nog geen leden"
                description="Leden van deze groep verschijnen hier zodra ze gekoppeld zijn."
              />
            ) : (
              <section className="space-y-2">
                <AdminSectionLabel>Leden</AdminSectionLabel>
                <AdminSurface>
                  {selectedGroup.members.map((member, index) => {
                    const memberRole = normalizeRole(member.role)

                    return (
                      <div
                        key={`${member.user_id}-${index}`}
                        className="flex items-center gap-3 px-3.5 py-3.5"
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
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <Badge variant={ROLE_BADGE_VARIANT[memberRole]} size="sm">
                              {ROLE_LABELS[memberRole] ?? 'Lid'}
                            </Badge>
                          </div>
                        </div>
                        <span className="shrink-0 text-[15px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                          {formatMoney(member.total)}
                        </span>
                      </div>
                    )
                  })}
                </AdminSurface>
              </section>
            )}
          </>
        )}
      </AdminFormDrawer>
    </div>
  )
}
