import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, PencilSimple, Eye, EyeSlash, X, Check } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import type { Consumption, ConsumptionCategory } from '../../lib/database.types'

const CATEGORIES: { value: ConsumptionCategory; label: string }[] = [
  { value: 'niet-alcoholisch', label: 'Frisdrank / Water' },
  { value: 'alcoholisch',      label: 'Bier / Alcoholisch' },
]

const CAT_LABELS: Record<string, string> = {
  'niet-alcoholisch': 'Frisdrank / Water',
  'alcoholisch':      'Bier / Alcoholisch',
}

interface FormState {
  name: string
  price: string
  category: ConsumptionCategory
}

const EMPTY_FORM: FormState = { name: '', price: '', category: 'niet-alcoholisch' }

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

  const inputStyle = {
    background: 'var(--color-surface-alt)',
    border: '1.5px solid var(--color-border-mid)',
    borderRadius: 12,
    padding: '10px 14px',
    color: 'var(--color-text-primary)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  return (
    <div className="px-4 space-y-4">
      <button
        onClick={openNew}
        className="w-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        style={{
          background: 'var(--color-primary)',
          color: '#fff',
          padding: 13,
          borderRadius: 14,
          border: 'none',
          boxShadow: 'var(--shadow-fab)',
          fontFamily: 'inherit',
        }}
      >
        <Plus size={16} weight="bold" />
        Nieuwe consumptie
      </button>

      {showForm && (
        <div className="rounded-[14px] p-4 space-y-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>
              {editing ? 'Consumptie bewerken' : 'Nieuwe consumptie'}
            </p>
            <button onClick={closeForm}><X size={18} color="var(--color-text-muted)" /></button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Naam"
              style={inputStyle}
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Prijs (€)"
                step="0.10"
                min="0"
                style={{ ...inputStyle, flex: 1, width: 'auto' }}
              />
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as ConsumptionCategory }))}
                style={{ ...inputStyle, flex: 1, width: 'auto' }}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-[12px] m-0" style={{ color: 'var(--color-danger)' }}>{error}</p>}

          <button
            onClick={save}
            disabled={loading}
            className="w-full text-[13px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '10px',
              borderRadius: 12,
              border: 'none',
              fontFamily: 'inherit',
            }}
          >
            <Check size={14} weight="bold" />
            {loading ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat}>
          <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] mb-2 m-0" style={{ color: 'var(--color-text-muted)' }}>
            {CAT_LABELS[cat] ?? cat}
          </p>
          <div className="rounded-[14px] overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            {items.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  opacity: c.is_active ? 1 : 0.4,
                  borderTop: i > 0 ? '1px solid var(--color-border)' : undefined,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
                  <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>€{c.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => openEdit(c)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                  style={{ background: 'var(--color-primary-pale)', border: 'none' }}
                >
                  <PencilSimple size={14} color="var(--color-primary)" />
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                  style={{
                    background: c.is_active ? 'var(--color-success-bg)' : 'var(--color-surface-alt)',
                    border: 'none',
                  }}
                >
                  {c.is_active
                    ? <Eye size={14} color="var(--color-success)" />
                    : <EyeSlash size={14} color="var(--color-text-muted)" />}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
