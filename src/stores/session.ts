import { create } from 'zustand'

export type GroupProduct = {
  id: string
  productId: string
  name: string
  icon: string
  price: number
  sortOrder: number
}

export type ActivePeriod = {
  id: string
  name: string
  startedAt: string
}

type SessionStore = {
  groupProducts: GroupProduct[]
  activePeriod: ActivePeriod | null
  isLoading: boolean
  setGroupProducts: (products: GroupProduct[]) => void
  setActivePeriod: (period: ActivePeriod | null) => void
  setLoading: (v: boolean) => void
  reset: () => void
}

export const useSession = create<SessionStore>((set) => ({
  groupProducts: [],
  activePeriod: null,
  isLoading: false,
  setGroupProducts: (groupProducts) => set({ groupProducts }),
  setActivePeriod: (activePeriod) => set({ activePeriod }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ groupProducts: [], activePeriod: null, isLoading: false }),
}))
