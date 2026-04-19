import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { notifyLeidingOfJoinRequest } from '../../lib/notifications'
import type { Group } from '../../lib/database.types'

export function JoinGroup() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('groups')
      .select('*')
      .neq('name', 'Leiding')
      .order('name')
      .then(({ data }) => {
        if (data) setGroups(data)
      })
  }, [])

  async function handleSubmit() {
    if (!selectedGroup || !user) return
    setError(null)
    setLoading(true)

    const { error } = await supabase.from('join_requests').insert({
      user_id: user.id,
      group_id: selectedGroup,
    })

    if (error) {
      if (error.code === '23505') {
        setError('Je hebt al een aanvraag ingediend voor deze groep.')
      } else {
        setError('Er ging iets mis. Probeer opnieuw.')
      }
      setLoading(false)
    } else {
      if (user && profile) {
        notifyLeidingOfJoinRequest(selectedGroup, profile.full_name)
      }
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-[#ECFDF5] dark:bg-[#064E3B] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} color="#10B981" weight="fill" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">Aanvraag verstuurd!</h2>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2">
            De leiding van je groep krijgt een melding en zal je aanvraag beoordelen.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            Naar de app
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} color="#2563EB" />
          </div>
          <h1 className="text-[22px] font-bold text-[#0F172A] dark:text-[#F1F5F9]">Kies je groep</h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">Dien een aanvraag in bij de leiding van je groep</p>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] dark:bg-[#450A0A] border border-[#FECACA] rounded-xl px-4 py-3 text-sm text-[#EF4444] mb-4">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`w-full flex items-center justify-between rounded-[14px] px-4 py-3.5 text-left active:scale-[0.98] transition-transform border ${
                selectedGroup === group.id
                  ? 'border-primary bg-[#EFF6FF] dark:bg-[#1E3A8A]'
                  : 'bg-white dark:bg-[#1E293B] border-[#F1F5F9] dark:border-[#334155]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedGroup === group.id ? 'bg-primary' : 'bg-[#EFF6FF] dark:bg-[#1E3A8A]'
                }`}>
                  <Users size={16} color={selectedGroup === group.id ? 'white' : '#2563EB'} />
                </div>
                <span className={`text-sm font-semibold ${
                  selectedGroup === group.id ? 'text-primary' : 'text-[#0F172A] dark:text-[#F1F5F9]'
                }`}>
                  {group.name}
                </span>
              </div>
              {selectedGroup === group.id && (
                <CheckCircle size={20} color="#2563EB" weight="fill" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedGroup || loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform disabled:opacity-40 mt-6 flex items-center justify-center gap-2"
        >
          {loading ? 'Aanvraag versturen…' : 'Aanvraag indienen'}
          {!loading && <ArrowRight size={18} />}
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-sm text-[#64748B] dark:text-[#94A3B8] mt-4 py-2"
        >
          Overslaan voor nu
        </button>
      </div>
    </div>
  )
}
