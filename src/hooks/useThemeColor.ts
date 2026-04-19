import { useLayoutEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

/** Resolves e.g. oklch() via the browser’s style engine — reliable for theme-color / iOS. */
function resolveCssVarBackground(varName: string): string | null {
  if (typeof document === 'undefined') return null
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText =
    `position:fixed;left:-100px;top:0;width:2px;height:2px;opacity:0;pointer-events:none;` +
    `background:var(${varName});`
  document.body.appendChild(el)
  const bg = getComputedStyle(el).backgroundColor
  document.body.removeChild(el)
  if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return null
  return bg
}

function getOrCreateThemeMeta(): HTMLMetaElement {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-pwa-dynamic="true"]')
  if (!meta) {
    meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')
    if (meta) meta.setAttribute('data-pwa-dynamic', 'true')
  }
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.setAttribute('data-pwa-dynamic', 'true')
    document.head.appendChild(meta)
  }
  return meta
}

/** Detach + re-append so iOS standalone WebKit picks up theme-color updates (otherwise cached). */
function commitThemeColor(content: string) {
  const meta = getOrCreateThemeMeta()
  meta.content = content
  const head = document.head
  head.removeChild(meta)
  head.appendChild(meta)
}

export function useThemeColor(cssVar: string) {
  const { mode } = useTheme()

  useLayoutEffect(() => {
    const color = resolveCssVarBackground(cssVar)
    if (!color) return

    document.documentElement.style.setProperty('--pwa-status-bar-fill', color)
    commitThemeColor(color)
  }, [cssVar, mode])
}
