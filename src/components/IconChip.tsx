import type { FC } from 'react'
import type { IconProps } from '@phosphor-icons/react'
import {
  BeerBottle, BeerStein, Wine, Drop, Coffee, CurrencyEur,
  Warning, CheckCircle, ShoppingCart,
} from '@phosphor-icons/react'
import type { ConsumptionCategory } from '../lib/database.types'

export type IconChipTone =
  | ConsumptionCategory
  | 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

const TONE_STYLES: Record<string, { bg: string; fg: string }> = {
  beer:    { bg: 'var(--color-cat-beer-bg)',   fg: 'var(--color-cat-beer-fg)' },
  wine:    { bg: 'var(--color-cat-wine-bg)',   fg: 'var(--color-cat-wine-fg)' },
  soda:    { bg: 'var(--color-cat-soda-bg)',   fg: 'var(--color-cat-soda-fg)' },
  water:   { bg: 'var(--color-cat-water-bg)',  fg: 'var(--color-cat-water-fg)' },
  coffee:  { bg: 'var(--color-cat-coffee-bg)', fg: 'var(--color-cat-coffee-fg)' },
  primary: { bg: 'var(--color-primary-pale)',  fg: 'var(--color-primary)' },
  success: { bg: 'var(--color-success-bg)',    fg: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-bg)',    fg: 'var(--color-warning)' },
  danger:  { bg: 'var(--color-danger-bg)',     fg: 'var(--color-danger)' },
  neutral: { bg: 'var(--color-surface-alt)',   fg: 'var(--color-text-secondary)' },
  'alcoholisch':      { bg: 'var(--color-cat-beer-bg)',  fg: 'var(--color-cat-beer-fg)' },
  'niet-alcoholisch': { bg: 'var(--color-cat-soda-bg)',  fg: 'var(--color-cat-soda-fg)' },
}

const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
  red:    { bg: 'var(--color-drink-red-bg)',    fg: 'var(--color-drink-red-fg)' },
  orange: { bg: 'var(--color-drink-orange-bg)', fg: 'var(--color-drink-orange-fg)' },
  amber:  { bg: 'var(--color-cat-beer-bg)',     fg: 'var(--color-cat-beer-fg)' },
  green:  { bg: 'var(--color-drink-green-bg)',  fg: 'var(--color-drink-green-fg)' },
  yellow: { bg: 'var(--color-drink-yellow-bg)', fg: 'var(--color-drink-yellow-fg)' },
  brown:  { bg: 'var(--color-cat-coffee-bg)',   fg: 'var(--color-cat-coffee-fg)' },
  beer:   { bg: 'var(--color-cat-beer-bg)',     fg: 'var(--color-cat-beer-fg)' },
}

const ICON_NAME_MAP: Record<string, FC<IconProps>> = {
  BeerBottle,
  BeerStein,
}

const DEFAULT_ICONS: Record<string, FC<IconProps>> = {
  beer:    BeerStein,
  wine:    Wine,
  soda:    BeerBottle,
  water:   Drop,
  coffee:  Coffee,
  primary: CurrencyEur,
  success: CheckCircle,
  warning: Warning,
  danger:  Warning,
  neutral: ShoppingCart,
  'alcoholisch':      BeerStein,
  'niet-alcoholisch': BeerBottle,
}

interface Props {
  tone?: IconChipTone
  icon?: FC<IconProps>
  colorName?: string
  iconName?: string
  size?: number
  iconSize?: number
}

export function IconChip({ tone = 'primary', icon, colorName, iconName, size = 40, iconSize }: Props) {
  const { bg, fg } = (colorName && COLOR_MAP[colorName]) ?? TONE_STYLES[tone] ?? TONE_STYLES.neutral
  const radius = Math.round(size * 0.32)
  const iSize = iconSize ?? Math.round(size * 0.48)
  const IconComponent = icon ?? (iconName && ICON_NAME_MAP[iconName]) ?? DEFAULT_ICONS[tone] ?? ShoppingCart

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconComponent size={iSize} color={fg} weight="regular" />
    </div>
  )
}
