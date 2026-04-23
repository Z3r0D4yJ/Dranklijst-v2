import type { FC, ReactNode } from 'react'
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

interface AdminStatusPillProps {
  label: ReactNode
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

const STATUS_PILL_STYLE: Record<
  NonNullable<AdminStatusPillProps['tone']>,
  { bg: string; border: string; text: string }
> = {
  primary: {
    bg: 'var(--color-primary-pale)',
    border: 'var(--color-primary-border)',
    text: 'var(--color-primary)',
  },
  success: {
    bg: 'var(--color-success-bg)',
    border: 'var(--color-success-border)',
    text: 'var(--color-success)',
  },
  warning: {
    bg: 'var(--color-warning-bg)',
    border: 'var(--color-warning-border)',
    text: 'var(--color-warning)',
  },
  danger: {
    bg: 'var(--color-danger-bg)',
    border: 'var(--color-danger-border)',
    text: 'var(--color-danger)',
  },
  neutral: {
    bg: 'var(--color-surface-alt)',
    border: 'var(--color-border)',
    text: 'var(--color-text-secondary)',
  },
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

export function AdminStatusPill({ label, tone = 'neutral', className }: AdminStatusPillProps) {
  const style = STATUS_PILL_STYLE[tone]

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold leading-none whitespace-nowrap',
        className,
      )}
      style={{
        background: style.bg,
        borderColor: style.border,
        color: style.text,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: style.text }}
      />
      {label}
    </span>
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
