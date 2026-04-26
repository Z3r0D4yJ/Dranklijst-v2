import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CaretRight, Check, CurrencyEur, Plus, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AdminEmptyState, AdminSectionLabel, AdminStatTile, AdminSurface, SkeletonList, SkeletonStatTiles } from '../../components/AdminThemePrimitives'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { ActionPillButton } from '../../components/ui/action-button'
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
  const queryClient = useQueryClient()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  function closeNew() {
    setShowNew(false)
    setNewName('')
    setNewDescription('')
  }

  async function createGroup() {
    if (!newName.trim()) return
    setCreating(true)

    try {
      const { error } = await supabase.from('groups').insert({
        name: newName.trim(),
        description: newDescription.trim() || null,
      })

      if (error) {
        toast.error(error.message || 'Kon groep niet aanmaken.')
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['groups-public'] }),
        queryClient.invalidateQueries({ queryKey: ['groups-list'] }),
        queryClient.invalidateQueries({ queryKey: ['groups-list-all'] }),
        queryClient.invalidateQueries({ queryKey: ['user-group-options'] }),
      ])

      toast.success(`Groep "${newName.trim()}" aangemaakt.`)
      closeNew()
    } finally {
      setCreating(false)
    }
  }

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
      <div className="px-5 space-y-3 pb-content-end-comfort">
        <ActionPillButton onClick={() => setShowNew(true)} variant="accent" size="md" className="w-full">
          <Plus size={16} weight="bold" />
          Nieuwe groep
        </ActionPillButton>
        <section className="space-y-2">
          <AdminSectionLabel>Groepen</AdminSectionLabel>
          <SkeletonStatTiles count={2} />
        </section>
        <section className="space-y-2">
          <AdminSectionLabel>Alle groepen</AdminSectionLabel>
          <SkeletonList rows={5} trailing="caret" />
        </section>
      </div>
    )
  }

  return (
    <div className="px-5 space-y-3 pb-content-end-comfort">
      <ActionPillButton
        onClick={() => setShowNew(true)}
        variant="accent"
        size="md"
        className="w-full dl-stagger-card"
        style={{ animationDelay: '0ms' }}
      >
        <Plus size={16} weight="bold" />
        Nieuwe groep
      </ActionPillButton>

      <AdminFormDrawer
        open={showNew}
        onOpenChange={(open) => { if (!open) closeNew() }}
        title="Nieuwe groep"
        dismissible={!creating}
        disableClose={creating}
        scrollBody
        fixed={false}
        repositionInputs={false}
        bodyClassName="space-y-4"
        footer={
          <ActionPillButton
            onClick={createGroup}
            disabled={!newName.trim() || creating}
            variant="accent"
            size="md"
            className="w-full"
          >
            <Check size={14} weight="bold" />
            {creating ? 'Aanmaken...' : 'Aanmaken'}
          </ActionPillButton>
        }
      >
        <div className="space-y-1.5">
          <label className="text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: 'var(--color-text-muted)' }}>
            Naam
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="bv. Rakwi"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            className="dl-input text-[13px]"
            onKeyDown={(e) => { if (e.key === 'Enter') void createGroup() }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: 'var(--color-text-muted)' }}>
            Beschrijving <span className="normal-case font-medium tracking-normal">(optioneel)</span>
          </label>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Korte omschrijving"
            autoComplete="off"
            autoCorrect="off"
            className="dl-input text-[13px]"
            onKeyDown={(e) => { if (e.key === 'Enter') void createGroup() }}
          />
        </div>
      </AdminFormDrawer>

      <section className="space-y-2">
        <AdminSectionLabel>Groepen</AdminSectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          <AdminStatTile
            label="Leden"
            value={String(totalMembers)}
            icon={Users}
            tone="primary"
            className="dl-stagger-tile"
            style={{ animationDelay: '0ms' }}
          />
          <AdminStatTile
            label="Omzet"
            value={formatMoney(totalTurnover)}
            icon={CurrencyEur}
            tone="primary"
            valueTone="primary"
            className="dl-stagger-tile"
            style={{ animationDelay: '60ms' }}
          />
        </div>
      </section>

      <section className="space-y-2 dl-stagger-card" style={{ animationDelay: '120ms' }}>
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
        <div className="dl-stagger-card" style={{ animationDelay: '200ms' }}>
          <AdminSectionLabel>Alle groepen</AdminSectionLabel>
        </div>
        <AdminSurface>
          {(groups ?? []).map((group, index) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
              className="w-full px-4 py-3.5 text-left active:opacity-70 transition-opacity"
              style={{ borderTop: index === 0 ? 'none' : '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between gap-3 dl-stagger-row" style={{ animationDelay: `${120 + index * 45}ms` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <IconChip tone="primary" icon={Users} size={36} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {group.name}
                    </p>
                    <p className="m-0 mt-0.5 text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {group.memberCount} {group.memberCount === 1 ? 'lid' : 'leden'}
                    </p>
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
            {selectedGroup.members.length === 0 ? (
              <AdminEmptyState
                icon={Users}
                title="Nog geen leden"
                description="Leden van deze groep verschijnen hier zodra ze gekoppeld zijn."
              />
            ) : (
              <section className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <AdminSectionLabel>Leden</AdminSectionLabel>
                  <span className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                    {selectedGroup.memberCount} {selectedGroup.memberCount === 1 ? 'lid' : 'leden'} · {formatMoney(selectedGroup.total)}
                  </span>
                </div>
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
