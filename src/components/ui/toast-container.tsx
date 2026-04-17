'use client'

import { useEffect } from 'react'
import { useToast, type Toast } from '@/stores/toast'
import { X } from '@phosphor-icons/react'

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToast((s) => s.dismiss)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, dismiss])

  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-white shadow-lg">
      <p className="flex-1 text-sm">{toast.message}</p>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick()
            dismiss(toast.id)
          }}
          className="shrink-0 text-sm font-medium text-amber-400 hover:text-amber-300"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Sluiten"
        className="shrink-0 text-zinc-400 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToast((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col gap-2 px-4 pb-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
