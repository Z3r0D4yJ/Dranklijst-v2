import * as React from 'react'

interface SwitchProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ id, checked = false, onCheckedChange, disabled, className }, ref) => (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      ref={ref}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-success' : 'bg-border-mid',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span
        className={[
          'pointer-events-none block h-5 w-5 rounded-full',
          'transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
        style={{ background: 'var(--color-white)' }}
      />
    </button>
  )
)
Switch.displayName = 'Switch'

export { Switch }
