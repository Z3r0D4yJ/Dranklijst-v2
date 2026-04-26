import { useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

function readViewportHeight() {
  const visualHeight = window.visualViewport?.height ?? 0
  return Math.max(window.innerHeight, visualHeight)
}

function StatusBarInsetLayer() {
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    let frame = 0
    let settleTimeoutA = 0
    let settleTimeoutB = 0

    const syncViewportHeight = () => {
      root.style.setProperty('--app-vh', `${readViewportHeight()}px`)
    }

    const scheduleViewportSync = () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settleTimeoutA)
      window.clearTimeout(settleTimeoutB)

      syncViewportHeight()
      frame = window.requestAnimationFrame(syncViewportHeight)
      settleTimeoutA = window.setTimeout(syncViewportHeight, 120)
      settleTimeoutB = window.setTimeout(syncViewportHeight, 320)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') scheduleViewportSync()
    }

    scheduleViewportSync()

    window.addEventListener('resize', scheduleViewportSync)
    window.addEventListener('orientationchange', scheduleViewportSync)
    window.addEventListener('pageshow', scheduleViewportSync)
    window.addEventListener('focus', scheduleViewportSync)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.visualViewport?.addEventListener('resize', scheduleViewportSync)
    window.visualViewport?.addEventListener('scroll', scheduleViewportSync)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settleTimeoutA)
      window.clearTimeout(settleTimeoutB)
      window.removeEventListener('resize', scheduleViewportSync)
      window.removeEventListener('orientationchange', scheduleViewportSync)
      window.removeEventListener('pageshow', scheduleViewportSync)
      window.removeEventListener('focus', scheduleViewportSync)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.visualViewport?.removeEventListener('resize', scheduleViewportSync)
      window.visualViewport?.removeEventListener('scroll', scheduleViewportSync)
    }
  }, [])

  return (
    <div
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
 * Layout safe-area math stays in CSS so transient 0px measurements on resume can't get stuck.
 * We also keep --app-vh in sync here because iOS standalone sometimes launches with a stale
 * short visual viewport until the app is focused or a later frame settles.
 * Portaled to document.body so it stacks above #root without sibling paint-order surprises.
 */
export function StatusBarInset() {
  if (typeof document === 'undefined') return null

  return createPortal(<StatusBarInsetLayer />, document.body)
}
