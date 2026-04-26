import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { StatusBarInset } from './components/StatusBarInset'

function syncViewportHeight() {
  const vh = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-vh', `${vh}px`)
}

if (typeof window !== 'undefined') {
  syncViewportHeight()
  window.addEventListener('resize', syncViewportHeight)
  window.addEventListener('orientationchange', syncViewportHeight)
  window.visualViewport?.addEventListener('resize', syncViewportHeight)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <StatusBarInset />
    </ThemeProvider>
  </StrictMode>,
)
