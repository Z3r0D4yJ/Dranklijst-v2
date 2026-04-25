import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAll, subscribe } from '../lib/outbox'
import type { OutboxEntry } from '../lib/db'
import { isSyncing, processOutbox, subscribeSyncing } from '../lib/sync-engine'

export function useOutbox() {
  const queryClient = useQueryClient()
  const [entries, setEntries] = useState<OutboxEntry[]>([])
  const [syncing, setSyncing] = useState<boolean>(isSyncing())

  useEffect(() => {
    let mounted = true
    const refresh = () => {
      getAll().then(list => { if (mounted) setEntries(list) })
    }
    refresh()
    const unsub = subscribe(refresh)
    const unsubSync = subscribeSyncing(setSyncing)
    return () => {
      mounted = false
      unsub()
      unsubSync()
    }
  }, [])

  const pending = entries.filter(e => e.status === 'pending')
  const rejected = entries.filter(e => e.status === 'rejected')

  return {
    entries,
    pending,
    rejected,
    syncing,
    syncNow: () => processOutbox(queryClient),
  }
}
