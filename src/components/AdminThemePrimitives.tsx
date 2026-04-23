import type { ButtonHTMLAttributes, FC, HTMLAttributes, ReactNode } from 'react'
import type { IconProps } from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import { IconChip, type IconChipTone } from './IconChip'

const VALUE_TONE_STYLE: Record<'default' | 'primary' | 'success' | 'danger' | 'warning', string> = {
  default: 'var(--color-text-primary)',
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  danger: 'var(--color-danger)',
  warning: 'var(--color-warning)',
}

interface AdminOverviewCardProps {
  icon: FC<IconProps>
  tone?: IconChipTone
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  children?: ReactNode
  className?: string
}

interface AdminStatTileProps {
  label: string
  value: ReactNode
  icon?: FC<IconProps>
  tone?: IconChipTone
  valueTone?: 'default' | 'primary' | 'success' | 'danger' | 'warning'
  hint?: ReactNode
  className?: string
  labelClassName?: string
  valueClassName?: string
}

interface AdminEmptyStateProps {
  icon: FC<IconProps>
  title: ReactNode
  description: ReactNode
  tone?: IconChipTone
  className?: string
}

interface AdminSurfaceProps {
  children: ReactNode
  className?: string
  padded?: boolean
}

export function AdminSectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn('m-0 ml-0.5 text-[11px] font-extrabold uppercase tracking-[1.2px]', className)}
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </p>
  )
}

export function AdminSurface({ children, className, padded = false }: AdminSurfaceProps) {
  return (
    <div
      className={cn('rounded-card border overflow-hidden', padded && 'p-3.5', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {children}
    </div>
  )
}

export function AdminOverviewCard({
  icon,
  tone = 'primary',
  eyebrow,
  title,
  description,
  badge,
  children,
  className,
}: AdminOverviewCardProps) {
  return (
    <section
      className={cn('rounded-card border p-3.5', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start gap-3">
        <IconChip tone={tone} icon={icon} size={34} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="m-0 text-[11px] font-extrabold uppercase tracking-[1.2px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {eyebrow}
              </p>
              <div
                className="mt-0.5 text-[16px] font-extrabold tracking-[-0.4px]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </div>
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p
              className="m-0 mt-1 text-[12px] leading-[1.55]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: 'var(--color-border)' }}>
          {children}
        </div>
      )}
    </section>
  )
}

export function AdminStatTile({
  label,
  value,
  icon,
  tone = 'primary',
  valueTone = 'default',
  hint,
  className,
  labelClassName,
  valueClassName,
}: AdminStatTileProps) {
  return (
    <div
      className={cn('h-full min-w-0 rounded-[12px] border px-3 py-2.5', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p
          className={cn(
            'm-0 min-w-0 text-[10px] font-extrabold uppercase tracking-[1px] leading-[1.2]',
            labelClassName,
          )}
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </p>
        {icon && <IconChip tone={tone} icon={icon} size={24} />}
      </div>
      <p
        className={cn(
          'm-0 truncate text-[18px] font-extrabold tracking-[-0.4px] tabular-nums whitespace-nowrap leading-none',
          valueClassName,
        )}
        style={{ color: VALUE_TONE_STYLE[valueTone] }}
      >
        {value}
      </p>
      {hint && (
        <p className="m-0 mt-1 text-[11px] leading-[1.5]" style={{ color: 'var(--color-text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

export function AdminEmptyState({
  icon,
  title,
  description,
  tone = 'primary',
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn('rounded-card border px-4 py-10 flex flex-col items-center text-center', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <IconChip tone={tone} icon={icon} size={48} />
      <p className="m-0 mt-3 text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </p>
      <p className="m-0 mt-1 text-[13px] leading-[1.55]" style={{ color: 'var(--color-text-muted)' }}>
        {description}
      </p>
    </div>
  )
}

/* ───────────── PageHeader ─────────────
   Surface-variant: wit/oppervlakte bg + border-bottom. Gebruikt op user/leiding
   pagina's met platte titel + optionele muted sub + optionele meta-slot. */
interface PageHeaderProps {
  title: ReactNode
  sub?: ReactNode
  meta?: ReactNode
  className?: string
}

export function PageHeader({ title, sub, meta, className }: PageHeaderProps) {
  return (
    <div
      className={cn('px-5 pt-[14px] pb-4', className)}
      style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
    >
      <h1
        className="m-0 text-[22px] font-extrabold tracking-[-0.5px]"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="m-0 mt-0.5 text-[12px] font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {sub}
        </p>
      )}
      {meta && <div className="mt-2 flex flex-wrap gap-1.5">{meta}</div>}
    </div>
  )
}

/* ───────────── ListRow ─────────────
   Gestandaardiseerde container voor lijstitems binnen AdminSurface: vaste
   padding, border-top tussen items, pressed-state. Tapbaar = button, anders
   div. Content wordt door de caller bepaald. */
type ListRowBaseProps = {
  first?: boolean
  className?: string
  children: ReactNode
}

type ListRowButtonProps = ListRowBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    onClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
  }

type ListRowDivProps = ListRowBaseProps &
  Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'onClick'> & {
    onClick?: undefined
  }

const LIST_ROW_BASE = 'block w-full px-3.5 py-3.5 text-left'
const LIST_ROW_PRESS = 'active:opacity-70 transition-opacity'

export function ListRow(props: ListRowButtonProps | ListRowDivProps) {
  const { first, className, children, ...rest } = props
  const style = {
    borderTop: first ? 'none' : '1px solid var(--color-border)',
    fontFamily: 'inherit',
  } as const

  if ('onClick' in props && props.onClick) {
    const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>
    return (
      <button
        type="button"
        {...buttonProps}
        className={cn(LIST_ROW_BASE, LIST_ROW_PRESS, className)}
        style={style}
      >
        {children}
      </button>
    )
  }

  const divProps = rest as HTMLAttributes<HTMLDivElement>
  return (
    <div {...divProps} className={cn(LIST_ROW_BASE, className)} style={style}>
      {children}
    </div>
  )
}

/* ───────────── DetailRow ─────────────
   Key/value regel in detail-drawers. Vervangt PaymentDetailRow + TxDetailRow
   duplicaten. */
interface DetailRowProps {
  label: ReactNode
  value: ReactNode
  first?: boolean
}

export function DetailRow({ label, value, first = false }: DetailRowProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3.5 py-3"
      style={{ borderTop: first ? 'none' : '1px solid var(--color-border)' }}
    >
      <span
        className="text-[11px] font-extrabold uppercase tracking-[1.2px]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </span>
      <span
        className="text-[13px] font-bold text-right"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}

/* ───────────── Aliases ─────────────
   Nieuwe namen voor bestaande primitives — zodat ze buiten admin-context
   nette namen hebben. Oude exports blijven bestaan voor compat. */
export {
  AdminSectionLabel as SectionLabel,
  AdminSurface as Surface,
  AdminEmptyState as EmptyState,
  AdminStatTile as StatTile,
  AdminOverviewCard as OverviewCard,
}
