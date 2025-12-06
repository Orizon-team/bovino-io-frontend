<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Radio, CheckCircle2, Clock, ChevronDown, Trash2 } from 'lucide-vue-next'
import { getEventsByUser, deleteEvent, deleteEventsByUserAndType, type EventFromAPI } from '@/services/Alerts'
import { useToast } from 'vue-toastification'

const toast = useToast()

// ============================================================================
// TIPOS
// ============================================================================

type AlertType = 'critical' | 'warning' | 'success' | 'info'

interface Alert {
  id: number
  type: AlertType
  title: string
  description: string
  time: string
  rawEvent?: EventFromAPI
}

interface ExpandedGroups {
  critical: boolean
  warning: boolean
  success: boolean
}

// ============================================================================
// ESTADO
// ============================================================================

const expandedGroups = ref<ExpandedGroups>({
  critical: true,
  warning: true,
  success: true,
})

const alerts = ref<Alert[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const deletingAlerts = ref<Set<number>>(new Set())
const deletingAllByType = ref<Set<AlertType>>(new Set())

const deletedAlertsTemp = ref<Alert[]>([])
let undoTimeoutId: number | null = null

// ============================================================================
// COMPUTED
// ============================================================================

const criticalAlerts = computed(() => alerts.value.filter((a) => a.type === 'critical'))
const warningAlerts = computed(() => alerts.value.filter((a) => a.type === 'warning'))
const successAlerts = computed(() => alerts.value.filter((a) => a.type === 'success'))

// ============================================================================
// FUNCIONES - Mapeo de eventos a alertas
// ============================================================================

/**
 * Convierte el tipo de evento de la API al tipo de alerta de la UI
 */
const mapEventTypeToAlertType = (eventType: string): AlertType => {
  const type = eventType.toLowerCase()
  
  if (type.includes('critical') || type.includes('critico') || type.includes('error')) {
    return 'critical'
  }
  if (type.includes('warning') || type.includes('advertencia') || type.includes('alerta')) {
    return 'warning'
  }
  if (type.includes('success') || type.includes('exito') || type.includes('ok')) {
    return 'success'
  }
  
  return 'info'
}

/**
 * Mapea el tipo de alerta de UI al tipo de evento de la API
 */
const mapAlertTypeToEventType = (alertType: AlertType): string => {
  switch (alertType) {
    case 'critical':
      return 'CRITICAL'
    case 'warning':
      return 'ALERT'
    case 'success':
      return 'SUCCESS'
    default:
      return 'INFO'
  }
}

/**
 * Formatea la hora del evento para mostrar "Hace X tiempo"
 */
const formatEventTime = (fecha: string, hora: string): string => {
  try {
    const eventDateTime = new Date(`${fecha}T${hora}`)
    const now = new Date()
    const diffMs = now.getTime() - eventDateTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Hace menos de 1 minuto'
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
    
    return `${fecha} ${hora}`
  } catch {
    return `${fecha} ${hora}`
  }
}

/**
 * Convierte eventos de la API a formato de alertas para la UI
 */
const mapEventsToAlerts = (events: EventFromAPI[]): Alert[] => {
  return events.map((event) => ({
    id: event.id_event,
    type: mapEventTypeToAlertType(event.Event_Type),
    title: event.Event_Type,
    description: event.Event_Description,
    time: formatEventTime(event.fecha, event.hora),
    rawEvent: event,
  }))
}

// ============================================================================
// FUNCIONES - Carga de datos
// ============================================================================

/**
 * Carga los eventos del usuario desde la API
 */
const loadEvents = async () => {
  loading.value = true
  error.value = null

  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      throw new Error('No se encontró información del usuario')
    }

    const user = JSON.parse(userString)
    const userId = user.id_user

    if (!userId) {
      throw new Error('ID de usuario no válido')
    }

    const events = await getEventsByUser(userId)
    alerts.value = mapEventsToAlerts(events)
  } catch (err) {
    console.error('Error al cargar eventos:', err)
    error.value = err instanceof Error ? err.message : 'Error al cargar los eventos'
  } finally {
    loading.value = false
  }
}

// ============================================================================
// FUNCIONES - Toast con Undo
// ============================================================================

/**
 * Muestra un toast con mensaje y botón de deshacer
 */
const showUndoToast = (count: number, onUndo: () => void) => {
  const ToastContent = {
    render() {
      return h('div', { class: 'flex items-center justify-between gap-4 w-full' }, [
        h('span', `Se ${count === 1 ? 'borró' : 'borraron'} ${count} notificación${count !== 1 ? 'es' : ''}`),
        h(
          'button',
          {
            onClick: onUndo,
            class: 'px-3 py-1 text-sm font-medium bg-white text-gray-900 rounded hover:bg-gray-100 transition-colors',
          },
          'Deshacer'
        ),
      ])
    }
  }

  toast.success(ToastContent, {
    timeout: 5000,
    onClose: () => {
      // Limpiar el temporal cuando se cierre el toast
      deletedAlertsTemp.value = []
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId)
        undoTimeoutId = null
      }
    }
  })
}

/**
 * Maneja el deshacer la eliminación
 */
const handleUndo = () => {
  if (deletedAlertsTemp.value.length > 0) {
    // Restaurar las alertas
    alerts.value = [...alerts.value, ...deletedAlertsTemp.value]
    deletedAlertsTemp.value = []
    
    // Cerrar todos los toasts
    toast.clear()
    
    // Limpiar el timeout
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId)
      undoTimeoutId = null
    }
    
    toast.info('Alertas restauradas')
  }
}

// ============================================================================
// FUNCIONES - Eliminación de alertas
// ============================================================================

/**
 * Elimina una alerta por ID con opción de deshacer
 */
const handleDeleteAlert = async (alertId: number) => {
  try {
    deletingAlerts.value.add(alertId)
    
    // Guardar la alerta antes de eliminarla
    const alertToDelete = alerts.value.find(a => a.id === alertId)
    if (!alertToDelete) return
    
    deletedAlertsTemp.value = [alertToDelete]
    
    // Eliminar de la UI inmediatamente
    alerts.value = alerts.value.filter(a => a.id !== alertId)
    
    // Mostrar toast con opción de deshacer
    showUndoToast(1, handleUndo)
    
    // Esperar 5 segundos antes de eliminar permanentemente
    undoTimeoutId = window.setTimeout(async () => {
      const success = await deleteEvent(alertId)
      
      if (success) {
        console.log('Alerta eliminada permanentemente:', alertId)
        deletedAlertsTemp.value = []
      } else {
        // Si falla, restaurar la alerta
        alerts.value = [...alerts.value, alertToDelete]
        error.value = 'No se pudo eliminar la alerta'
        toast.error('Error al eliminar la alerta')
      }
    }, 5000)
    
  } catch (err) {
    console.error('Error al eliminar alerta:', err)
    error.value = err instanceof Error ? err.message : 'Error al eliminar la alerta'
  } finally {
    deletingAlerts.value.delete(alertId)
  }
}

/**
 * Elimina todas las alertas de un tipo específico con opción de deshacer
 */
const deleteAllByType = async (alertType: AlertType) => {
  try {
    deletingAllByType.value.add(alertType)
    
    const userString = localStorage.getItem('user')
    if (!userString) {
      throw new Error('No se encontró información del usuario')
    }

    const user = JSON.parse(userString)
    const userId = user.id_user

    if (!userId) {
      throw new Error('ID de usuario no válido')
    }

    // Guardar las alertas antes de eliminarlas
    const alertsToDelete = alerts.value.filter(a => a.type === alertType)
    if (alertsToDelete.length === 0) return
    
    deletedAlertsTemp.value = alertsToDelete
    
    // Eliminar de la UI inmediatamente
    alerts.value = alerts.value.filter(a => a.type !== alertType)
    
    // Mostrar toast con opción de deshacer
    showUndoToast(alertsToDelete.length, handleUndo)
    
    // Esperar 5 segundos antes de eliminar permanentemente
    undoTimeoutId = window.setTimeout(async () => {
      const eventType = mapAlertTypeToEventType(alertType)
      const success = await deleteEventsByUserAndType(userId, eventType)
      
      if (success) {
        console.log('Alertas eliminadas permanentemente para el tipo:', alertType)
        deletedAlertsTemp.value = []
      } else {
        // Si falla, restaurar las alertas
        alerts.value = [...alerts.value, ...alertsToDelete]
        error.value = 'No se pudo eliminar las alertas'
        toast.error('Error al eliminar las alertas')
      }
    }, 5000)
    
  } catch (err) {
    console.error('Error al eliminar alertas por tipo:', err)
    error.value = err instanceof Error ? err.message : 'Error al eliminar las alertas'
  } finally {
    deletingAllByType.value.delete(alertType)
  }
}

// ============================================================================
// FUNCIONES - UI
// ============================================================================

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case 'critical':
      return AlertTriangle
    case 'warning':
      return Clock
    case 'success':
      return CheckCircle2
    default:
      return Radio
  }
}

const getAlertIconClass = (type: AlertType) => {
  switch (type) {
    case 'critical':
      return 'h-5 w-5 text-destructive'
    case 'warning':
      return 'h-5 w-5 text-amber-600'
    case 'success':
      return 'h-5 w-5 text-green-600'
    default:
      return 'h-5 w-5 text-primary'
  }
}

const getBadgeClass = (type: AlertType) => {
  switch (type) {
    case 'critical':
      return 'bg-destructive/10 text-destructive border-transparent'
    case 'warning':
      return 'bg-amber-500/10 text-amber-600 border-transparent'
    case 'success':
      return 'bg-green-500/10 text-green-600 border-transparent'
    default:
      return 'bg-primary/20 text-primary border-transparent'
  }
}

const getAlertTypeLabel = (type: AlertType) => {
  switch (type) {
    case 'critical':
      return 'Crítica'
    case 'warning':
      return 'Advertencia'
    case 'success':
      return 'Éxito'
    default:
      return 'Info'
  }
}

const toggleGroup = (group: keyof ExpandedGroups) => {
  expandedGroups.value[group] = !expandedGroups.value[group]
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  loadEvents()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- ========================================================================== -->
    <!-- HEADER -->
    <!-- ========================================================================== -->
    <div>
      <h1 class="text-3xl font-bold text-foreground">Alertas y Notificaciones</h1>
      <p class="text-muted-foreground mt-1">Monitorea eventos importantes del sistema</p>
    </div>

    <!-- ========================================================================== -->
    <!-- ERROR / LOADING -->
    <!-- ========================================================================== -->
    <div v-if="error" class="text-destructive text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
      {{ error }}
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-center">
      <div class="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
      <p class="text-muted-foreground">Cargando alertas...</p>
    </div>

    <!-- ========================================================================== -->
    <!-- TARJETAS DE RESUMEN -->
    <!-- ========================================================================== -->
    <div v-if="!loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Alertas Críticas -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Alertas Críticas</p>
              <p class="text-3xl font-bold text-destructive mt-1">{{ criticalAlerts.length }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle class="h-6 w-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Advertencias -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Advertencias</p>
              <p class="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{{ warningAlerts.length }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <Clock class="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Éxitos -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Éxitos</p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{{ successAlerts.length }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 class="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- ========================================================================== -->
    <!-- HISTORIAL DE ALERTAS -->
    <!-- ========================================================================== -->
    <div v-if="!loading" class="space-y-4">
      <h2 class="text-xl font-semibold text-foreground">Historial de Alertas</h2>

      <!-- GRUPO: Alertas Críticas -->
      <Card class="overflow-hidden">
        <button @click="toggleGroup('critical')" class="w-full">
          <CardHeader class="py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <AlertTriangle class="h-5 w-5 text-destructive" />
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-foreground">Alertas Críticas</h3>
                  <Badge variant="outline" :class="getBadgeClass('critical')">
                    {{ criticalAlerts.length }}
                  </Badge>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  v-if="criticalAlerts.length > 0"
                  size="sm"
                  variant="destructive"
                  @click.stop="deleteAllByType('critical')"
                  :disabled="deletingAllByType.has('critical')"
                  class="mr-2"
                >
                  {{ deletingAllByType.has('critical') ? 'Borrando...' : 'Borrar todas' }}
                </Button>
                <ChevronDown
                  :class="[
                    'h-5 w-5 text-muted-foreground transition-transform duration-200',
                    expandedGroups.critical ? 'rotate-180' : ''
                  ]"
                />
              </div>
            </div>
          </CardHeader>
        </button>
        <CardContent v-if="expandedGroups.critical && criticalAlerts.length > 0" class="space-y-3 border-t pt-4">
          <div
            v-for="alert in criticalAlerts"
            :key="alert.id"
            class="flex items-start justify-between p-3 rounded-lg bg-destructive/10 hover:bg-accent/50 transition-colors"
          >
            <div class="flex items-start gap-3 flex-1">
              <div class="mt-1">
                <component :is="getAlertIcon(alert.type)" :class="getAlertIconClass(alert.type)" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <p class="font-medium text-foreground">{{ alert.title }}</p>
                  <Badge variant="outline" :class="getBadgeClass(alert.type)">
                    {{ getAlertTypeLabel(alert.type) }}
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">{{ alert.description }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <div class="flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    <span>{{ alert.time }}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              @click="handleDeleteAlert(alert.id)"
              :disabled="deletingAlerts.has(alert.id)"
              class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-center"
              title="Eliminar alerta"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <CardContent v-if="expandedGroups.critical && criticalAlerts.length === 0" class="text-center py-6 text-muted-foreground">
          No hay alertas en esta categoría
        </CardContent>
      </Card>

      <!-- GRUPO: Advertencias -->
      <Card class="overflow-hidden">
        <button @click="toggleGroup('warning')" class="w-full">
          <CardHeader class="py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Clock class="h-5 w-5 text-amber-600" />
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-foreground">Advertencias</h3>
                  <Badge variant="outline" :class="getBadgeClass('warning')">
                    {{ warningAlerts.length }}
                  </Badge>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  v-if="warningAlerts.length > 0"
                  size="sm"
                  variant="destructive"
                  @click.stop="deleteAllByType('warning')"
                  :disabled="deletingAllByType.has('warning')"
                  class="mr-2"
                >
                  {{ deletingAllByType.has('warning') ? 'Borrando...' : 'Borrar todas' }}
                </Button>
                <ChevronDown
                  :class="[
                    'h-5 w-5 text-muted-foreground transition-transform duration-200',
                    expandedGroups.warning ? 'rotate-180' : ''
                  ]"
                />
              </div>
            </div>
          </CardHeader>
        </button>
        <CardContent v-if="expandedGroups.warning && warningAlerts.length > 0" class="space-y-3 border-t pt-4">
          <div
            v-for="alert in warningAlerts"
            :key="alert.id"
            class="flex items-start justify-between p-3 rounded-lg bg-amber-500/10 hover:bg-accent/50 transition-colors"
          >
            <div class="flex items-start gap-3 flex-1">
              <div class="mt-1">
                <component :is="getAlertIcon(alert.type)" :class="getAlertIconClass(alert.type)" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <p class="font-medium text-foreground">{{ alert.title }}</p>
                  <Badge variant="outline" :class="getBadgeClass(alert.type)">
                    {{ getAlertTypeLabel(alert.type) }}
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">{{ alert.description }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <div class="flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    <span>{{ alert.time }}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              @click="handleDeleteAlert(alert.id)"
              :disabled="deletingAlerts.has(alert.id)"
              class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-center"
              title="Eliminar alerta"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <CardContent v-if="expandedGroups.warning && warningAlerts.length === 0" class="text-center py-6 text-muted-foreground">
          No hay alertas en esta categoría
        </CardContent>
      </Card>

      <!-- GRUPO: Éxitos -->
      <Card class="overflow-hidden">
        <button @click="toggleGroup('success')" class="w-full">
          <CardHeader class="py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <CheckCircle2 class="h-5 w-5 text-green-600" />
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-foreground">Éxitos</h3>
                  <Badge variant="outline" :class="getBadgeClass('success')">
                    {{ successAlerts.length }}
                  </Badge>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  v-if="successAlerts.length > 0"
                  size="sm"
                  variant="destructive"
                  @click.stop="deleteAllByType('success')"
                  :disabled="deletingAllByType.has('success')"
                  class="mr-2"
                >
                  {{ deletingAllByType.has('success') ? 'Borrando...' : 'Borrar todas' }}
                </Button>
                <ChevronDown
                  :class="[
                    'h-5 w-5 text-muted-foreground transition-transform duration-200',
                    expandedGroups.success ? 'rotate-180' : ''
                  ]"
                />
              </div>
            </div>
          </CardHeader>
        </button>
        <CardContent v-if="expandedGroups.success && successAlerts.length > 0" class="space-y-3 border-t pt-4">
          <div
            v-for="alert in successAlerts"
            :key="alert.id"
            class="flex items-start justify-between p-3 rounded-lg bg-green-500/10 hover:bg-accent/50 transition-colors"
          >
            <div class="flex items-start gap-3 flex-1">
              <div class="mt-1">
                <component :is="getAlertIcon(alert.type)" :class="getAlertIconClass(alert.type)" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <p class="font-medium text-foreground">{{ alert.title }}</p>
                  <Badge variant="outline" :class="getBadgeClass(alert.type)">
                    {{ getAlertTypeLabel(alert.type) }}
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">{{ alert.description }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <div class="flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    <span>{{ alert.time }}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              @click="handleDeleteAlert(alert.id)"
              :disabled="deletingAlerts.has(alert.id)"
              class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-center"
              title="Eliminar alerta"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <CardContent v-if="expandedGroups.success && successAlerts.length === 0" class="text-center py-6 text-muted-foreground">
          No hay alertas en esta categoría
        </CardContent>
      </Card>
    </div>
  </div>
</template>