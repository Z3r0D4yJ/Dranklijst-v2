import { create } from 'zustand'

type CartStore = {
  items: Record<string, number>
  increment: (groupProductId: string) => void
  decrement: (groupProductId: string) => void
  clear: () => void
  totalItems: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  items: {},

  increment: (id) =>
    set((s) => ({ items: { ...s.items, [id]: (s.items[id] ?? 0) + 1 } })),

  decrement: (id) =>
    set((s) => {
      const current = s.items[id] ?? 0
      if (current <= 1) {
        const { [id]: _, ...rest } = s.items
        return { items: rest }
      }
      return { items: { ...s.items, [id]: current - 1 } }
    }),

  clear: () => set({ items: {} }),

  totalItems: () => Object.values(get().items).reduce((a, b) => a + b, 0),
}))
