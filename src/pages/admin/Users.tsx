import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Spinner } from '../../components/ui/spinner'
import { Badge } from '../../components/ui/badge'
import { supabase } from '../../lib/supabase'
import { UserAvatar } from '../../components/UserAvatar'
import { Pagination } from '../../components/Pagination'
import { CustomSelect } from '../../components/CustomSelect'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
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
  { value: 'groepsleiding', label: 'Groepsleiding' },
]


const FIELD_LABEL_CLASS = 'text-[11px] font-extrabold uppercase tracking-[1px]'
const ACTION_ICON_BUTTON_CLASS = 'w-9 h-9 rounded-[11px] flex items-center justify-center active:scale-95 transition-transform'

function normalizeRole(role: string | null | undefined): Role {
  if (role === 'lid' || role === 'leiding' || role === 'kas' || role === 'groepsleiding') {
    return role
  }

  if (role === 'admin') return 'kas'
  return 'lid'
}

function roleNeedsGroup(role: Role) {
  return role === 'lid' || role === 'leiding' || role === 'kas'
}

function getRoleLabel(role: Role) {
  return ROLES.find((item) => item.value === role)?.label ?? role
}

function getRoleSubtitle(user: Pick<UserRow, 'role' | 'primaryGroupName'>) {
  if (user.role === 'leiding') {
    return user.primaryGroupName ? `Leiding van ${user.primaryGroupName}` : 'Leiding zonder hoofdgroep'
  }

  if (user.role === 'kas') {
    return user.primaryGroupName ? `Kas en leiding van ${user.primaryGroupName}` : 'Kas zonder hoofdgroep'
  }

  if (user.role === 'groepsleiding') {
    return 'Toegang tot alle groepen'
  }

  return user.primaryGroupName ? `Groep: ${user.primaryGroupName}` : 'Nog geen hoofdgroep'
}

function getDrawerHint(role: Role, groupName: string | null) {
  if (role === 'leiding') {
    return groupName
      ? `${groupName} wordt de hoofdgroep. Deze gebruiker wordt daarnaast automatisch ook aan Leiding gekoppeld.`
      : 'Kies eerst een hoofdgroep. Daarna wordt Leiding automatisch extra gekoppeld.'
  }

  if (role === 'kas') {
    return groupName
      ? `${groupName} wordt de hoofdgroep. Deze gebruiker krijgt kasrechten en wordt daarnaast ook als leiding aan ${groupName} en Leiding gekoppeld.`
      : 'Een kas-gebruiker heeft ook een hoofdgroep nodig en wordt daarnaast automatisch aan Leiding gekoppeld.'
  }

  if (role === 'groepsleiding') {
    return 'Groepsleiding krijgt toegang tot alle groepen en heeft geen vaste hoofdgroep nodig.'
  }

  return groupName
    ? `${groupName} wordt de enige hoofdgroep van deze gebruiker.`
    : 'Een lid moet exact een hoofdgroep hebben.'
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
  const { slice: pageUsers, page, totalPages, onPage } = usePagination(filtered, 25)
  const selectedGroup = groupOptions.find((group) => group.id === draftGroupId) ?? null
  const hasChanges = editingUser != null && (
    draftRole !== editingUser.role ||
    (roleNeedsGroup(draftRole) && draftGroupId !== (editingUser.primaryGroupId ?? ''))
  )
  const saveDisabled = saving || !editingUser || !hasChanges || (roleNeedsGroup(draftRole) && !draftGroupId)

  return (
    <div className="px-4 space-y-4">
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
          className="w-full outline-none text-[13px]"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-mid)',
            borderRadius: 12,
            padding: '10px 14px 10px 40px',
            color: 'var(--color-text-primary)',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center mt-8">
          <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      <div className="space-y-2">
        {pageUsers.map((user) => {
          const roleVariant = ROLE_BADGE_VARIANT[user.role] ?? ROLE_BADGE_VARIANT.lid

          return (
            <div
              key={user.id}
              className="rounded-[14px] p-3.5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
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
                    <p className="text-[13px] font-semibold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {user.full_name}
                    </p>
                    <p className="text-[11px] m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {getRoleSubtitle(user)}
                    </p>
                    {user.groups.length > 1 && (
                      <p className="text-[11px] m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                        Lidmaatschappen: {user.groups.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={roleVariant}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => openEditor(user)}
                    className={ACTION_ICON_BUTTON_CLASS}
                    style={{
                      background: 'var(--color-primary-pale)',
                      border: '1px solid var(--color-primary-border)',
                    }}
                    aria-label={`Bewerk ${user.full_name}`}
                  >
                    <PencilSimple size={15} color="var(--color-primary)" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div
          className="rounded-[14px] px-4 py-8 text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-[13px] m-0" style={{ color: 'var(--color-text-muted)' }}>
            Geen gebruikers gevonden.
          </p>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />

      <AdminFormDrawer
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) closeEditor()
        }}
        title={editingUser ? editingUser.full_name : 'Gebruiker bewerken'}
        description="Pas rol en hoofdgroep aan vanuit dezelfde beheerflow."
        dismissible={!saving}
        disableClose={saving}
        scrollBody={false}
        bodyClassName="space-y-4"
        footer={
          <button
            type="button"
            onClick={() => void saveUser()}
            disabled={saveDisabled}
            className="w-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              fontFamily: 'inherit',
            }}
          >
            <Check size={14} weight="bold" />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        }
      >
        {editingUser && (
          <>
            <div
              className="rounded-[14px] p-4 flex items-center gap-3"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <UserAvatar
                avatarUrl={editingUser.avatar_url}
                size={46}
                bg="var(--color-primary-pale)"
                border="none"
                iconColor="var(--color-primary)"
              />
              <div className="min-w-0">
                <p className="text-[14px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {editingUser.full_name}
                </p>
                <p className="text-[12px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {getRoleLabel(draftRole)}
                  {roleNeedsGroup(draftRole) && selectedGroup ? ` - ${selectedGroup.name}` : ''}
                </p>
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
              className="rounded-[14px] px-4 py-3"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[1px] m-0 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Wat gebeurt er
              </p>
              <p className="text-[13px] m-0 leading-[1.55]" style={{ color: 'var(--color-text-secondary)' }}>
                {getDrawerHint(draftRole, selectedGroup?.name ?? null)}
              </p>
            </div>
          </>
        )}
      </AdminFormDrawer>
    </div>
  )
}
