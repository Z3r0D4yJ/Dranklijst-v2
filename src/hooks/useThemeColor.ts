import { useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

function resolveToRgb(cssColor: string): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = cssColor
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `rgb(${r},${g},${b})`
  } catch {
    return cssColor
  }
}

export function useThemeColor(cssVar: string) {
  const { mode } = useTheme()

  useEffect(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar).trim()
    if (!raw) return

    // Resolve through canvas so the meta content is always a plain rgb() value.
    // This handles oklch, hsl, and any other modern CSS color format that older
    // parsers in the iOS meta-tag stack might not understand.
    const color = resolveToRgb(raw)

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = color
  }, [cssVar, mode])
}
