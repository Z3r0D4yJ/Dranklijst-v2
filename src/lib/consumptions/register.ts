import { db } from '@/lib/db/schema'
import { triggerSync } from '@/lib/sync/queue'

export async function registerConsumption(params: {
  userId: string
  groupId: string
  groupProductId: string
  periodId: string
  quantity: number
  unitPrice: number
}): Promise<string> {
  const localUuid = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.consumptions.add({
    local_uuid: localUuid,
    user_id: params.userId,
    group_id: params.groupId,
    group_product_id: params.groupProductId,
    period_id: params.periodId,
    quantity: params.quantity,
    unit_price: params.unitPrice,
    registered_at: now,
    deleted_at: null,
    sync_status: 'pending',
    sync_attempts: 0,
    last_sync_attempt: null,
    sync_error: null,
    server_id: null,
  })

  if (navigator.vibrate) navigator.vibrate(10)

  void triggerSync()

  return localUuid
}

export async function undoConsumptionGroup(localUuids: string[]) {
  const now = new Date().toISOString()
  await db.transaction('rw', db.consumptions, async () => {
    for (const uuid of localUuids) {
      await db.consumptions
        .where('local_uuid')
        .equals(uuid)
        .modify({ deleted_at: now, sync_status: 'pending' })
    }
  })
  void triggerSync()
}
