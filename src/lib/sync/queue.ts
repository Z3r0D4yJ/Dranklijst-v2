import { db } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/client'

let syncInFlight = false

export async function triggerSync() {
  if (syncInFlight) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  syncInFlight = true
  try {
    await processPendingConsumptions()
    await processPendingDeletions()
  } finally {
    syncInFlight = false
  }
}

async function isPeriodClosed(periodId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('periods')
    .select('status')
    .eq('id', periodId)
    .single()
  return data?.status === 'closed'
}

async function processPendingConsumptions() {
  const supabase = createClient()
  const pending = await db.consumptions
    .where('sync_status')
    .anyOf(['pending', 'failed'])
    .toArray()

  for (const item of pending) {
    if (item.deleted_at) continue // verwerkt door deletions pass

    const ageMs = Date.now() - new Date(item.registered_at).getTime()
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    if (ageMs > SEVEN_DAYS) {
      await db.consumptions.update(item.id!, { sync_status: 'expired' })
      continue
    }

    if (item.last_sync_attempt && item.sync_attempts > 0) {
      const backoffMs = Math.min(1000 * Math.pow(2, item.sync_attempts), 60_000)
      const sinceLastAttempt = Date.now() - new Date(item.last_sync_attempt).getTime()
      if (sinceLastAttempt < backoffMs) continue
    }

    await db.consumptions.update(item.id!, {
      sync_status: 'syncing',
      last_sync_attempt: new Date().toISOString(),
    })

    try {
      const isLate = await isPeriodClosed(item.period_id)
      const { data, error } = await supabase
        .from('consumptions')
        .insert({
          local_uuid: item.local_uuid,
          user_id: item.user_id,
          group_id: item.group_id,
          group_product_id: item.group_product_id,
          period_id: item.period_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          registered_at: item.registered_at,
          is_late_sync: isLate,
        })
        .select('id')
        .single()

      if (error) {
        if (error.code === '23505') {
          // Unieke constraint: item staat al op server
          await db.consumptions.update(item.id!, { sync_status: 'synced' })
          continue
        }
        throw error
      }

      await db.consumptions.update(item.id!, {
        sync_status: 'synced',
        server_id: data.id,
        sync_error: null,
      })
    } catch (err) {
      await db.consumptions.update(item.id!, {
        sync_status: 'failed',
        sync_attempts: item.sync_attempts + 1,
        sync_error: err instanceof Error ? err.message : String(err),
      })
    }
  }
}

async function processPendingDeletions() {
  const supabase = createClient()
  const deletions = await db.consumptions
    .where('sync_status')
    .anyOf(['pending', 'failed'])
    .and((item) => item.deleted_at !== null && item.server_id !== null)
    .toArray()

  for (const item of deletions) {
    await db.consumptions.update(item.id!, {
      sync_status: 'syncing',
      last_sync_attempt: new Date().toISOString(),
    })

    try {
      const { error } = await supabase
        .from('consumptions')
        .update({ deleted_at: item.deleted_at })
        .eq('id', item.server_id!)
        .eq('user_id', item.user_id)

      if (error) throw error

      await db.consumptions.update(item.id!, {
        sync_status: 'synced',
        sync_error: null,
      })
    } catch (err) {
      await db.consumptions.update(item.id!, {
        sync_status: 'failed',
        sync_attempts: item.sync_attempts + 1,
        sync_error: err instanceof Error ? err.message : String(err),
      })
    }
  }
}
