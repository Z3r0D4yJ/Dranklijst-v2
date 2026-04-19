import { useState } from 'react'
import { X, Minus, Plus, ShoppingCart } from '@phosphor-icons/react'
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
  beer: 'Bier', wine: 'Wijn', soda: 'Frisdrank', water: 'Water', coffee: 'Koffie',
  'alcoholisch': 'Alcohol', 'niet-alcoholisch': 'Frisdrank',
}

export function BuyModal({ item, periodId, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = (item.price * quantity).toFixed(2)

  async function handleBuy() {
    if (!user) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      consumption_id: item.consumption_id,
      period_id: periodId,
      quantity,
      unit_price: item.price,
    })

    if (error) {
      setError('Er ging iets mis. Probeer opnieuw.')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Dim overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md"
        style={{
          background: 'var(--color-surface)',
          borderRadius: '28px 28px 0 0',
          paddingTop: 12,
          paddingBottom: 24,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        {/* Grab handle */}
        <div className="w-11 h-1 rounded-full mx-auto mb-[18px]" style={{ background: 'var(--color-border-mid)' }} />

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <IconChip tone={item.category as IconChipTone} size={48} />
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[1px]" style={{ color: 'var(--color-text-muted)' }}>
              {CATEGORY_LABELS[item.category] ?? item.category}
            </p>
            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] leading-tight" style={{ color: 'var(--color-text-primary)' }}>{item.name}</h2>
            <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>€ {item.price.toFixed(2).replace('.', ',')} per stuk</p>
          </div>
          <button
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
          >
            <X size={17} color="var(--color-text-muted)" />
          </button>
        </div>

        {/* Qty selector */}
        <div className="flex items-center justify-center gap-8 py-4">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
            style={{ background: 'var(--color-surface-alt)' }}
          >
            <Minus size={22} color="var(--color-text-primary)" weight="bold" />
          </button>

          <span
            className="tabular-nums select-none"
            style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2, color: 'var(--color-text-primary)', lineHeight: 1 }}
          >
            {quantity}
          </span>

          <button
            onClick={() => setQuantity(q => Math.min(20, q + 1))}
            disabled={quantity >= 20}
            className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
            style={{ background: 'var(--color-primary-pale)', border: '1px solid var(--color-primary-border)' }}
          >
            <Plus size={22} color="var(--color-primary)" weight="bold" />
          </button>
        </div>

        {/* Totaal row */}
        <div className="rounded-[14px] px-5 py-4 flex items-center justify-between mt-3 mb-5" style={{ background: 'var(--color-surface-alt)' }}>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Totaal</span>
          <span className="text-[22px] font-extrabold tracking-[-0.5px] tabular-nums" style={{ color: 'var(--color-text-primary)' }}>€ {Number(total).toFixed(2).replace('.', ',')}</span>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-[13px] font-medium mb-4" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-bg)' }}>
            {error}
          </div>
        )}

        {/* CTA */}
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
          <ShoppingCart size={18} weight="bold" />
          {loading ? 'Bezig…' : `Kopen voor € ${Number(total).toFixed(2).replace('.', ',')}`}
        </button>
      </div>
    </div>
  )
}
