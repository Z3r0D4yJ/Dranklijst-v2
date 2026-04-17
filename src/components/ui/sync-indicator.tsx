'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db } from '@/lib/db/schema'
import { WifiSlash, Warning, Clock } from '@phosphor-icons/react'

export function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const pending = useLiveQuery(
    () => db.consumptions.where('sync_status').anyOf(['pending', 'syncing']).count(),
    []
  )
  const failed = useLiveQuery(
    () => db.consumptions.where('sync_status').equals('failed').count(),
    []
  )

  if (isOnline && !pending && !failed) return null

  if (!isOnline) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
        <WifiSlash size={12} weight="fill" />
        Offline
      </span>
    )
  }

  if (failed && failed > 0) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
        <Warning size={12} weight="fill" />
        Sync fout
      </span>
    )
  }

  if (pending && pending > 0) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <Clock size={12} weight="fill" />
        {pending} wachten
      </span>
    )
  }

  return null
}
