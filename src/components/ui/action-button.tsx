import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const actionToneVariants = {
  'primary-soft': 'border-[var(--color-primary-border)] bg-[var(--color-primary-pale)] text-[var(--color-primary)]',
  neutral: 'border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]',
  'success-soft': 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]',
  'danger-soft': 'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
  accent: 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white',
} as const

const iconActionButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center border font-bold transition-transform transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
  {
    variants: {
      variant: actionToneVariants,
      size: {
        sm: 'h-9 w-9 rounded-[10px]',
        md: 'h-10 w-10 rounded-[11px]',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  },
)

const actionPillButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 border font-bold leading-none transition-transform transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
  {
    variants: {
      variant: actionToneVariants,
      size: {
        sm: 'h-8 rounded-[10px] px-3 text-[12px]',
        md: 'h-11 rounded-[12px] px-4 text-[13px]',
      },
    },
    defaultVariants: {
      variant: 'primary-soft',
      size: 'sm',
    },
  },
)

type IconActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconActionButtonVariants>

type ActionPillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof actionPillButtonVariants>

export const IconActionButton = React.forwardRef<HTMLButtonElement, IconActionButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconActionButtonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
IconActionButton.displayName = 'IconActionButton'

export const ActionPillButton = React.forwardRef<HTMLButtonElement, ActionPillButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(actionPillButtonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
ActionPillButton.displayName = 'ActionPillButton'
