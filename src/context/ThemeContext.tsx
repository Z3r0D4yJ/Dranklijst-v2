import { createContext, useContext, useLayoutEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'system', setMode: () => {} })

function resolveDarkClass(mode: ThemeMode, prefersDark: boolean): boolean {
  return mode === 'dark' || (mode === 'system' && prefersDark)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme') as ThemeMode) ?? 'system'
  })

  function setMode(m: ThemeMode) {
    setModeState(m)
    localStorage.setItem('theme', m)
  }

  const prefersDark =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false

  const isDark = resolveDarkClass(mode, prefersDark)

  // Must run during render so <html class="dark"> exists before children paint.
  // (useEffect ran too late vs useThemeColor’s useLayoutEffect.)
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDark)
  }

  useLayoutEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    function apply(prefersDarkNow: boolean) {
      root.classList.toggle('dark', resolveDarkClass(mode, prefersDarkNow))
    }

    apply(mq.matches)

    if (mode !== 'system') return

    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
