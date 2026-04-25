import { createPortal } from 'react-dom'

function StatusBarInsetLayer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-40 overflow-hidden"
      style={{
        height: 'max(env(safe-area-inset-top, 0px), 0px)',
        backgroundColor: 'var(--pwa-status-bar-fill, var(--color-header))',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'var(--auth-header-pattern-image)',
          backgroundRepeat: 'repeat',
          backgroundSize: '100px 100px',
          opacity: 'var(--auth-header-pattern-opacity)',
        }}
      />
    </div>
  )
}

/**
 * iOS/Android PWA: paints the notch / status-bar band explicitly. Safari often ignores
 * or caches dynamic theme-color; a fixed strip using --pwa-status-bar-fill is reliable.
 * Layout safe-area math stays in CSS so transient 0px measurements on resume can't get stuck.
 * Portaled to document.body so it stacks above #root without sibling paint-order surprises.
 */
export function StatusBarInset() {
  if (typeof document === 'undefined') return null

  return createPortal(<StatusBarInsetLayer />, document.body)
}
