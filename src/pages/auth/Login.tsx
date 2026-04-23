import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EnvelopeSimple, LockSimple, Eye, EyeSlash } from '@phosphor-icons/react'
import { Spinner } from '../../components/ui/spinner'
import { AuthGoogleButton, AuthSplashHeader } from '../../components/AuthPagePrimitives'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useThemeColor } from '../../hooks/useThemeColor'

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
      <AuthSplashHeader />

      {/* ─── Form sheet ─────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        style={{
          background: 'var(--color-surface)',
          borderRadius: '24px 24px 0 0',
          marginTop: -12,
          padding: '24px 20px calc(28px + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)))',
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
                className="dl-input text-[15px] font-semibold"
                style={{
                  paddingLeft: 42,
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
                className="dl-input text-[15px] font-semibold"
                style={{
                  paddingLeft: 42,
                  paddingRight: 42,
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
              color: 'white',
              height: 'var(--control-height)',
              padding: '0 14px',
              borderRadius: 14,
              border: 'none',
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

        <AuthGoogleButton
          onClick={handleGoogle}
          label="Doorgaan met Google"
        />

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
