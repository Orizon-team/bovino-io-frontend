import { io, Socket } from 'socket.io-client'

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
 * Callbacks para eventos de WebSocket
 */
export type WebSocketCallbacks = {
  onDeviceUpdate?: (device: DeviceUpdateEvent) => void
  onConnect?: (socketId: string) => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
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