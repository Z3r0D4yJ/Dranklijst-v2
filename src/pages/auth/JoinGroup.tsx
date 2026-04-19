import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hash, ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export function JoinGroup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groupName, setGroupName] = useState<string | null>(null)

  async function handleJoin() {
    if (!user || code.trim().length < 6) return
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.rpc('join_via_invite', { p_code: code.trim().toUpperCase() })

    if (error) {
      setError(error.message)
    } else {
      setGroupName(data as string)
    }
    setLoading(false)
  }

  if (groupName) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={36} color="#10B981" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Welkom bij {groupName}!</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Je bent toegevoegd aan de groep.</p>
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
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hash size={28} color="#2563EB" />
          </div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Groep joinen</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Vraag de uitnodigingscode aan jouw leiding
          </p>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 text-sm text-[#EF4444] mb-4">
            {error}
          </div>
        )}

        <div
          className="rounded-[14px] p-4 mb-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Uitnodigingscode
          </label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="ABC123"
            maxLength={6}
            className="w-full text-center text-2xl font-bold tracking-[0.3em] bg-transparent outline-none py-2"
            style={{ color: 'var(--color-text-primary)' }}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <button
          onClick={handleJoin}
          disabled={code.trim().length < 6 || loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? 'Bezig…' : 'Deelnemen'}
          {!loading && <ArrowRight size={18} />}
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-sm py-3 mt-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Overslaan voor nu
        </button>
      </div>
    </div>
  )
}
