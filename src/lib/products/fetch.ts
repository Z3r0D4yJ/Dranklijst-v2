import { createClient } from '@/lib/supabase/client'
import { db } from '@/lib/db/schema'
import type { GroupProduct, ActivePeriod } from '@/stores/session'

const META_KEY_PERIOD = 'activePeriod'

export async function fetchGroupProducts(groupId: string): Promise<GroupProduct[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('group_products')
      .select('id, price, sort_order, product_id, product:products(name, icon)')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    if (!data) return []

    const products: GroupProduct[] = data.map((row) => {
      const product = Array.isArray(row.product) ? row.product[0] : row.product
      return {
        id: row.id,
        productId: row.product_id,
        name: product?.name ?? '',
        icon: product?.icon ?? '',
        price: Number(row.price),
        sortOrder: row.sort_order,
      }
    })

    // cache in Dexie voor offline gebruik
    await db.products.bulkPut(
      products.map((p) => ({
        id: p.id,
        product_id: p.productId,
        name: p.name,
        icon: p.icon,
        price: p.price,
        sort_order: p.sortOrder,
        cached_at: new Date().toISOString(),
      }))
    )

    return products
  } catch {
    // offline of server fout — lees uit Dexie cache
    const cached = await db.products.orderBy('sort_order').toArray()
    return cached.map((p) => ({
      id: p.id,
      productId: p.product_id,
      name: p.name,
      icon: p.icon,
      price: p.price,
      sortOrder: p.sort_order,
    }))
  }
}

export async function fetchActivePeriod(groupId: string): Promise<ActivePeriod | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('periods')
      .select('id, name, started_at')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        await db.meta.delete(META_KEY_PERIOD)
        return null
      }
      throw error
    }

    const period: ActivePeriod | null = data
      ? { id: data.id, name: data.name, startedAt: data.started_at }
      : null

    if (period) {
      await db.meta.put({ key: META_KEY_PERIOD, value: JSON.stringify(period) })
    } else {
      await db.meta.delete(META_KEY_PERIOD)
    }

    return period
  } catch {
    // offline of server fout — lees uit Dexie cache
    const cached = await db.meta.get(META_KEY_PERIOD)
    if (!cached) return null
    try {
      return JSON.parse(cached.value) as ActivePeriod
    } catch {
      return null
    }
  }
}
