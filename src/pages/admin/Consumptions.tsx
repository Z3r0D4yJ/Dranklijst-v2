import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, PencilSimple, Eye, EyeSlash, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/spinner'
import { CustomSelect } from '../../components/CustomSelect'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { IconActionButton } from '../../components/ui/action-button'
import type { Consumption, ConsumptionCategory } from '../../lib/database.types'

const CATEGORIES: { value: ConsumptionCategory; label: string }[] = [
  { value: 'niet-alcoholisch', label: 'Frisdrank / Water' },
  { value: 'alcoholisch', label: 'Bier / Alcoholisch' },
]

const CAT_LABELS: Record<string, string> = {
  'niet-alcoholisch': 'Frisdrank / Water',
  'alcoholisch': 'Bier / Alcoholisch',
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

  const { data: consumptions, isLoading } = useQuery({
    queryKey: ['consumptions-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumptions')
        .select('*')
        .order('category')
        .order('name')

      if (error) throw error
      return (data ?? []) as Consumption[]
    },
  })

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(consumption: Consumption) {
    setEditing(consumption)
    setForm({
      name: consumption.name,
      price: consumption.price.toString(),
      category: consumption.category,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  async function save() {
    const price = Number.parseFloat(form.price)
    if (!form.name.trim() || Number.isNaN(price) || price <= 0) {
      toast.error('Vul een geldige naam en prijs in.')
      return
    }

    const isEditing = Boolean(editing)
    setLoading(true)

    try {
      const { error } = editing
        ? await supabase
          .from('consumptions')
          .update({
            name: form.name.trim(),
            price,
            category: form.category,
          })
          .eq('id', editing.id)
        : await supabase.from('consumptions').insert({
          name: form.name.trim(),
          price,
          category: form.category,
          is_active: true,
        })

      if (error) {
        toast.error(error.message || 'Kon consumptie niet opslaan.')
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['consumptions-admin'] }),
        queryClient.invalidateQueries({ queryKey: ['group-consumptions'] }),
      ])

      closeForm()
      toast.success(isEditing ? 'Consumptie bijgewerkt.' : 'Consumptie aangemaakt.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(consumption: Consumption) {
    const { error } = await supabase
      .from('consumptions')
      .update({ is_active: !consumption.is_active })
      .eq('id', consumption.id)

    if (error) {
      toast.error(error.message || 'Kon zichtbaarheid niet aanpassen.')
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['consumptions-admin'] }),
      queryClient.invalidateQueries({ queryKey: ['group-consumptions'] }),
    ])
  }

  const grouped = (consumptions ?? []).reduce<Record<string, Consumption[]>>((acc, consumption) => {
    if (!acc[consumption.category]) acc[consumption.category] = []
    acc[consumption.category].push(consumption)
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

      <AdminFormDrawer
        open={showForm}
        onOpenChange={(open) => {
          if (!open) closeForm()
        }}
        title={editing ? 'Consumptie bewerken' : 'Nieuwe consumptie'}
        description={editing ? 'Pas naam, prijs en categorie aan.' : 'Voeg een nieuwe consumptie toe aan de globale lijst.'}
        dismissible={!loading}
        disableClose={loading}
        scrollBody
        fixed={false}
        repositionInputs={false}
        bodyClassName="space-y-4"
        footer={
          <button
            onClick={save}
            disabled={loading}
            className="w-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              fontFamily: 'inherit',
            }}
          >
            <Check size={14} weight="bold" />
            {loading ? 'Opslaan...' : 'Opslaan'}
          </button>
        }
      >
        <div className="space-y-1.5">
          <label
            className="text-[11px] font-extrabold uppercase tracking-[1px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Naam
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Naam"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            style={inputStyle}
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-[11px] font-extrabold uppercase tracking-[1px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Prijs en categorie
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              placeholder="Prijs (EUR)"
              step="0.10"
              min="0"
              style={{ ...inputStyle, flex: 1, width: 'auto' }}
            />
            <CustomSelect
              value={form.category}
              onChange={(value) => setForm((current) => ({ ...current, category: value as ConsumptionCategory }))}
              options={CATEGORIES.map((category) => ({ value: category.value, label: category.label }))}
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>
        </div>
      </AdminFormDrawer>

      {isLoading && (
        <div className="flex justify-center mt-8">
          <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <p
            className="text-[11px] font-extrabold uppercase tracking-[1.2px] mb-2 m-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {CAT_LABELS[category] ?? category}
          </p>
          <div
            className="rounded-[14px] overflow-hidden"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {items.map((consumption, index) => (
              <div
                key={consumption.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  opacity: consumption.is_active ? 1 : 0.4,
                  borderTop: index > 0 ? '1px solid var(--color-border)' : undefined,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {consumption.name}
                  </p>
                  <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    EUR {consumption.price.toFixed(2)}
                  </p>
                </div>
                <IconActionButton
                  onClick={() => openEdit(consumption)}
                  variant="primary-soft"
                  aria-label={`Bewerk ${consumption.name}`}
                >
                  <PencilSimple size={15} color="currentColor" />
                </IconActionButton>
                <IconActionButton
                  onClick={() => toggleActive(consumption)}
                  variant={consumption.is_active ? 'success-soft' : 'neutral'}
                  aria-label={consumption.is_active ? `${consumption.name} verbergen` : `${consumption.name} zichtbaar maken`}
                >
                  {consumption.is_active
                    ? <Eye size={15} color="currentColor" />
                    : <EyeSlash size={15} color="currentColor" />}
                </IconActionButton>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
