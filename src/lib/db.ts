import { openDB, type IDBPDatabase } from 'idb'

export interface OutboxEntry {
  id: string
  kind: 'transaction'
  payload: TransactionPayload
  createdAt: string
  attempts: number
  lastError: string | null
  status: 'pending' | 'rejected'
  rejectedAt: string | null
}

export interface TransactionPayload {
  user_id: string
  consumption_id: string
  period_id: string
  group_id: string
  quantity: number
  unit_price: number
  consumption_name: string
  category: string | null
  icon: string | null
  color: string | null
}

interface OfflineDBSchema {
  outbox: OutboxEntry
  'query-cache': { key: string; value: unknown }
}

const DB_NAME = 'dranklijst-offline'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null

export function getDb(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('query-cache')) {
          db.createObjectStore('query-cache', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
  try {
    const already = await navigator.storage.persisted?.()
    if (already) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function kvGet(key: string): Promise<unknown | undefined> {
  const db = await getDb()
  const entry = await db.get('query-cache', key)
  return (entry as { key: string; value: unknown } | undefined)?.value
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await getDb()
  await db.put('query-cache', { key, value })
}

export async function kvDel(key: string): Promise<void> {
  const db = await getDb()
  await db.delete('query-cache', key)
}
