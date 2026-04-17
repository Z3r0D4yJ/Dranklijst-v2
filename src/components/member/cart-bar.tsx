'use client'

import { useCart } from '@/stores/cart'
import { useSession } from '@/stores/session'
import { useAuth } from '@/stores/auth'
import { useToast } from '@/stores/toast'
import { registerConsumption, undoConsumptionGroup } from '@/lib/consumptions/register'
import { haptic } from '@/lib/utils/haptic'

export function CartBar() {
  const items = useCart((s) => s.items)
  const clear = useCart((s) => s.clear)
  const totalItems = useCart((s) => s.totalItems)
  const { groupProducts, activePeriod } = useSession()
  const profile = useAuth((s) => s.profile)
  const toast = useToast()

  const count = totalItems()
  if (count === 0) return null

  const totalPrice = Object.entries(items).reduce((sum, [id, qty]) => {
    const product = groupProducts.find((p) => p.id === id)
    return sum + (product?.price ?? 0) * qty
  }, 0)

  async function handleConfirm() {
    if (!profile?.group_id || !activePeriod) return

    haptic('medium')
    const localUuids: string[] = []

    for (const [groupProductId, quantity] of Object.entries(items)) {
      if (quantity <= 0) continue
      const product = groupProducts.find((p) => p.id === groupProductId)
      if (!product) continue

      const uuid = await registerConsumption({
        userId: profile.id,
        groupId: profile.group_id,
        groupProductId,
        periodId: activePeriod.id,
        quantity,
        unitPrice: product.price,
      })
      localUuids.push(uuid)
    }

    clear()

    const label = count === 1 ? 'item' : 'items'
    toast.show({
      message: `${count} ${label} geregistreerd — € ${totalPrice.toFixed(2)}`,
      action: {
        label: 'Ongedaan maken',
        onClick: () => {
          haptic('heavy')
          undoConsumptionGroup(localUuids)
        },
      },
      duration: 5000,
    })
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-2">
      <button
        onClick={handleConfirm}
        className="flex w-full cursor-pointer items-center justify-between rounded-2xl bg-brand px-5 py-4 text-white shadow-lg shadow-brand/25 transition-colors active:bg-brand-dark"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-sm font-bold">
          {count}
        </span>
        <span className="text-base font-semibold">Bevestigen</span>
        <span className="text-base font-semibold">€ {totalPrice.toFixed(2)}</span>
      </button>
    </div>
  )
}
