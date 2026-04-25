import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from './supabase'
import { getPending, incrementAttempts, markRejected, markSynced } from './outbox'

const MAX_ATTEMPTS = 5
const HARD_FAIL_CODES = new Set([
  '23503', // foreign_key_violation (period/group/consumption gone)
  '23505', // unique_violation
  '23514', // check_violation
  '42501', // RLS policy denied
  'PGRST301', // RLS / not found via PostgREST
])

const HARD_FAIL_MESSAGES: Record<string, string> = {
  '23503': 'Periode, groep of drankje bestaat niet meer',
  '23505': 'Transactie is al verwerkt',
  '23514': 'Ongeldige waarde',
  '42501': 'Geen rechten meer',
  'PGRST301': 'Niet meer toegestaan door de server',
}

let syncing = false
const syncListeners = new Set<(s: boolean) => void>()

export function subscribeSyncing(listener: (s: boolean) => void): () => void {
  syncListeners.add(listener)
  return () => { syncListeners.delete(listener) }
}

function setSyncing(value: boolean) {
  syncing = value
  syncListeners.forEach(l => l(value))
}

export function isSyncing(): boolean {
  return syncing
}

export async function processOutbox(queryClient: QueryClient): Promise<void> {
  if (syncing) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  const pending = await getPending()
  if (pending.length === 0) return

  setSyncing(true)
  let synced = 0
  let rejected = 0

  try {
    for (const entry of pending) {
      if (entry.attempts >= MAX_ATTEMPTS) continue

      try {
        const { error } = await supabase.from('transactions').insert({
          user_id: entry.payload.user_id,
          consumption_id: entry.payload.consumption_id,
          period_id: entry.payload.period_id,
          group_id: entry.payload.group_id,
          quantity: entry.payload.quantity,
          unit_price: entry.payload.unit_price,
        })

        if (error) {
          const code = (error as { code?: string }).code
          if (code && HARD_FAIL_CODES.has(code)) {
            await markRejected(entry.id, HARD_FAIL_MESSAGES[code] ?? error.message)
            rejected += 1
          } else {
            await incrementAttempts(entry.id, error.message)
            break
          }
        } else {
          await markSynced(entry.id)
          synced += 1
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Onbekende fout'
        await incrementAttempts(entry.id, message)
        break
      }
    }

    if (synced > 0 || rejected > 0) {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    }

    if (synced > 0 && rejected === 0) {
      toast.success(
        synced === 1
          ? '1 transactie gesynchroniseerd'
          : `${synced} transacties gesynchroniseerd`
      )
    }
  } finally {
    setSyncing(false)
  }
}

let started = false

export function startSyncEngine(queryClient: QueryClient): void {
  if (started) return
  started = true

  const trigger = () => { void processOutbox(queryClient) }

  window.addEventListener('online', trigger)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') trigger()
  })

  trigger()
}
