import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

function StatusBarInsetLayer() {
  const insetRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    const syncSafeAreaTop = () => {
      const insetHeight = insetRef.current?.getBoundingClientRect().height ?? 0
      root.style.setProperty('--safe-area-top', `${Math.max(0, Math.round(insetHeight))}px`)
    }

    let frameA = window.requestAnimationFrame(() => {
      syncSafeAreaTop()
      window.requestAnimationFrame(syncSafeAreaTop)
    })

    const handleOrientationChange = () => {
      syncSafeAreaTop()
      frameA = window.requestAnimationFrame(syncSafeAreaTop)
    }

    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.cancelAnimationFrame(frameA)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return (
    <div
      ref={insetRef}
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-40"
      style={{
        height: 'max(env(safe-area-inset-top, 0px), 0px)',
        backgroundColor: 'var(--pwa-status-bar-fill, var(--color-header))',
      }}
    />
  )
}

/**
 * iOS/Android PWA: paints the notch / status-bar band explicitly. Safari often ignores
 * or caches dynamic theme-color; a fixed strip using --pwa-status-bar-fill is reliable.
 * Portaled to document.body so it stacks above #root without sibling paint-order surprises.
 */
export function StatusBarInset() {
  if (typeof document === 'undefined') return null

  return createPortal(<StatusBarInsetLayer />, document.body)
}
