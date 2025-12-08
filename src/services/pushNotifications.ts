const PUSH_ENDPOINT = import.meta.env.VITE_API_BASE_URL ?? 'https://bovino-io-backend.onrender.com';
const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';

function base64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  userId?: number,
) {

  if (!('Notification' in window) || !('PushManager' in window)) {
    console.warn('❌ El navegador no soporta notificaciones push.')
    return
  }

  const permission = await Notification.requestPermission()
  console.log('🔔 Permiso de notificación:', permission)
  
  if (permission !== 'granted') {
    console.log('❌ Permiso de notificaciones no concedido.')
    return
  }
  console.log('✅ Permiso de notificaciones concedido')

  if (!VAPID_KEY) {
    console.warn('❌ VITE_VAPID_PUBLIC_KEY no está configurada.')
    return
  }

  try {
    console.log('📡 Intentando suscribirse al pushManager...')
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(VAPID_KEY),
    })

    console.log('✅ Subscription creada:', subscription)
    console.log('Subscription endpoint:', subscription.endpoint)

    const url = new URL('/push/subscribe', PUSH_ENDPOINT)
    if (userId) url.searchParams.set('userId', String(userId))
    console.log('URL del servidor:', url.toString())

    console.log('Enviando subscription al servidor...')
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })

    console.log('Respuesta del servidor - Status:', response.status)
    console.log('Respuesta del servidor - StatusText:', response.statusText)

    if (!response.ok) {
      
      const errorText = await response.text()
      console.error('❌ Error del servidor:', errorText)
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const responseData = await response.json()
    console.log('✅ Respuesta del servidor:', responseData)
    console.log('🎉 Suscripción a push registrada correctamente.')
  } catch (error) {
    console.error('❌ Error durante la suscripción push:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack')
    throw error
  }
}