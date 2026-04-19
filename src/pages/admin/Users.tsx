import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { User, MagnifyingGlass, CaretDown } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'

type Role = 'lid' | 'leiding' | 'groepsleiding' | 'kas' | 'admin'

interface UserRow {
  id: string
  full_name: string
  role: Role
  created_at: string
  groups: string[]
}

const ROLES: { value: Role; label: string }[] = [
  { value: 'lid',           label: 'Lid' },
  { value: 'leiding',       label: 'Leiding' },
  { value: 'groepsleiding', label: 'Groepsleiding' },
  { value: 'kas',           label: 'Kas' },
  { value: 'admin',         label: 'Admin' },
]

const ROLE_STYLE: Record<Role, { bg: string; text: string }> = {
  lid:           { bg: 'var(--color-surface-alt)',  text: 'var(--color-text-secondary)' },
  leiding:       { bg: 'var(--color-primary-pale)', text: 'var(--color-primary)' },
  groepsleiding: { bg: 'var(--color-success-bg)',   text: 'var(--color-success)' },
  kas:           { bg: 'var(--color-warning-bg)',   text: 'var(--color-warning)' },
  admin:         { bg: 'var(--color-danger-bg)',    text: 'var(--color-danger)' },
}

export function Users() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('full_name')

      const { data: memberships } = await supabase
        .from('group_members')
        .select('user_id, groups(name)')

      const memberMap: Record<string, string[]> = {}
      for (const m of (memberships ?? []) as unknown as Array<{ user_id: string; groups: { name: string } | null }>) {
        if (!memberMap[m.user_id]) memberMap[m.user_id] = []
        if (m.groups?.name) memberMap[m.user_id].push(m.groups.name)
      }

      return ((profiles ?? []) as unknown as Array<{ id: string; full_name: string; role: Role; created_at: string }>).map(p => ({
        ...p,
        groups: memberMap[p.id] ?? [],
      })) as UserRow[]
    },
  })

  async function changeRole(userId: string, newRole: Role) {
    setUpdatingId(userId)
    setOpenDropdown(null)
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    setUpdatingId(null)
  }

  const filtered = (users ?? []).filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  )

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
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek gebruiker…"
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
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(u => {
          const style = ROLE_STYLE[u.role] ?? ROLE_STYLE.lid
          const isUpdating = updatingId === u.id
          const isOpen = openDropdown === u.id

          return (
            <div
              key={u.id}
              className="rounded-[14px] p-3.5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary-pale)' }}>
                    <User size={16} color="var(--color-primary)" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>{u.full_name}</p>
                    {u.groups.length > 0 && (
                      <p className="text-[11px] m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{u.groups.join(', ')}</p>
                    )}
                  </div>
                </div>

                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : u.id)}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-opacity disabled:opacity-50"
                    style={{ background: style.bg, color: style.text, border: 'none', fontFamily: 'inherit' }}
                  >
                    {isUpdating ? '…' : ROLES.find(r => r.value === u.role)?.label ?? u.role}
                    {!isUpdating && <CaretDown size={11} />}
                  </button>

                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                      <div
                        className="absolute right-0 top-full mt-1 z-20 min-w-[140px] overflow-hidden"
                        style={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border-mid)',
                          borderRadius: 12,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                        }}
                      >
                        {ROLES.map(r => (
                          <button
                            key={r.value}
                            onClick={() => changeRole(u.id, r.value)}
                            className="w-full text-left px-4 py-2.5 text-[13px] transition-colors"
                            style={{
                              fontWeight: r.value === u.role ? 700 : 500,
                              color: r.value === u.role ? 'var(--color-primary)' : 'var(--color-text-primary)',
                              background: 'transparent',
                              border: 'none',
                              fontFamily: 'inherit',
                            }}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-[14px] px-4 py-8 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-[13px] m-0" style={{ color: 'var(--color-text-muted)' }}>Geen gebruikers gevonden.</p>
        </div>
      )}
    </div>
  )
}
