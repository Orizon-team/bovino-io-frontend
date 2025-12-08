import { io, Socket } from 'socket.io-client'

// Allow overriding the WebSocket URL via Vite env var `VITE_WS_URL` for local testing.
// Falls back to the production backend URL when not provided.
const SOCKET_URL = 'https://bovino-io-backend.onrender.com'
/**
 * Tipo de evento de actualización de dispositivo ESP32
 */
export type DeviceUpdateEvent = {
  id: number
  type: string
  location: string | null
  battery_level: number
  status: string
  mac_address?: string | null
  zone: {
    id: number
    name: string
  }
}

/**
 * Evento para actualizaciones de Tags (aretes/etiquetas)
 */
export type TagEvent = {
  id: number
  mac_address: string
  battery_level: number
  status: string
  current_location: string | { name: string } | null
  last_transmission?: string
}

/**
 * Callbacks para eventos de WebSocket
 */
export type WebSocketCallbacks = {
  onDeviceUpdate?: (device: DeviceUpdateEvent) => void
  onConnect?: (socketId: string) => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  // Eventos relacionados al registro de vacas
  onCowRegistrationRequest?: (payload: CowRegistrationRequest) => void
  onCowRegistrationTimeout?: (payload?: CowRegistrationTimeout) => void
  onCowRegistrationError?: (payload?: CowRegistrationError) => void
  // Eventos para suscripción individual de vacas
  onCowStatus?: (cow: any) => void
  onCowError?: (err: any) => void
  // Eventos CRUD de vacas y cambios del usuario
  onCowCreated?: (cow: any) => void
  onCowUpdated?: (cow: any) => void
  onCowDeleted?: (payload: { id: number } | any) => void
  onUserCowsUpdated?: (payload: any) => void
  // Eventos CRUD/estado de Tags
  onTagCreated?: (tag: TagEvent) => void
  onTagUpdated?: (tag: TagEvent) => void
  onTagDeleted?: (payload: { id: number } | any) => void
}

/** Payload que el backend envía cuando un tag está listo para registro */
export type CowRegistrationRequest = {
  message: any
  mensaje: any
  // Campos que el backend proporciona en el payload de registro de tag
  tag_id: number
  user: { id_user: number }
  redirect_url: string | null
  // Campos opcionales/legacy que pueden venir según backend
  id?: any
  tag?: any
  mac_address?: any
  zone?: any
  ear_tag?: any
}

export type CowRegistrationTimeout = {
  tag_id?: number
  user?: { id_user?: number }
  message?: string
}

export type CowRegistrationError = {
  code?: string | number
  message?: string
  details?: any
}

/**
 * Cliente WebSocket singleton para la aplicación
 * Maneja la conexión y eventos de dispositivos ESP32
 */
class WebSocketClient {
  private socket: Socket | null = null
  private callbacks: WebSocketCallbacks = {}
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null

  /**
   * Inicializa la conexión WebSocket con el servidor
   * @param callbacks - Funciones callback para manejar eventos
   */
  connect(callbacks: WebSocketCallbacks = {}) {
    // Evitar múltiples conexiones
    if (this.socket?.connected) {
      console.warn('WebSocket ya está conectado')
      return
    }

    this.callbacks = callbacks

    // Crear conexión con Socket.IO
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'], // Usar solo WebSocket (no polling)
      reconnection: true, // Reconexión automática
      reconnectionAttempts: 5, // Intentos de reconexión
      reconnectionDelay: 1000, // Delay entre intentos (1s)
    })

    // Log de todos los eventos entrantes para diagnosticar nombres reales desde backend
    this.socket.onAny((event, ...args) => {
      try {
        console.log(`📨 Evento WS recibido: ${event}`, args?.[0])
      } catch {}
    })

    // Evento: Conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado:', this.socket?.id)
      if (this.callbacks.onConnect && this.socket?.id) {
        this.callbacks.onConnect(this.socket.id)
      }
      this.startHeartbeat()
    })

    // Evento: Desconexión
    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado')
      this.stopHeartbeat()
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect()
      }
    })

    // Evento: Error de conexión
    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error)
      if (this.callbacks.onError) {
        this.callbacks.onError(error)
      }
    })

    // Evento principal: Actualización de dispositivo ESP32
    this.socket.on('device_esp32.updated', (device: DeviceUpdateEvent) => {
      console.log('📡 Dispositivo actualizado:', device)
      if (this.callbacks.onDeviceUpdate) {
        this.callbacks.onDeviceUpdate(device)
      }
    })

    // Eventos de Tags
    this.socket.on('tag.created', (tag: TagEvent) => {
      console.log('🏷️ tag.created recibido:', tag)
      if (this.callbacks.onTagCreated) this.callbacks.onTagCreated(tag)
    })

    this.socket.on('tag.updated', (tag: TagEvent) => {
      console.log('🏷️♻️ tag.updated recibido:', tag)
      if (this.callbacks.onTagUpdated) this.callbacks.onTagUpdated(tag)
    })

    this.socket.on('tag.deleted', (payload: any) => {
      console.log('🏷️🗑️ tag.deleted recibido:', payload)
      if (this.callbacks.onTagDeleted) this.callbacks.onTagDeleted(payload)
    })

    // Variantes comunes de eventos que algunos backends emiten
    const tagUpdateVariants = [
      'tags.updated',
      'tag.location.updated',
      'tag.location',
      'tag:updated',
      'tags:updated'
    ]
    tagUpdateVariants.forEach((evt) => {
      this.socket?.on(evt, (tag: any) => {
        console.log(`🏷️♻️ ${evt} recibido:`, tag)
        if (this.callbacks.onTagUpdated) this.callbacks.onTagUpdated(tag)
      })
    })

    // Eventos para flujo de registro de vacas
    this.socket.on('cow.registration.request', (payload: CowRegistrationRequest) => {
      console.log('🛰️ cow.registration.request recibido:', payload)
      // Validación básica del payload esperado
      if (!payload || typeof payload.tag_id !== 'number' || !payload.user || typeof payload.user.id_user !== 'number') {
        console.warn('cow.registration.request: payload con formato inesperado', payload)
        // Pasamos el payload igualmente para diagnóstico
        if (this.callbacks.onCowRegistrationRequest) this.callbacks.onCowRegistrationRequest(payload as any)
        return
      }

      if (this.callbacks.onCowRegistrationRequest) this.callbacks.onCowRegistrationRequest(payload)
    })

    this.socket.on('cow.registration.timeout', (payload: CowRegistrationTimeout) => {
      console.log('⏱️ cow.registration.timeout recibido:', payload)
      if (this.callbacks.onCowRegistrationTimeout) this.callbacks.onCowRegistrationTimeout(payload)
    })

    this.socket.on('cow.registration.error', (payload: CowRegistrationError) => {
      console.log('❌ cow.registration.error recibido:', payload)
      if (this.callbacks.onCowRegistrationError) this.callbacks.onCowRegistrationError(payload)
    })

    // Eventos para suscripción individual de vacas
    this.socket.on('cow.status', (cow: any) => {
      console.log('🐄 cow.status recibido:', cow)
      if (this.callbacks.onCowStatus) this.callbacks.onCowStatus(cow)
    })

    this.socket.on('cow.error', (err: any) => {
      console.log('⚠️ cow.error recibido:', err)
      if (this.callbacks.onCowError) this.callbacks.onCowError(err)
    })

    // Eventos CRUD de vacas (si el backend los emite)
    this.socket.on('cow.created', (cow: any) => {
      console.log('🆕 cow.created recibido:', cow)
      if (this.callbacks.onCowCreated) this.callbacks.onCowCreated(cow)
    })

    this.socket.on('cow.updated', (cow: any) => {
      console.log('♻️ cow.updated recibido:', cow)
      if (this.callbacks.onCowUpdated) this.callbacks.onCowUpdated(cow)
    })

    this.socket.on('cow.deleted', (payload: any) => {
      console.log('🗑️ cow.deleted recibido:', payload)
      if (this.callbacks.onCowDeleted) this.callbacks.onCowDeleted(payload)
    })

    // Evento agregado cuando las vacas del usuario cambian en lote
    this.socket.on('user.cows.updated', (payload: any) => {
      console.log('👥 user.cows.updated recibido:', payload)
      if (this.callbacks.onUserCowsUpdated) this.callbacks.onUserCowsUpdated(payload)
    })

    // Variantes posibles en backend
    this.socket.on('cow.added', (cow: any) => {
      console.log('🆕 cow.added recibido:', cow)
      if (this.callbacks.onCowCreated) this.callbacks.onCowCreated(cow)
    })

    this.socket.on('cows.updated', (payload: any) => {
      console.log('📦 cows.updated recibido:', payload)
      if (this.callbacks.onUserCowsUpdated) this.callbacks.onUserCowsUpdated(payload)
    })
  }

  /**
   * Desconecta el WebSocket
   * Debe llamarse al desmontar componentes
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Cerrando conexión WebSocket...')
      this.stopHeartbeat()
      this.socket.close()
      this.socket = null
      this.callbacks = {}
    }
  }

  /**
   * Emitir un evento personalizado al servidor Socket.IO
   */
  emit(event: string, payload?: any) {
    if (!this.socket) {
      console.warn('WebSocket no está inicializado. No se puede emitir:', event)
      return
    }
    this.socket.emit(event, payload)
  }

  /** Conveniencias para suscribirse/desuscribirse por usuario */
  userSubscribe(userId: number) {
    // Emitir la forma canonica que el backend actual espera: { id_user }
    if (!userId) return
    this.emit('user.subscribe', { id_user: userId })
  }

  userUnsubscribe(userId: number) {
    if (!userId) return
    this.emit('user.unsubscribe', { id_user: userId })
  }

  /** Suscribirse a actualizaciones de una vaca específica */
  subscribeCow(id: number) {
    if (!id) return
    console.log('🛰️ Emitting cow.subscribe for id', id)
    this.emit('cow.subscribe', { id })
  }

  /** Dejar de recibir actualizaciones de una vaca específica */
  unsubscribeCow(id: number) {
    if (!id) return
    console.log('🛰️ Emitting cow.unsubscribe for id', id)
    this.emit('cow.unsubscribe', { id })
  }

  /** Solicitar snapshot puntual de una vaca */
  getCow(id: number) {
    if (!id) return
    console.log('🛰️ Emitting cow.get for id', id)
    this.emit('cow.get', { id })
  }

  /**
   * Verifica si el WebSocket está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Obtiene el ID del socket actual
   */
  getSocketId(): string | undefined {
    return this.socket?.id
  }

  private startHeartbeat() {
    this.stopHeartbeat() // Asegurarse de que no haya múltiples intervalos
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        console.log('💓 Enviando ping de heartbeat al servidor...')
        this.socket.emit('ping', { time: new Date().toISOString() })
      }
    }, 5000)

    // Escuchar la respuesta del servidor
    this.socket?.on('pong', (data: any) => {
      console.log('💓 Recibido pong del servidor.', data)
    })
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    // Dejar de escuchar el evento pong para evitar duplicados
    this.socket?.off('pong')
  }
}

// Exportar instancia singleton
export const wsClient = new WebSocketClient()