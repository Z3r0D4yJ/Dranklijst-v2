import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, PencilSimple, Eye, EyeSlash, X, Check } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import type { Consumption, ConsumptionCategory } from '../../lib/database.types'

const CATEGORIES: { value: ConsumptionCategory; label: string }[] = [
  { value: 'soda',   label: 'Frisdrank' },
  { value: 'water',  label: 'Water' },
  { value: 'coffee', label: 'Koffie' },
  { value: 'beer',   label: 'Bier' },
  { value: 'wine',   label: 'Wijn' },
]

const CAT_LABELS: Record<string, string> = {
  soda: 'Frisdrank', water: 'Water', coffee: 'Koffie',
  beer: 'Bier', wine: 'Wijn',
  'niet-alcoholisch': 'Frisdrank', 'alcoholisch': 'Alcohol',
}

interface FormState {
  name: string
  price: string
  category: ConsumptionCategory
}

const EMPTY_FORM: FormState = { name: '', price: '', category: 'soda' }

export function Consumptions() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Consumption | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: consumptions, isLoading } = useQuery({
    queryKey: ['consumptions-admin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('consumptions')
        .select('*')
        .order('category')
        .order('name')
      return (data ?? []) as Consumption[]
    },
  })

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  function openEdit(c: Consumption) {
    setEditing(c)
    setForm({ name: c.name, price: c.price.toString(), category: c.category })
    setError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  async function save() {
    const price = parseFloat(form.price)
    if (!form.name.trim() || isNaN(price) || price <= 0) {
      setError('Vul een geldige naam en prijs in.')
      return
    }
    setLoading(true)
    setError(null)

    if (editing) {
      await supabase.from('consumptions').update({
        name: form.name.trim(),
        price,
        category: form.category,
      }).eq('id', editing.id)
    } else {
      await supabase.from('consumptions').insert({
        name: form.name.trim(),
        price,
        category: form.category,
        is_active: true,
      })
    }

    await queryClient.invalidateQueries({ queryKey: ['consumptions-admin'] })
    queryClient.invalidateQueries({ queryKey: ['group-consumptions'] })
    closeForm()
    setLoading(false)
  }

  async function toggleActive(c: Consumption) {
    await supabase.from('consumptions').update({ is_active: !c.is_active }).eq('id', c.id)
    await queryClient.invalidateQueries({ queryKey: ['consumptions-admin'] })
    queryClient.invalidateQueries({ queryKey: ['group-consumptions'] })
  }

  const grouped = (consumptions ?? []).reduce<Record<string, Consumption[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})

  return (
    <div className="px-4 space-y-4">
      <button
        onClick={openNew}
        className="w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Nieuwe consumptie
      </button>

      {showForm && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              {editing ? 'Consumptie bewerken' : 'Nieuwe consumptie'}
            </p>
            <button onClick={closeForm}><X size={18} color="#94A3B8" /></button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Naam"
              className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Prijs (€)"
                step="0.10"
                min="0"
                className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as ConsumptionCategory }))}
                className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-[#EF4444]">{error}</p>}

          <button
            onClick={save}
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl text-sm active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={16} weight="bold" />
            {loading ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat}>
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
            {CAT_LABELS[cat] ?? cat}
          </p>
          <div className="bg-white dark:bg-[#1E293B] rounded-[14px] border border-[#F1F5F9] dark:border-[#334155] divide-y divide-[#F1F5F9] dark:divide-[#334155]">
            {items.map(c => (
              <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${!c.is_active ? 'opacity-40' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">{c.name}</p>
                  <p className="text-xs text-[#94A3B8]">€{c.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => openEdit(c)}
                  className="w-8 h-8 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                >
                  <PencilSimple size={14} color="#2563EB" />
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-transform ${c.is_active ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' : 'bg-[#F1F5F9] dark:bg-[#334155]'}`}
                >
                  {c.is_active
                    ? <Eye size={14} color="#10B981" />
                    : <EyeSlash size={14} color="#94A3B8" />}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
