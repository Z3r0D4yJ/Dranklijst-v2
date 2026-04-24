import { useState, type CSSProperties } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, PencilSimple, Eye, EyeSlash, Check, BeerBottle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AdminEmptyState, AdminSectionLabel, AdminSurface, SkeletonList } from '../../components/AdminThemePrimitives'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { CustomSelect } from '../../components/CustomSelect'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { ActionPillButton, IconActionButton } from '../../components/ui/action-button'
import { formatMoney } from '../../lib/formatters'
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
const CLAMPED_NAME_STYLE: CSSProperties = {
  color: 'var(--color-text-primary)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

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
  const totalConsumptions = (consumptions ?? []).length

  return (
    <div className="px-5 space-y-4 pb-content-end-comfort">
      <ActionPillButton
        onClick={openNew}
        variant="accent"
        size="md"
        className="w-full dl-stagger-card"
        style={{ animationDelay: '0ms' }}
      >
        <Plus size={16} weight="bold" />
        Nieuwe consumptie
      </ActionPillButton>

      <AdminFormDrawer
        open={showForm}
        onOpenChange={(open) => {
          if (!open) closeForm()
        }}
        title={editing ? 'Consumptie bewerken' : 'Nieuwe consumptie'}
        dismissible={!loading}
        disableClose={loading}
        scrollBody
        fixed={false}
        repositionInputs={false}
        bodyClassName="space-y-4"
        footer={
          <ActionPillButton
            onClick={save}
            disabled={loading}
            variant="accent"
            size="md"
            className="w-full"
          >
            <Check size={14} weight="bold" />
            {loading ? 'Opslaan...' : 'Opslaan'}
          </ActionPillButton>
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
            className="dl-input text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-[11px] font-extrabold uppercase tracking-[1px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Prijs en categorie
          </label>
          <div className="flex gap-2.5">
            <input
              type="number"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              placeholder="Prijs (EUR)"
              step="0.10"
              min="0"
              className="dl-input min-w-0 flex-1 text-[13px]"
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
        <section className="space-y-2">
          <AdminSectionLabel>Consumpties</AdminSectionLabel>
          <SkeletonList rows={5} leading="none" trailing="action" />
        </section>
      )}

      {!isLoading && totalConsumptions === 0 && (
        <AdminEmptyState
          icon={BeerBottle}
          title="Nog geen consumpties"
          description="Voeg hierboven je eerste consumptie toe aan de globale lijst."
        />
      )}

      {Object.entries(grouped).map(([category, items], catIndex) => (
        <section key={category} className="space-y-2">
          <div
            className="flex items-center justify-between gap-3 dl-stagger-card"
            style={{ animationDelay: `${80 + catIndex * 80}ms` }}
          >
            <AdminSectionLabel>{CAT_LABELS[category] ?? category}</AdminSectionLabel>
            <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {items.length} items
            </span>
          </div>

          <AdminSurface>
              {items.map((consumption, index) => (
                <div
                  key={consumption.id}
                  className="flex items-center gap-3 px-4 py-3.5 dl-stagger-row"
                  style={{
                    borderTop: index > 0 ? '1px solid var(--color-border)' : undefined,
                    animationDelay: `${120 + index * 45}ms`,
                  }}
                >
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="m-0 text-[13px] font-semibold leading-[1.3]" style={CLAMPED_NAME_STYLE}>
                      {consumption.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[12px] m-0 font-extrabold tabular-nums whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                        {formatMoney(consumption.price)}
                      </span>
                      <Badge variant={consumption.is_active ? 'success' : 'secondary'} size="sm">
                        {consumption.is_active ? 'Zichtbaar' : 'Verborgen'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-center">
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
                </div>
              ))}
          </AdminSurface>
        </section>
      ))}
    </div>
  )
}
