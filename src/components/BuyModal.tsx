import { useState } from 'react'
import { X, Minus, Plus, ShoppingCart, CloudSlash } from '@phosphor-icons/react'
import { Spinner } from './ui/spinner'
import { ActionPillButton, IconActionButton } from './ui/action-button'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from './ui/drawer'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { enqueueTransaction } from '../lib/outbox'
import { useAuth } from '../context/AuthContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import type { GroupConsumptionItem } from '../hooks/useGroupConsumptions'
import { IconChip } from './IconChip'
import type { IconChipTone } from './IconChip'

interface Props {
  item: GroupConsumptionItem
  periodId: string
  groupId: string
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

export function BuyModal({ item, periodId, groupId, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const online = useOnlineStatus()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const total = (item.price * quantity).toFixed(2)

  async function handleBuy() {
    if (!user) return
    setLoading(true)

    const payload = {
      user_id: user.id,
      consumption_id: item.consumption_id,
      period_id: periodId,
      group_id: groupId,
      quantity,
      unit_price: item.price,
      consumption_name: item.name,
      category: item.category ?? null,
      icon: item.icon ?? null,
      color: item.color ?? null,
    }

    if (!online) {
      try {
        await enqueueTransaction(payload)
        onSuccess()
      } catch {
        toast.error('Kon niet opslaan voor sync. Probeer opnieuw.')
        setLoading(false)
      }
      return
    }

    const { error } = await supabase.from('transactions').insert({
      user_id: payload.user_id,
      consumption_id: payload.consumption_id,
      period_id: payload.period_id,
      group_id: payload.group_id,
      quantity: payload.quantity,
      unit_price: payload.unit_price,
    })

    if (error) {
      try {
        await enqueueTransaction(payload)
        toast.message('Geen verbinding — wacht op sync')
        onSuccess()
      } catch {
        toast.error('Er ging iets mis. Probeer opnieuw.')
        setLoading(false)
      }
      return
    }

    onSuccess()
  }

  return (
    <Drawer open onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DrawerContent
        className="mx-auto w-full max-w-md rounded-t-[24px] px-5 pb-6"
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
            <IconActionButton aria-label="Sluiten">
              <X size={17} color="currentColor" />
            </IconActionButton>
          </DrawerClose>
        </div>

        <div className="flex items-center justify-center gap-8 py-4">
          <button
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            className="h-[52px] w-[52px] rounded-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
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
            className="h-[52px] w-[52px] rounded-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            style={{ background: 'var(--color-primary-pale)', border: '1px solid var(--color-primary-border)' }}
          >
            <Plus size={22} color="var(--color-primary)" weight="bold" />
          </button>
        </div>

        <div
          className="mt-3 mb-5 rounded-card px-5 py-4 flex items-center justify-between"
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

        {!online && (
          <div
            className="mb-3 flex items-center gap-3 rounded-card px-3.5 py-3"
            style={{
              background: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
            }}
          >
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'color-mix(in oklch, var(--color-surface) 55%, transparent)',
                border: '1px solid var(--color-warning-border)',
              }}
            >
              <CloudSlash size={16} color="var(--color-warning)" weight="bold" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[1.2px] leading-none" style={{ color: 'var(--color-warning)' }}>
                Geen verbinding
              </p>
              <p
                className="text-[12px] font-semibold mt-1 leading-tight"
                style={{ color: 'color-mix(in oklch, var(--color-warning) 70%, transparent)' }}
              >
                Wordt verstuurd zodra je weer online bent
              </p>
            </div>
          </div>
        )}

        <ActionPillButton
          onClick={handleBuy}
          disabled={loading}
          variant="accent"
          size="md"
          className="w-full"
        >
          {loading ? (
            <Spinner className="size-4 shrink-0" style={{ color: 'var(--color-white)' }} />
          ) : (
            <ShoppingCart size={18} weight="bold" />
          )}
          {loading ? 'Bezig...' : `Kopen voor € ${Number(total).toFixed(2).replace('.', ',')}`}
        </ActionPillButton>
      </DrawerContent>
    </Drawer>
  )
}
