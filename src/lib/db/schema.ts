import Dexie, { type Table } from 'dexie'

export interface LocalConsumption {
  id?: number
  local_uuid: string
  user_id: string
  group_id: string
  group_product_id: string
  period_id: string
  quantity: number
  unit_price: number
  registered_at: string
  deleted_at: string | null
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed' | 'expired'
  sync_attempts: number
  last_sync_attempt: string | null
  sync_error: string | null
  server_id: string | null
}

export interface CachedProduct {
  id: string
  product_id: string
  name: string
  icon: string
  price: number
  sort_order: number
  cached_at: string
}

export interface CachedLeaderboardEntry {
  user_id: string
  period_id: string
  display_name: string
  total_quantity: number
  total_amount: number
  cached_at: string
}

export interface CachedMeta {
  key: string
  value: string
}

class DranklijstDB extends Dexie {
  consumptions!: Table<LocalConsumption, number>
  products!: Table<CachedProduct, string>
  leaderboard!: Table<CachedLeaderboardEntry, [string, string]>
  meta!: Table<CachedMeta, string>

  constructor() {
    super('dranklijst')
    this.version(1).stores({
      consumptions: '++id, local_uuid, user_id, period_id, sync_status, registered_at',
      products: 'id, sort_order',
      leaderboard: '[user_id+period_id], period_id, total_amount',
    })
    this.version(2).stores({
      meta: 'key',
    })
  }
}

export const db = new DranklijstDB()
