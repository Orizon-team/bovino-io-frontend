import { io, Socket } from 'socket.io-client'

// Allow overriding the WebSocket URL via Vite env var `VITE_WS_URL` for local testing.
// Falls back to the production backend URL when not provided.
const SOCKET_URL = (import.meta.env?.VITE_WS_URL as string) || 'https://bovino-io-backend.onrender.com'

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
 * Callbacks para eventos de WebSocket
 */
export type WebSocketCallbacks = {
  onDeviceUpdate?: (device: DeviceUpdateEvent) => void
  onConnect?: (socketId: string) => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  // Eventos relacionados al registro de vacas
  onCowRegistrationRequest?: (payload: any) => void
  onCowRegistrationTimeout?: (payload?: any) => void
  onCowRegistrationError?: (payload?: any) => void
  // Eventos para suscripción individual de vacas
  onCowStatus?: (cow: any) => void
  onCowError?: (err: any) => void
}

/**
 * Cliente WebSocket singleton para la aplicación
 * Maneja la conexión y eventos de dispositivos ESP32
 */
class WebSocketClient {
  private socket: Socket | null = null
  private callbacks: WebSocketCallbacks = {}

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

    // Evento: Conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado:', this.socket?.id)
      if (this.callbacks.onConnect && this.socket?.id) {
        this.callbacks.onConnect(this.socket.id)
      }
    })

    // Evento: Desconexión
    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado')
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

    // Eventos para flujo de registro de vacas
    this.socket.on('cow.registration.request', (payload: any) => {
      console.log('🛰️ cow.registration.request recibido:', payload)
      if (this.callbacks.onCowRegistrationRequest) this.callbacks.onCowRegistrationRequest(payload)
    })

    this.socket.on('cow.registration.timeout', (payload: any) => {
      console.log('⏱️ cow.registration.timeout recibido:', payload)
      if (this.callbacks.onCowRegistrationTimeout) this.callbacks.onCowRegistrationTimeout(payload)
    })

    this.socket.on('cow.registration.error', (payload: any) => {
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
  }

  /**
   * Desconecta el WebSocket
   * Debe llamarse al desmontar componentes
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Cerrando conexión WebSocket...')
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
    this.emit('user.subscribe', { id_user: userId })
  }

  userUnsubscribe(userId: number) {
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
}

// Exportar instancia singleton
export const wsClient = new WebSocketClient()