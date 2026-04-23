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
      className={cn('rounded-card border p-4', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start gap-3">
        <IconChip tone={tone} icon={icon} size={40} />
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
                className="mt-1 text-[17px] font-extrabold tracking-[-0.5px]"
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
        <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
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
      className={cn('h-full min-w-0 rounded-[12px] border px-3.5 py-3', className)}
      style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start gap-2.5">
        {icon && <IconChip tone={tone} icon={icon} size={28} />}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'm-0 text-[10px] font-extrabold uppercase tracking-[1px] leading-[1.15]',
              labelClassName,
            )}
            style={{ color: 'var(--color-text-muted)' }}
          >
            {label}
          </p>
          <p
            className={cn(
              'm-0 mt-1 truncate text-[17px] font-extrabold tracking-[-0.4px] tabular-nums whitespace-nowrap leading-none',
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
      </div>
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
