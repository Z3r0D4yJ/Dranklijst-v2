/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Navigation requests: NetworkFirst with offline fallback
const navigationHandler = new NetworkFirst({
  cacheName: 'navigation-cache',
  networkTimeoutSeconds: 5,
})

registerRoute(
  new NavigationRoute(async (options) => {
    try {
      return await navigationHandler.handle(options)
    } catch {
      const offlinePage = await caches.match('/offline.html')
      return offlinePage ?? Response.error()
    }
  })
)

// Supabase API: StaleWhileRevalidate so the app works on slow connections
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co'),
  new StaleWhileRevalidate({ cacheName: 'supabase-cache' })
)

// Push notification ontvangen
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  const data = event.data.json() as {
    title: string
    body: string
    url?: string
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/appstore-images/android/launchericon-192x192.png',
      badge: '/appstore-images/android/launchericon-96x96.png',
      data: { url: data.url ?? '/' },
    })
  )
})

// Klik op notificatie → open/focus app
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const url = (event.notification.data?.url as string) ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        const existing = clients.find(c => c.url.includes(self.location.origin))
        if (existing) {
          existing.focus()
          existing.navigate(url)
        } else {
          self.clients.openWindow(url)
        }
      })
  )
})
