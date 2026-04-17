'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db } from '@/lib/db/schema'
import { WifiSlash, CloudArrowUp, Warning } from '@phosphor-icons/react'

export function SyncBanner() {
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

  if (!isOnline && pending && pending > 0) {
    return (
      <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2 text-sm text-white">
        <WifiSlash size={15} weight="fill" className="shrink-0" />
        <span>
          Geen verbinding —{' '}
          <strong>
            {pending} {pending === 1 ? 'registratie wordt' : 'registraties worden'} bewaard
          </strong>{' '}
          en gesynchroniseerd zodra je terug online bent.
        </span>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2 text-sm text-white">
        <WifiSlash size={15} weight="fill" className="shrink-0" />
        <span>Geen verbinding — registraties worden lokaal bewaard.</span>
      </div>
    )
  }

  if (failed && failed > 0) {
    return (
      <div className="flex items-center gap-2 bg-rose-600 px-4 py-2 text-sm text-white">
        <Warning size={15} weight="fill" className="shrink-0" />
        <span>
          <strong>{failed} {failed === 1 ? 'registratie' : 'registraties'}</strong> kon niet gesynchroniseerd worden. Wordt automatisch opnieuw geprobeerd.
        </span>
      </div>
    )
  }

  if (pending && pending > 0) {
    return (
      <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-sm text-white">
        <CloudArrowUp size={15} weight="fill" className="shrink-0" />
        <span>
          <strong>
            {pending} {pending === 1 ? 'registratie' : 'registraties'} in wacht
          </strong>{' '}
          — wordt gesynchroniseerd op de achtergrond.
        </span>
      </div>
    )
  }

  return null
}
