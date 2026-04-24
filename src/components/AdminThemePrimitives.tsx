import type { ButtonHTMLAttributes, CSSProperties, FC, HTMLAttributes, ReactNode } from 'react'
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
  style?: CSSProperties
}

interface AdminEmptyStateProps {
  icon: FC<IconProps>
  title: ReactNode
  description: ReactNode
  action?: ReactNode
  tone?: IconChipTone
  className?: string
}

interface AdminSurfaceProps {
  children: ReactNode
  className?: string
  padded?: boolean
  style?: CSSProperties
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

export function AdminSurface({ children, className, padded = false, style }: AdminSurfaceProps) {
  return (
    <div
      className={cn('rounded-card border overflow-hidden', padded && 'p-3.5', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', ...style }}
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
        <IconChip tone={tone} icon={icon} size={36} />
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
  style,
}: AdminStatTileProps) {
  return (
    <div
      className={cn('h-full min-w-0 rounded-chip border px-3 py-2.5', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', ...style }}
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
  action,
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
      {action && <div className="mt-5">{action}</div>}
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
  trailing?: ReactNode
  className?: string
}

export function PageHeader({ title, sub, meta, trailing, className }: PageHeaderProps) {
  return (
    <div
      className={cn('px-5 pt-[14px] pb-4', className)}
      style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <h1
          className="m-0 text-[22px] font-extrabold tracking-[-0.5px]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h1>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
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

/* ───────────── Skeletons ─────────────
   Consistent shimmer-placeholders die de echte content-shapes spiegelen.
   Gebruik SkeletonList binnen een Surface, SkeletonStatTiles als grid. */
interface SkeletonRowProps {
  leading?: 'chip' | 'avatar' | 'none'
  trailing?: 'amount' | 'action' | 'caret' | 'none'
  hasSub?: boolean
  first?: boolean
}

export function SkeletonRow({
  leading = 'chip',
  trailing = 'amount',
  hasSub = true,
  first = false,
}: SkeletonRowProps) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3.5"
      style={{ borderTop: first ? 'none' : '1px solid var(--color-border)' }}
    >
      {leading === 'chip' && <div className="dl-skel w-9 h-9 rounded-chip shrink-0" />}
      {leading === 'avatar' && <div className="dl-skel w-9 h-9 rounded-full shrink-0" />}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="dl-skel h-3 w-2/3 rounded" />
        {hasSub && <div className="dl-skel h-2.5 w-1/3 rounded" />}
      </div>
      {trailing === 'amount' && <div className="dl-skel h-4 w-14 rounded shrink-0" />}
      {trailing === 'action' && <div className="dl-skel h-10 w-10 rounded-[11px] shrink-0" />}
      {trailing === 'caret' && <div className="dl-skel h-3 w-3 rounded shrink-0" />}
    </div>
  )
}

interface SkeletonListProps extends Omit<SkeletonRowProps, 'first'> {
  rows?: number
  className?: string
}

export function SkeletonList({ rows = 4, className, ...rowProps }: SkeletonListProps) {
  return (
    <AdminSurface className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} first={i === 0} {...rowProps} />
      ))}
    </AdminSurface>
  )
}

interface SkeletonStatTilesProps {
  count?: number
  className?: string
  fullWidthLast?: boolean
}

export function SkeletonStatTiles({ count = 2, className, fullWidthLast = false }: SkeletonStatTilesProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-2.5', className)}>
      {Array.from({ length: count }).map((_, i) => {
        const isLast = i === count - 1
        const spanFull = fullWidthLast && isLast && count % 2 === 1
        return (
          <div
            key={i}
            className={cn('h-full min-w-0 rounded-chip border px-3 py-2.5', spanFull && 'col-span-2')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="dl-skel h-2.5 w-12 rounded" />
              <div className="dl-skel h-6 w-6 rounded-[7px] shrink-0" />
            </div>
            <div className="dl-skel h-4 w-16 rounded" />
          </div>
        )
      })}
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
