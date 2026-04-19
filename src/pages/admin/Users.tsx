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

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  lid:           { bg: 'bg-[#F8FAFC] dark:bg-[#334155]',  text: 'text-[#64748B] dark:text-[#94A3B8]' },
  leiding:       { bg: 'bg-[#EFF6FF] dark:bg-[#1E3A8A]',  text: 'text-[#2563EB]' },
  groepsleiding: { bg: 'bg-[#F0FDF4] dark:bg-[#064E3B]',  text: 'text-[#16A34A]' },
  kas:           { bg: 'bg-[#FFFBEB] dark:bg-[#44250A]',  text: 'text-[#D97706]' },
  admin:         { bg: 'bg-[#FEF2F2] dark:bg-[#450A0A]',  text: 'text-[#DC2626]' },
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
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    setUpdatingId(null)
  }

  const filtered = (users ?? []).filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 space-y-4">
      <div className="relative">
        <MagnifyingGlass size={16} color="#94A3B8" className="absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek gebruiker…"
          className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-primary"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(u => {
          const colors = ROLE_COLORS[u.role] ?? ROLE_COLORS.lid
          const isUpdating = updatingId === u.id
          const isOpen = openDropdown === u.id

          return (
            <div key={u.id} className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-full flex items-center justify-center shrink-0">
                    <User size={16} color="#2563EB" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">{u.full_name}</p>
                    {u.groups.length > 0 && (
                      <p className="text-xs text-[#94A3B8] truncate">{u.groups.join(', ')}</p>
                    )}
                  </div>
                </div>

                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : u.id)}
                    disabled={isUpdating}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50 ${colors.bg} ${colors.text}`}
                  >
                    {isUpdating ? '…' : ROLES.find(r => r.value === u.role)?.label ?? u.role}
                    {!isUpdating && <CaretDown size={11} />}
                  </button>

                  {isOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenDropdown(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl shadow-lg z-20 min-w-[140px] overflow-hidden">
                        {ROLES.map(r => (
                          <button
                            key={r.value}
                            onClick={() => changeRole(u.id, r.value)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors ${r.value === u.role ? 'font-semibold text-primary' : 'text-[#0F172A] dark:text-[#F1F5F9]'}`}
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
        <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] px-4 py-8 text-center">
          <p className="text-sm text-[#94A3B8]">Geen gebruikers gevonden.</p>
        </div>
      )}
    </div>
  )
}
