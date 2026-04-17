'use client'

import { useState } from 'react'
import { useAuth } from '@/stores/auth'
import { useSession } from '@/stores/session'
import { useToast } from '@/stores/toast'
import { registerConsumption, undoConsumptionGroup } from '@/lib/consumptions/register'
import { haptic } from '@/lib/utils/haptic'
import { ExpiredItemsBanner } from '@/components/ui/expired-items-banner'
import { Minus, Plus, CaretDown } from '@phosphor-icons/react'

function HeroHeader({ periodName }: { periodName?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 bg-slate-900 px-6 pb-8 pt-12">
      <img
        src="/logo.png"
        alt="Dranklijst mascotte"
        width={96}
        height={96}
        className="drop-shadow-lg"
        style={{ objectFit: 'contain' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">
          Registreer je consumptie
        </h1>
        {periodName && (
          <p className="mt-0.5 text-sm text-slate-400">{periodName}</p>
        )}
      </div>
    </div>
  )
}

export default function RegistreerPage() {
  const profile = useAuth((s) => s.profile)
  const { groupProducts, activePeriod, isLoading } = useSession()
  const toast = useToast()

  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const selected = groupProducts.find((p) => p.id === selectedId) ?? null
  const totalPrice = selected ? selected.price * quantity : 0

  function handleDecrement() {
    haptic('light')
    setQuantity((q) => Math.max(1, q - 1))
  }

  function handleIncrement() {
    haptic('light')
    setQuantity((q) => q + 1)
  }

  async function handleConfirm() {
    if (!selected || !profile?.group_id || !activePeriod || loading) return

    haptic('medium')
    setLoading(true)

    try {
      const uuid = await registerConsumption({
        userId: profile.id,
        groupId: profile.group_id,
        groupProductId: selected.id,
        periodId: activePeriod.id,
        quantity,
        unitPrice: selected.price,
      })

      setSelectedId('')
      setQuantity(1)

      toast.show({
        message: `${quantity}× ${selected.name} geregistreerd — € ${totalPrice.toFixed(2)}`,
        action: {
          label: 'Ongedaan maken',
          onClick: () => {
            haptic('heavy')
            undoConsumptionGroup([uuid])
          },
        },
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col bg-zinc-50">
      <HeroHeader periodName={activePeriod?.name} />

      <ExpiredItemsBanner />

      <div className="flex flex-col gap-5 px-4 pt-6 pb-32">
        {/* Dropdown + Stepper rij */}
        <div className="flex gap-3">
          {/* Product dropdown */}
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Kies consumptie
            </label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={isLoading}
                className="w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-zinc-900 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-50"
              >
                <option value="">Selecteer...</option>
                {groupProducts
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — € {p.price.toFixed(2)}
                    </option>
                  ))}
              </select>
              <CaretDown
                size={16}
                weight="bold"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
          </div>

          {/* Aantal stepper */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Aantal
            </label>
            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1}
                aria-label="Minder"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition-colors active:bg-zinc-100 disabled:opacity-30"
              >
                <Minus size={16} weight="bold" />
              </button>
              <span className="w-7 text-center text-sm font-bold tabular-nums text-zinc-900">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                aria-label="Meer"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-brand text-white transition-colors active:bg-brand-dark"
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Samenvattingskaart */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Overzicht aankoop
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Consumptie:</span>
              {selected ? (
                <span className="text-sm font-semibold text-zinc-900">{selected.name}</span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                  Geen selectie
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Aantal:</span>
              <span className="text-sm font-semibold text-zinc-900">{quantity}</span>
            </div>
            <div className="my-1 border-t border-zinc-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900">Totale prijs:</span>
              <span className="text-base font-bold text-zinc-900">
                € {totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Bevestigingsknop */}
        <button
          onClick={handleConfirm}
          disabled={!selected || loading}
          className="cursor-pointer rounded-2xl bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark active:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Bezig...' : 'Aankopen'}
        </button>

        {!activePeriod && !isLoading && (
          <p className="text-center text-sm text-zinc-400">
            Geen actieve periode. Vraag je begeleider om een periode te starten.
          </p>
        )}
      </div>
    </main>
  )
}
