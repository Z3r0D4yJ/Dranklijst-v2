import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EnvelopeSimple, LockSimple, Eye, EyeSlash } from '@phosphor-icons/react'
import { Spinner } from '../../components/ui/spinner'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useThemeColor } from '../../hooks/useThemeColor'

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

export function Login() {
  useThemeColor('--color-header')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Ongeldig e-mailadres of wachtwoord.')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-header)' }}>
      {/* ─── Splash header ─────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-center overflow-hidden shrink-0"
        style={{ height: 198 }}
      >
        <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: 110, background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: -30, bottom: -40, width: 150, height: 150, borderRadius: 75, background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div
          className="overflow-hidden shrink-0 relative z-10"
          style={{
            width: 64, height: 64, borderRadius: 32, marginBottom: 10,
            background: 'var(--color-accent-bg)',
            border: '2.5px solid var(--color-accent-border)',
          }}
        >
          <img src="/fox.png" alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 22%' }} />
        </div>
        <h1 className="relative z-10 text-[22px] font-extrabold tracking-[-0.5px] m-0" style={{ color: 'var(--color-header-fg)' }}>Dranklijst</h1>
        <p className="relative z-10 text-[12px] font-medium mt-1 m-0" style={{ color: 'rgba(255,255,255,0.55)' }}>Chiro Reinaert Lochristi</p>
      </div>

      {/* ─── Form sheet ─────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        style={{
          background: 'var(--color-surface)',
          borderRadius: '24px 24px 0 0',
          marginTop: -18,
          padding: '24px 20px 28px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="mb-5">
          <h2 className="text-[20px] font-extrabold tracking-[-0.4px] m-0 mb-1" style={{ color: 'var(--color-text-primary)' }}>Welkom terug</h2>
          <p className="text-[13px] font-medium m-0" style={{ color: 'var(--color-text-muted)' }}>Log in op je Dranklijst account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <label className="block text-[12px] font-bold tracking-[0.2px] mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>E-mailadres</label>
            <div className="relative">
              <EnvelopeSimple
                size={15}
                color="var(--color-text-muted)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', flexShrink: 0 }}
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="naam@voorbeeld.be"
                required
                className="w-full outline-none text-[14px] font-medium"
                style={{
                  background: 'var(--color-surface-alt)',
                  border: '1.5px solid var(--color-border-mid)',
                  borderRadius: 14,
                  padding: '12px 14px 12px 42px',
                  color: 'var(--color-text-primary)',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold tracking-[0.2px] mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Wachtwoord</label>
            <div className="relative">
              <LockSimple
                size={15}
                color="var(--color-text-muted)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', flexShrink: 0 }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full outline-none text-[14px] font-medium"
                style={{
                  background: 'var(--color-surface-alt)',
                  border: '1.5px solid var(--color-border-mid)',
                  borderRadius: 14,
                  padding: '12px 42px 12px 42px',
                  color: 'var(--color-text-primary)',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 active:scale-95 transition-transform"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60 mt-1"
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              padding: 14,
              borderRadius: 14,
              border: 'none',
              boxShadow: 'var(--shadow-fab)',
              fontFamily: 'inherit',
            }}
          >
            {loading ? (
              <>
                <Spinner className="size-4 shrink-0" style={{ color: '#fff' }} />
                Bezig met inloggen…
              </>
            ) : 'Inloggen'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: 'var(--color-border-mid)' }} />
          <span className="text-[11px] font-bold tracking-[0.6px]" style={{ color: 'var(--color-text-muted)' }}>OF</span>
          <div className="flex-1 h-px" style={{ background: 'var(--color-border-mid)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-2.5 text-[14px] font-semibold active:scale-[0.98] transition-transform"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border-mid)',
            borderRadius: 14,
            padding: 12,
            color: 'var(--color-text-primary)',
            fontFamily: 'inherit',
          }}
        >
          <GoogleLogo />
          Doorgaan met Google
        </button>

        <p className="text-center text-[13px] font-medium mt-[18px]" style={{ color: 'var(--color-text-muted)' }}>
          Nog geen account?{' '}
          <Link to="/register" className="font-bold" style={{ color: 'var(--color-primary)' }}>
            Registreer je
          </Link>
        </p>
      </div>
    </div>
  )
}
