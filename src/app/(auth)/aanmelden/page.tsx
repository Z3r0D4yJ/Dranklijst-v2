'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/auth/signup'
import { Eye, EyeSlash, EnvelopeSimple } from '@phosphor-icons/react'
import { BrandLogo } from '@/components/ui/brand-logo'

export default function AanmeldenPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!displayName.trim() || !email || !password) return
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, displayName.trim())
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aanmelden mislukt')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
            <EnvelopeSimple size={32} weight="fill" />
          </div>
          <h1 className="mb-2 text-xl font-semibold">Check je e-mail</h1>
          <p className="text-sm text-zinc-500">
            We hebben een bevestigingslink gestuurd naar{' '}
            <strong className="text-zinc-800">{email}</strong>.
            Klik op de link om je account te activeren.
          </p>
          <Link
            href="/login"
            className="mt-6 block text-sm font-semibold text-brand hover:text-brand-dark"
          >
            Terug naar inloggen
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <BrandLogo size="md" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Roepnaam</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
              placeholder="Jouw naam"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">E-mailadres</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
              placeholder="naam@voorbeeld.be"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Wachtwoord</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-base outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
                placeholder="Minimaal 6 tekens"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !displayName.trim() || !email || !password}
            className="mt-2 cursor-pointer rounded-xl bg-brand py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-dark active:bg-brand-dark disabled:opacity-40"
          >
            {loading ? 'Bezig...' : 'Account aanmaken'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Al een account?{' '}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
            Inloggen
          </Link>
        </p>
      </div>
    </main>
  )
}
