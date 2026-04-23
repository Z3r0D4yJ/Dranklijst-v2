import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border font-bold whitespace-nowrap leading-none transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white',
        secondary: 'border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]',
        outline: 'border-[var(--color-border-mid)] bg-transparent text-[var(--color-text-secondary)]',
        primary: 'border-[var(--color-primary-border)] bg-[var(--color-primary-pale)] text-[var(--color-primary)]',
        success: 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]',
        warning: 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
        danger: 'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
        muted: 'border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]',
        glass: 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.14)] text-[var(--color-header-fg)]',
        onPrimary: 'border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.16)] text-white',
      },
      size: {
        xs: 'h-4 px-1.5 text-[9px]',
        sm: 'h-5 px-2 text-[10px]',
        default: 'h-6 px-2.5 text-[11px]',
        lg: 'h-8 px-4 text-[13px]',
      },
      uppercase: {
        true: 'uppercase tracking-[0.8px]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default',
      uppercase: false,
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  dotPulse?: boolean
}

export function Badge({ className, variant, size, uppercase, dot, dotPulse, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, uppercase }), className)} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotPulse && 'dl-pulse-dot')}
          style={{ background: 'currentColor' }}
        />
      )}
      {children}
    </span>
  )
}
