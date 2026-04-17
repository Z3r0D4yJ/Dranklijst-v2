import { create } from 'zustand'

export type Toast = {
  id: string
  message: string
  action?: { label: string; onClick: () => void }
  duration: number
}

type ToastStore = {
  toasts: Toast[]
  show: (t: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],

  show: (t) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { ...t, id, duration: t.duration ?? 5000 }] }))
    return id
  },

  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
