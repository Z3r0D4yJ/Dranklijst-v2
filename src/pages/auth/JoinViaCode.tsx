import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, WarningCircle, Users, ArrowRight } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/spinner'

export function JoinViaCode() {
  const { code } = useParams<{ code: string }>()
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [groupName, setGroupName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (authLoading || !code) return
    if (!session) return

    setStatus('loading')
    supabase.rpc('join_via_invite', { p_code: code.toUpperCase() }).then(({ data, error }) => {
      if (error) {
        setErrorMsg(error.message)
        setStatus('error')
      } else {
        setGroupName(data as string)
        setStatus('success')
      }
    })
  }, [authLoading, session, code])

  // Not logged in
  if (!authLoading && !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--color-primary-pale)' }}>
            <Users size={32} color="var(--color-primary)" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Je bent uitgenodigd!</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Log in of maak een account aan om deel te nemen.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to="/register"
              onClick={() => sessionStorage.setItem('pendingInviteCode', code ?? '')}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
            >
              Account aanmaken
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              onClick={() => sessionStorage.setItem('pendingInviteCode', code ?? '')}
              className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform border"
              style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border-mid)' }}
            >
              Inloggen
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (authLoading || status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Spinner className="size-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--color-success-bg)' }}>
            <CheckCircle size={36} color="var(--color-success)" weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Welkom bij {groupName}!</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Je bent toegevoegd aan de groep.
            </p>
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            Naar de app
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--color-danger-bg)' }}>
          <WarningCircle size={36} color="var(--color-danger)" weight="fill" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Ongeldige link</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{errorMsg}</p>
        </div>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="w-full font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform border"
          style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border-mid)' }}
        >
          Terug naar de app
        </button>
      </div>
    </div>
  )
}
