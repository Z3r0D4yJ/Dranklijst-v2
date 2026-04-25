import { getDb, type OutboxEntry, type TransactionPayload } from './db'

type Listener = () => void
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach(l => l())
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export async function enqueueTransaction(payload: TransactionPayload): Promise<OutboxEntry> {
  const entry: OutboxEntry = {
    id: generateId(),
    kind: 'transaction',
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
    status: 'pending',
    rejectedAt: null,
  }
  const db = await getDb()
  await db.put('outbox', entry)
  emit()
  return entry
}

export async function getAll(): Promise<OutboxEntry[]> {
  const db = await getDb()
  const all = await db.getAll('outbox')
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function getPending(): Promise<OutboxEntry[]> {
  const all = await getAll()
  return all.filter(e => e.status === 'pending')
}

export async function getRejected(): Promise<OutboxEntry[]> {
  const all = await getAll()
  return all.filter(e => e.status === 'rejected')
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('outbox', id)
  emit()
}

export async function markRejected(id: string, error: string): Promise<void> {
  const db = await getDb()
  const entry = await db.get('outbox', id)
  if (!entry) return
  entry.status = 'rejected'
  entry.lastError = error
  entry.rejectedAt = new Date().toISOString()
  await db.put('outbox', entry)
  emit()
}

export async function incrementAttempts(id: string, error: string): Promise<void> {
  const db = await getDb()
  const entry = await db.get('outbox', id)
  if (!entry) return
  entry.attempts += 1
  entry.lastError = error
  await db.put('outbox', entry)
  emit()
}

export async function retry(id: string): Promise<void> {
  const db = await getDb()
  const entry = await db.get('outbox', id)
  if (!entry) return
  entry.status = 'pending'
  entry.lastError = null
  entry.rejectedAt = null
  entry.attempts = 0
  await db.put('outbox', entry)
  emit()
}

export async function remove(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('outbox', id)
  emit()
}
