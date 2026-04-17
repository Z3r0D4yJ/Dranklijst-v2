'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinGroupByCode } from '@/lib/auth/groups'
import { haptic } from '@/lib/utils/haptic'
import { UsersThree } from '@phosphor-icons/react'

export default function GroepKiezenPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) {
      setError('Voer een geldige 6-tekens code in.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await joinGroupByCode(trimmed)
      haptic('medium')
      router.replace('/registreer')
    } catch (e) {
      haptic('heavy')
      setError(e instanceof Error ? e.message : 'Ongeldige code. Vraag je begeleider om de code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
          <UsersThree size={32} weight="fill" />
        </div>

        <h1 className="mb-2 text-center text-2xl font-semibold text-zinc-900">
          Aansluiten bij groep
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-500">
          Vraag je begeleider om de uitnodigingscode van de groep.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Uitnodigingscode</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              autoCapitalize="characters"
              maxLength={6}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-2xl font-mono tracking-widest outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
              placeholder="ABC123"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || code.trim().length < 6}
            className="mt-2 cursor-pointer rounded-xl bg-brand py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-dark active:bg-brand-dark disabled:opacity-40"
          >
            {loading ? 'Bezig...' : 'Aansluiten'}
          </button>
        </div>
      </div>
    </main>
  )
}
