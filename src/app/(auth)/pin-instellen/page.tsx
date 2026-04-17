'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setPin } from '@/lib/auth/pin'
import { haptic } from '@/lib/utils/haptic'
import { Backspace } from '@phosphor-icons/react'

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

export default function PinInstellenPage() {
  const router = useRouter()
  const [pin, setLocalPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleDigit(digit: string) {
    haptic('light')
    const current = step === 'enter' ? pin : confirm
    if (current.length >= 4) return
    const next = current + digit

    if (step === 'enter') {
      setLocalPin(next)
      if (next.length === 4) {
        setTimeout(() => setStep('confirm'), 150)
      }
    } else {
      setConfirm(next)
      if (next.length === 4) {
        setTimeout(() => handleConfirm(next), 150)
      }
    }
  }

  function handleDelete() {
    haptic('light')
    if (step === 'enter') {
      setLocalPin((p) => p.slice(0, -1))
    } else {
      setConfirm((p) => p.slice(0, -1))
    }
  }

  async function handleConfirm(confirmedPin: string) {
    if (pin !== confirmedPin) {
      haptic('heavy')
      setError('PINs komen niet overeen. Probeer opnieuw.')
      setLocalPin('')
      setConfirm('')
      setStep('enter')
      return
    }

    setLoading(true)
    try {
      await setPin(pin)
      router.replace('/groep-kiezen')
    } catch {
      setError('Opslaan mislukt. Probeer opnieuw.')
      setLocalPin('')
      setConfirm('')
      setStep('enter')
    } finally {
      setLoading(false)
    }
  }

  const current = step === 'enter' ? pin : confirm

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <h1 className="mb-2 text-center text-2xl font-semibold text-zinc-900">
          {step === 'enter' ? 'Kies een PIN' : 'Bevestig PIN'}
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-500">
          {step === 'enter'
            ? 'Je gebruikt deze 4-cijferige PIN elke keer om in te loggen.'
            : 'Voer je PIN nogmaals in.'}
        </p>

        {/* PIN dots */}
        <div className="mb-8 flex justify-center gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                i < current.length
                  ? 'border-brand bg-brand scale-110'
                  : 'border-zinc-300 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
            {error}
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {DIGITS.map((d, i) => {
            if (d === '') return <div key="empty" />
            if (d === 'del') {
              return (
                <button
                  key="del"
                  onClick={handleDelete}
                  aria-label="Verwijder"
                  disabled={loading}
                  className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 transition-colors active:bg-zinc-200 disabled:opacity-30"
                >
                  <Backspace size={22} />
                </button>
              )
            }
            return (
              <button
                key={`digit-${d}`}
                onClick={() => handleDigit(d)}
                disabled={loading || current.length >= 4}
                className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-zinc-100 text-xl font-semibold text-zinc-900 transition-colors active:bg-brand-light active:text-brand disabled:opacity-30"
              >
                {d}
              </button>
            )
          })}
        </div>

        {loading && (
          <p className="mt-6 text-center text-sm text-zinc-400">Bezig met opslaan...</p>
        )}
      </div>
    </main>
  )
}
