import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, MagnifyingGlass, PencilSimple, Users as UsersIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AdminEmptyState, AdminSectionLabel, AdminSurface, SkeletonList } from '../../components/AdminThemePrimitives'
import { Badge } from '../../components/ui/badge'
import { supabase } from '../../lib/supabase'
import { UserAvatar } from '../../components/UserAvatar'
import { Pagination } from '../../components/Pagination'
import { CustomSelect } from '../../components/CustomSelect'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { ActionPillButton, IconActionButton } from '../../components/ui/action-button'
import { usePagination } from '../../hooks/usePagination'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../lib/database.types'
import { ROLE_BADGE_VARIANT } from '../../lib/role-utils'

interface GroupOption {
  id: string
  name: string
}

interface UserRow {
  id: string
  full_name: string
  role: Role
  avatar_url: string | null
  created_at: string
  groups: string[]
  primaryGroupId: string | null
  primaryGroupName: string | null
}

const ROLES: { value: Role; label: string }[] = [
  { value: 'lid', label: 'Lid' },
  { value: 'leiding', label: 'Leiding' },
  { value: 'kas', label: 'Kas' },
]


const FIELD_LABEL_CLASS = 'text-[11px] font-extrabold uppercase tracking-[1px]'

function normalizeRole(role: string | null | undefined): Role {
  if (role === 'lid' || role === 'leiding' || role === 'kas') {
    return role
  }

  return 'lid'
}

function roleNeedsGroup(role: Role) {
  return role === 'lid' || role === 'leiding' || role === 'kas'
}

function getRoleLabel(role: Role) {
  return ROLES.find((item) => item.value === role)?.label ?? role
}

function getScopeLabel(user: Pick<UserRow, 'role' | 'primaryGroupName'>) {
  return user.primaryGroupName ?? 'Geen groep'
}

function getDrawerHint(role: Role, groupName: string | null) {
  if (role === 'leiding') {
    return groupName
      ? `${groupName}: hoofdgroep + automatisch Leiding.`
      : 'Kies een hoofdgroep. Leiding wordt automatisch extra gekoppeld.'
  }

  if (role === 'kas') {
    return groupName
      ? `${groupName}: hoofdgroep, leidingrechten en kasrechten.`
      : 'Kies een hoofdgroep. Kas krijgt ook leidingrechten.'
  }

  return groupName
    ? `${groupName}: enige hoofdgroep.`
    : 'Een lid heeft exact een hoofdgroep nodig.'
}

export function Users() {
  const queryClient = useQueryClient()
  const { profile, refreshProfile } = useAuth()
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [draftRole, setDraftRole] = useState<Role>('lid')
  const [draftGroupId, setDraftGroupId] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: groupOptions = [] } = useQuery({
    queryKey: ['user-group-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .neq('name', 'Leiding')
        .order('name')

      if (error) throw error
      return (data ?? []) as GroupOption[]
    },
  })

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const [profilesResult, membershipsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, role, avatar_url, created_at')
          .order('full_name'),
        supabase
          .from('group_members')
          .select('user_id, groups(id, name)'),
      ])

      if (profilesResult.error) throw profilesResult.error
      if (membershipsResult.error) throw membershipsResult.error

      const memberMap: Record<string, GroupOption[]> = {}

      for (const membership of (membershipsResult.data ?? []) as Array<{
        user_id: string
        groups: GroupOption[] | GroupOption | null
      }>) {
        const group = Array.isArray(membership.groups) ? membership.groups[0] : membership.groups
        if (!group) continue

        if (!memberMap[membership.user_id]) {
          memberMap[membership.user_id] = []
        }

        memberMap[membership.user_id].push(group)
      }

      return ((profilesResult.data ?? []) as Array<{
        id: string
        full_name: string
        role: string
        avatar_url: string | null
        created_at: string
      }>).map((profileRow) => {
        const memberships = memberMap[profileRow.id] ?? []
        const primaryGroup = memberships.find((group) => group.name !== 'Leiding') ?? null

        return {
          ...profileRow,
          role: normalizeRole(profileRow.role),
          groups: memberships.map((group) => group.name),
          primaryGroupId: primaryGroup?.id ?? null,
          primaryGroupName: primaryGroup?.name ?? null,
        }
      }) as UserRow[]
    },
  })

  const isLoading = isUsersLoading

  function openEditor(user: UserRow) {
    setEditingUser(user)
    setDraftRole(user.role)
    setDraftGroupId(user.primaryGroupId ?? '')
  }

  function closeEditor() {
    if (saving) return
    setEditingUser(null)
    setDraftRole('lid')
    setDraftGroupId('')
  }

  async function ensureRoleGroupMembership(userId: string, role: Role, groupId: string | null) {
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    if (!roleNeedsGroup(role) || !groupId) return

    const memberships = [{ user_id: userId, group_id: groupId }]

    if (role === 'leiding' || role === 'kas') {
      const { data: leidingGroup, error: leidingError } = await supabase
        .from('groups')
        .select('id')
        .eq('name', 'Leiding')
        .maybeSingle()

      if (leidingError) throw leidingError

      if (leidingGroup?.id && leidingGroup.id !== groupId) {
        memberships.push({ user_id: userId, group_id: leidingGroup.id })
      }
    }

    const { error: insertError } = await supabase
      .from('group_members')
      .insert(memberships)

    if (insertError) throw insertError
  }

  async function saveUser() {
    if (!editingUser) return

    if (roleNeedsGroup(draftRole) && !draftGroupId) {
      toast.error('Kies eerst een hoofdgroep.')
      return
    }

    setSaving(true)

    const { error } = await supabase.rpc('set_user_role_and_group', {
      p_user_id: editingUser.id,
      p_role: draftRole,
      p_group_id: roleNeedsGroup(draftRole) ? draftGroupId : null,
    })

    if (error) {
      setSaving(false)
      toast.error(error.message || 'Gebruiker kon niet worden bijgewerkt.')
      return
    }

    const shouldVerifyMembership =
      editingUser.id !== profile?.id ||
      draftRole === 'kas'

    if (shouldVerifyMembership) {
      try {
        await ensureRoleGroupMembership(
          editingUser.id,
          draftRole,
          roleNeedsGroup(draftRole) ? draftGroupId : null,
        )
      } catch (membershipError) {
        setSaving(false)
        toast.error(
          membershipError instanceof Error
            ? membershipError.message
            : 'Rol opgeslagen, maar de groep kon niet correct gekoppeld worden.',
        )
        return
      }
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['group-members'] }),
      queryClient.invalidateQueries({ queryKey: ['my-group'] }),
      queryClient.invalidateQueries({ queryKey: ['my-groups'] }),
      queryClient.invalidateQueries({ queryKey: ['leiding-group'] }),
      queryClient.invalidateQueries({ queryKey: ['group-transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
    ])

    if (editingUser.id === profile?.id) {
      await refreshProfile()
    }

    const savedName = editingUser.full_name
    setSaving(false)
    closeEditor()
    toast.success(`${savedName} werd bijgewerkt.`)
  }

  const filtered = (users ?? []).filter((user) =>
    user.full_name.toLowerCase().includes(search.toLowerCase()),
  )
  const memberCount = (users ?? []).filter((user) => user.role === 'lid').length
  const leidingKasCount = (users ?? []).filter((user) => user.role === 'leiding' || user.role === 'kas').length
  const { slice: pageUsers, page, totalPages, onPage } = usePagination(filtered, 25)
  const selectedGroup = groupOptions.find((group) => group.id === draftGroupId) ?? null
  const hasChanges = editingUser != null && (
    draftRole !== editingUser.role ||
    (roleNeedsGroup(draftRole) && draftGroupId !== (editingUser.primaryGroupId ?? ''))
  )
  const saveDisabled = saving || !editingUser || !hasChanges || (roleNeedsGroup(draftRole) && !draftGroupId)

  return (
    <div className="px-5 space-y-4 pb-content-end-comfort">
      <section className="space-y-2 dl-stagger-card" style={{ animationDelay: '0ms' }}>
        <div className="relative">
          <MagnifyingGlass
            size={16}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Zoek gebruiker..."
            className="dl-input dl-input-surface text-[13px]"
            style={{
              borderWidth: 1,
              paddingLeft: 40,
            }}
          />
        </div>
        <p
          className="m-0 ml-0.5 text-[12px] font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {memberCount} {memberCount === 1 ? 'lid' : 'leden'} · {leidingKasCount} leiding &amp; kas
        </p>
      </section>

      {isLoading && (
        <section className="space-y-2">
          <AdminSectionLabel>Accounts</AdminSectionLabel>
          <SkeletonList rows={6} leading="avatar" trailing="action" />
        </section>
      )}

      {filtered.length > 0 && (
        <section className="space-y-2">
          <div className="dl-stagger-card" style={{ animationDelay: '80ms' }}>
            <AdminSectionLabel>Accounts</AdminSectionLabel>
          </div>
          <AdminSurface>
        {pageUsers.map((user, index) => {
          const roleVariant = ROLE_BADGE_VARIANT[user.role] ?? ROLE_BADGE_VARIANT.lid
          const isSelf = user.id === profile?.id

          return (
            <div
              key={user.id}
              className="px-3.5 py-3.5 dl-stagger-row"
              style={{
                background: isSelf ? 'var(--color-primary-pale)' : 'transparent',
                borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
                animationDelay: `${120 + index * 45}ms`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    avatarUrl={user.avatar_url}
                    size={38}
                    bg="var(--color-primary-pale)"
                    border="none"
                    iconColor="var(--color-primary)"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {user.full_name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant={roleVariant} size="sm">
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {getScopeLabel(user)}
                      </Badge>
                      {isSelf && (
                        <Badge variant="primary" size="sm">Jij</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <IconActionButton
                    type="button"
                    onClick={() => openEditor(user)}
                    variant="primary-soft"
                    aria-label={`Bewerk ${user.full_name}`}
                  >
                    <PencilSimple size={15} color="currentColor" />
                  </IconActionButton>
                </div>
              </div>
            </div>
          )
        })}
          </AdminSurface>
        </section>
      )}

      {!isLoading && filtered.length === 0 && (
        <AdminEmptyState
          icon={UsersIcon}
          title="Geen gebruikers gevonden"
          description="Pas je zoekterm aan om een gebruiker terug te vinden."
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />

      <AdminFormDrawer
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) closeEditor()
        }}
        title={editingUser ? editingUser.full_name : 'Gebruiker bewerken'}
        dismissible={!saving}
        disableClose={saving}
        bodyClassName="space-y-4"
        footer={
          <ActionPillButton
            type="button"
            onClick={() => void saveUser()}
            disabled={saveDisabled}
            variant="accent"
            size="md"
            className="w-full"
          >
            <Check size={14} weight="bold" />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </ActionPillButton>
        }
      >
        {editingUser && (
          <>
            <div className="rounded-card border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarUrl={editingUser.avatar_url}
                  size={46}
                  bg="var(--color-primary-pale)"
                  border="none"
                  iconColor="var(--color-primary)"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {editingUser.full_name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant={ROLE_BADGE_VARIANT[draftRole]} size="sm">
                      {getRoleLabel(draftRole)}
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      {getScopeLabel({
                        role: draftRole,
                        primaryGroupName: selectedGroup?.name ?? editingUser.primaryGroupName,
                      })}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={FIELD_LABEL_CLASS} style={{ color: 'var(--color-text-muted)' }}>
                Rol
              </label>
              <CustomSelect
                value={draftRole}
                onChange={(value) => setDraftRole(value as Role)}
                options={ROLES.map((role) => ({ value: role.value, label: role.label }))}
              />
            </div>

            {roleNeedsGroup(draftRole) && (
              <div className="space-y-1.5">
                <label className={FIELD_LABEL_CLASS} style={{ color: 'var(--color-text-muted)' }}>
                  Hoofdgroep
                </label>
                <CustomSelect
                  value={draftGroupId}
                  onChange={setDraftGroupId}
                  options={groupOptions.map((group) => ({ value: group.id, label: group.name }))}
                  placeholder="Kies een groep"
                />
              </div>
            )}

            <div
              className="rounded-card px-4 py-3"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[1px] m-0 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Effect
              </p>
              <p className="text-[12px] m-0 leading-[1.45]" style={{ color: 'var(--color-text-secondary)' }}>
                {getDrawerHint(draftRole, selectedGroup?.name ?? null)}
              </p>
            </div>
          </>
        )}
      </AdminFormDrawer>
    </div>
  )
}
