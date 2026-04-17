'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import { Warning } from '@phosphor-icons/react'

export function ExpiredItemsBanner() {
  const expiredCount = useLiveQuery(
    () => db.consumptions.where('sync_status').equals('expired').count(),
    []
  )

  if (!expiredCount) return null

  async function handleDelete() {
    await db.consumptions.where('sync_status').equals('expired').delete()
  }

  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3">
      <Warning size={18} weight="fill" className="mt-0.5 shrink-0 text-amber-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-900">
          {expiredCount} {expiredCount === 1 ? 'registratie verlopen' : 'registraties verlopen'}
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          Kon meer dan 7 dagen niet synchroniseren en wordt niet meer opgeslagen.
        </p>
      </div>
      <button
        onClick={handleDelete}
        className="shrink-0 rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 active:bg-amber-200"
      >
        Verwijder
      </button>
    </div>
  )
}
