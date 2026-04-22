import { useEffect, useRef, useState } from 'react'
import { CaretDown, Check, X } from '@phosphor-icons/react'
import { Badge } from './ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
} from './ui/drawer'

interface Option {
  value: string
  label: string
  badge?: string
  badgeTone?: 'success' | 'primary' | 'warning' | 'muted'
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  icon?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const SELECT_HEIGHT = 44
const SHEET_OPTION_HEIGHT = 52

function supportsTouchSheet() {
  if (typeof window === 'undefined') return false

  const coarsePointer =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(any-pointer: coarse)').matches

  return coarsePointer || navigator.maxTouchPoints > 0
}

function getBadgeVariant(tone: Option['badgeTone']) {
  switch (tone) {
    case 'primary':
      return 'primary'
    case 'warning':
      return 'warning'
    case 'muted':
      return 'secondary'
    case 'success':
    default:
      return 'success'
  }
}

function SelectBadge({ label, tone = 'success' }: { label: string; tone?: Option['badgeTone'] }) {
  return (
    <Badge variant={getBadgeVariant(tone)}>
      {label}
    </Badge>
  )
}

function getMenuLayout(wrapper: HTMLDivElement) {
  const parent = wrapper.parentElement
  if (!parent) return null

  const wrapperRect = wrapper.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()
  const parentStyle = window.getComputedStyle(parent)
  const isHorizontalGroup =
    (parentStyle.display === 'flex' || parentStyle.display === 'inline-flex') &&
    parent.childElementCount > 1 &&
    parentRect.width - wrapperRect.width > 24

  if (!isHorizontalGroup) return null

  return {
    left: parentRect.left - wrapperRect.left,
    width: parentRect.width,
  }
}

export function CustomSelect({ value, onChange, options, placeholder, icon, style, className }: Props) {
  const [open, setOpen] = useState(false)
  const [menuLayout, setMenuLayout] = useState<{ left: number; width: number } | null>(null)
  const [useTouchSheet, setUseTouchSheet] = useState(false)
  const [useNestedSheet, setUseNestedSheet] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((option) => option.value === value)
  const displayLabel = selected?.label ?? placeholder ?? '-'
  const hasEmpty = placeholder !== undefined

  useEffect(() => {
    if (typeof window === 'undefined') return

    function updateTouchMode() {
      setUseTouchSheet(supportsTouchSheet())
    }

    updateTouchMode()
    window.addEventListener('resize', updateTouchMode)

    return () => {
      window.removeEventListener('resize', updateTouchMode)
    }
  }, [])

  useEffect(() => {
    if (!open || useTouchSheet) {
      setMenuLayout(null)
      return
    }

    function updateMenuLayout() {
      const wrapper = ref.current
      if (!wrapper) {
        setMenuLayout(null)
        return
      }

      setMenuLayout(getMenuLayout(wrapper))
    }

    updateMenuLayout()
    window.addEventListener('resize', updateMenuLayout)

    return () => {
      window.removeEventListener('resize', updateMenuLayout)
    }
  }, [open, useTouchSheet])

  useEffect(() => {
    if (!open || useTouchSheet) return

    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, useTouchSheet])

  function renderOption(option: Option, closeAfter = true, showTopBorder = true) {
    return (
      <button
        key={option.value}
        type="button"
        onClick={() => {
          onChange(option.value)
          if (closeAfter) setOpen(false)
        }}
        className="w-full flex items-center gap-3 px-4 text-[14px]"
        style={{
          minHeight: useTouchSheet ? SHEET_OPTION_HEIGHT : SELECT_HEIGHT,
          fontWeight: option.value === value ? 700 : 500,
          color: option.value === value ? 'var(--color-primary)' : 'var(--color-text-primary)',
          background: option.value === value && useTouchSheet ? 'var(--color-primary-pale)' : 'transparent',
          border: 'none',
          borderTop: showTopBorder ? '1px solid var(--color-border)' : 'none',
          fontFamily: 'inherit',
        }}
      >
        <span className="flex-1 text-left truncate">{option.label}</span>
        {option.badge && (
          <SelectBadge label={option.badge} tone={option.badgeTone} />
        )}
        {useTouchSheet && option.value === value && (
          <Check size={16} color="var(--color-primary)" weight="bold" />
        )}
      </button>
    )
  }

  function handleTriggerClick() {
    if (!open) {
      setUseNestedSheet(Boolean(ref.current?.closest('[data-vaul-drawer]')))
    }

    setOpen((current) => !current)
  }

  const SelectSheetComponent = useNestedSheet ? DrawerNested : Drawer

  return (
    <div ref={ref} className={`relative ${className ?? ''}`} style={style} data-swipe-ignore data-no-admin-swipe>
      <button
        type="button"
        onClick={handleTriggerClick}
        className="w-full flex items-center gap-2.5 text-[13px] font-semibold active:scale-[0.98] transition-transform"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-mid)',
          borderRadius: 12,
          height: SELECT_HEIGHT,
          padding: '0 12px',
          boxSizing: 'border-box',
          color: 'var(--color-text-primary)',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1 truncate">{displayLabel}</span>
        {selected?.badge && (
          <SelectBadge label={selected.badge} tone={selected.badgeTone} />
        )}
        <CaretDown
          size={12}
          color="var(--color-text-muted)"
          weight="bold"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 180ms ease',
            flexShrink: 0,
          }}
        />
      </button>

      {!useTouchSheet && open && (
        <div
          className="absolute top-full mt-1 z-50 overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-mid)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            left: menuLayout?.left ?? 0,
            width: menuLayout?.width ?? '100%',
            minWidth: '100%',
          }}
        >
          {hasEmpty && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="w-full text-left px-4 text-[13px]"
              style={{
                height: SELECT_HEIGHT,
                fontWeight: value === '' ? 700 : 500,
                color: value === '' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: 'transparent',
                border: 'none',
                fontFamily: 'inherit',
              }}
            >
              {placeholder}
            </button>
          )}

          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-4 text-[13px]"
              style={{
                height: SELECT_HEIGHT,
                fontWeight: option.value === value ? 700 : 500,
                color: option.value === value ? 'var(--color-primary)' : 'var(--color-text-primary)',
                background: 'transparent',
                border: 'none',
                borderTop: index > 0 || hasEmpty ? '1px solid var(--color-border)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              <span className="flex-1 text-left truncate">{option.label}</span>
              {option.badge && (
                <SelectBadge label={option.badge} tone={option.badgeTone} />
              )}
            </button>
          ))}
        </div>
      )}

      {useTouchSheet && open && (
        <SelectSheetComponent
          open={open}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setUseNestedSheet(false)
            }
            setOpen(nextOpen)
          }}
          dismissible
        >
          <DrawerContent
            className="mx-auto w-full max-w-md rounded-t-[24px] px-0"
            style={{ background: 'var(--color-surface)', maxHeight: 'var(--drawer-max-height)' }}
            data-no-admin-swipe
          >
            <DrawerHeader className="flex items-center justify-between border-b border-[var(--color-border)]">
              <div className="min-w-0">
                <DrawerTitle style={{ color: 'var(--color-text-primary)' }}>
                  {placeholder ?? 'Kies een optie'}
                </DrawerTitle>
                <DrawerDescription style={{ color: 'var(--color-text-muted)' }}>
                  {selected?.label ?? 'Selecteer een waarde uit de lijst hieronder.'}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <button
                  type="button"
                  aria-label="Sluiten"
                  className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                  style={{ background: 'var(--color-surface-alt)' }}
                >
                  <X size={16} color="var(--color-text-secondary)" weight="bold" />
                </button>
              </DrawerClose>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-0 pb-4">
              {hasEmpty && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-5 text-[14px]"
                  style={{
                    minHeight: SHEET_OPTION_HEIGHT,
                    fontWeight: value === '' ? 700 : 500,
                    color: value === '' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    background: value === '' ? 'var(--color-primary-pale)' : 'transparent',
                    border: 'none',
                    borderTop: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <span className="flex-1 text-left truncate">{placeholder}</span>
                  {value === '' && <Check size={16} color="var(--color-primary)" weight="bold" />}
                </button>
              )}

              {options.map((option, index) =>
                renderOption(option, true, hasEmpty || index > 0),
              )}
            </div>
          </DrawerContent>
        </SelectSheetComponent>
      )}
    </div>
  )
}
