import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type UserProfile = Database['public']['Tables']['users']['Row']

type AuthStore = {
  user: User | null
  profile: UserProfile | null
  isPinLocked: boolean
  setUser: (u: User | null) => void
  setProfile: (p: UserProfile | null) => void
  lockPin: () => void
  unlockPin: () => void
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  isPinLocked: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  lockPin: () => set({ isPinLocked: true }),
  unlockPin: () => set({ isPinLocked: false }),
}))
