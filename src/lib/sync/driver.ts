import { triggerSync } from './queue'

let started = false

export function startSyncDriver() {
  if (started || typeof window === 'undefined') return
  started = true

  void triggerSync()

  setInterval(() => void triggerSync(), 10_000)

  window.addEventListener('online', () => void triggerSync())

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void triggerSync()
  })
}
