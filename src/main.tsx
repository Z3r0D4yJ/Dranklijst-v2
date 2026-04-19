import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { StatusBarInset } from './components/StatusBarInset'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <StatusBarInset />
    </ThemeProvider>
  </StrictMode>,
)
