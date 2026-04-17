'use client'

import {
  BeerStein, Coffee, Drop, Orange, Leaf,
  Wine, Champagne, Martini,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useCart } from '@/stores/cart'
import { haptic } from '@/lib/utils/haptic'
import type { GroupProduct } from '@/stores/session'

const ICON_MAP: Record<string, Icon> = {
  Beer: BeerStein,
  BeerStein, Coffee, Drop, Orange, Leaf,
  Wine, Champagne, Martini,
}

function ProductIcon({ name, size = 22 }: { name: string; size?: number }) {
  const IconComp = ICON_MAP[name] ?? Drop
  return <IconComp size={size} weight="regular" />
}

export function ProductRow({ product }: { product: GroupProduct }) {
  const quantity = useCart((s) => s.items[product.id] ?? 0)
  const increment = useCart((s) => s.increment)
  const decrement = useCart((s) => s.decrement)
  const active = quantity > 0

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-all duration-150 ${
        active
          ? 'border-brand/20 bg-brand-light'
          : 'border-zinc-100 bg-white'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
          active ? 'bg-brand text-white' : 'bg-zinc-100 text-zinc-500'
        }`}
      >
        <ProductIcon name={product.icon} size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900">{product.name}</p>
        <p className={`text-xs font-medium ${active ? 'text-brand' : 'text-zinc-400'}`}>
          € {product.price.toFixed(2)}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => { haptic('light'); decrement(product.id) }}
          disabled={quantity === 0}
          aria-label={`Minder ${product.name}`}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-lg font-semibold text-zinc-600 transition-colors disabled:opacity-30 active:bg-zinc-100"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-bold tabular-nums text-zinc-900">
          {quantity > 0 ? quantity : ''}
        </span>
        <button
          onClick={() => { haptic('light'); increment(product.id) }}
          aria-label={`Meer ${product.name}`}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-brand text-lg font-semibold text-white transition-colors active:bg-brand-dark"
        >
          +
        </button>
      </div>
    </div>
  )
}
