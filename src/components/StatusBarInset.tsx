import { createPortal } from 'react-dom'

/**
 * iOS/Android PWA: paints the notch / status-bar band explicitly. Safari often ignores
 * or caches dynamic theme-color; a fixed strip using --pwa-status-bar-fill is reliable.
 * Portaled to document.body so it stacks above #root without sibling paint-order surprises.
 */
export function StatusBarInset() {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-[2147483646]"
      style={{
        height: 'max(env(safe-area-inset-top, 0px), 0px)',
        backgroundColor: 'var(--pwa-status-bar-fill, var(--color-header))',
      }}
    />,
    document.body,
  )
}
