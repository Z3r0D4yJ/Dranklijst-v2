import { useState } from 'react'
import { X, Minus, Plus, ShoppingCart } from '@phosphor-icons/react'
import { Spinner } from './ui/spinner'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from './ui/drawer'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { GroupConsumptionItem } from '../hooks/useGroupConsumptions'
import { IconChip } from './IconChip'
import type { IconChipTone } from './IconChip'

interface Props {
  item: GroupConsumptionItem
  periodId: string
  onClose: () => void
  onSuccess: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  beer: 'Bier',
  wine: 'Wijn',
  soda: 'Frisdrank',
  water: 'Water',
  coffee: 'Koffie',
  'alcoholisch': 'Alcohol',
  'niet-alcoholisch': 'Frisdrank',
}

export function BuyModal({ item, periodId, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const total = (item.price * quantity).toFixed(2)

  async function handleBuy() {
    if (!user) return
    setLoading(true)

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      consumption_id: item.consumption_id,
      period_id: periodId,
      quantity,
      unit_price: item.price,
    })

    if (error) {
      toast.error('Er ging iets mis. Probeer opnieuw.')
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <Drawer open onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DrawerContent
        className="mx-auto w-full max-w-md rounded-t-[28px] px-5 pb-6"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="mb-6 flex items-start gap-3 pt-2">
          <IconChip tone={item.category as IconChipTone} size={48} />
          <div className="flex-1">
            <p
              className="text-[11px] font-bold uppercase tracking-[1px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {CATEGORY_LABELS[item.category] ?? item.category}
            </p>
            <DrawerTitle
              className="text-[22px] leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {item.name}
            </DrawerTitle>
            <DrawerDescription style={{ color: 'var(--color-text-muted)' }}>
              € {item.price.toFixed(2).replace('.', ',')} per stuk
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <button
              className="h-[34px] w-[34px] shrink-0 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
            >
              <X size={17} color="var(--color-text-muted)" />
            </button>
          </DrawerClose>
        </div>

        <div className="flex items-center justify-center gap-8 py-4">
          <button
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            className="h-[52px] w-[52px] rounded-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
            style={{ background: 'var(--color-surface-alt)' }}
          >
            <Minus size={22} color="var(--color-text-primary)" weight="bold" />
          </button>

          <span
            className="tabular-nums select-none"
            style={{
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: -2,
              color: 'var(--color-text-primary)',
              lineHeight: 1,
            }}
          >
            {quantity}
          </span>

          <button
            onClick={() => setQuantity((current) => Math.min(20, current + 1))}
            disabled={quantity >= 20}
            className="h-[52px] w-[52px] rounded-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
            style={{ background: 'var(--color-primary-pale)', border: '1px solid var(--color-primary-border)' }}
          >
            <Plus size={22} color="var(--color-primary)" weight="bold" />
          </button>
        </div>

        <div
          className="mt-3 mb-5 rounded-[14px] px-5 py-4 flex items-center justify-between"
          style={{ background: 'var(--color-surface-alt)' }}
        >
          <span className="text-[14px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            Totaal
          </span>
          <span
            className="text-[22px] font-extrabold tracking-[-0.5px] tabular-nums"
            style={{ color: 'var(--color-text-primary)' }}
          >
            € {Number(total).toFixed(2).replace('.', ',')}
          </span>
        </div>

        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            padding: '14px 16px',
            borderRadius: 14,
            boxShadow: 'var(--shadow-fab)',
          }}
        >
          {loading ? (
            <Spinner className="size-4 shrink-0" style={{ color: '#fff' }} />
          ) : (
            <ShoppingCart size={18} weight="bold" />
          )}
          {loading ? 'Bezig...' : `Kopen voor € ${Number(total).toFixed(2).replace('.', ',')}`}
        </button>
      </DrawerContent>
    </Drawer>
  )
}
