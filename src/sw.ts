/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope

// Precache manifest inyectado por Vite PWA
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

// Cache para páginas
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60
      })
    ]
  }),
  'GET'
)

// Cache para Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  }),
  'GET'
)

// EVENTO PUSH - Recibir notificaciones de NestJS
self.addEventListener('push', (event: PushEvent) => {
  console.log('✅ Evento push recibido:', event)

  if (!event.data) {
    console.log('Push sin datos')
    return
  }

  const data = event.data.json()
  
  const options: NotificationOptions = {
    body: data.body || 'Nueva notificación',
    icon: '/pwa-192.svg',
    badge: '/pwa-192.svg',
    tag: data.tag || 'default-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.customData || {}
  }

  console.log('✅ Mostrando notificación:', data.title, options)

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notificación', options)
  )
})

// CLIC EN NOTIFICACIÓN - Navegar a URL
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  
  const urlToOpen = event.notification.data.url || '/'
  
  event.waitUntil(
    (self.clients as any).matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any[]) => {
      for (let i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url === urlToOpen) {
          return windowClients[i].focus()
        }
      }
      return (self.clients as any).openWindow(urlToOpen)
    })
  )
})