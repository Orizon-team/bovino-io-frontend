<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Radio, CheckCircle2, Clock, ChevronDown, CheckSquare } from 'lucide-vue-next'
import { getEventsByUser, type EventFromAPI } from '@/services/Alerts'

// ============================================================================
// TIPOS
// ============================================================================

type AlertType = 'critical' | 'warning' | 'success' | 'resolved' | 'info'

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
  resolved: boolean
}

// ============================================================================
// ESTADO
// ============================================================================

const expandedGroups = ref<ExpandedGroups>({
  critical: true,
  warning: true,
  success: true,
  resolved: true,
})

const alerts = ref<Alert[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// ============================================================================
// COMPUTED
// ============================================================================

const criticalAlerts = computed(() => alerts.value.filter((a) => a.type === 'critical'))
const warningAlerts = computed(() => alerts.value.filter((a) => a.type === 'warning'))
const successAlerts = computed(() => alerts.value.filter((a) => a.type === 'success'))
const resolvedAlerts = computed(() => alerts.value.filter((a) => a.type === 'resolved'))

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
  if (type.includes('resolved') || type.includes('resuelto')) {
    return 'resolved'
  }
  
  return 'info'
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
    case 'resolved':
      return CheckSquare
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
    case 'resolved':
      return 'h-5 w-5 text-gray-600'
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
    case 'resolved':
      return 'bg-gray-200 text-gray-600 border-transparent'
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
    case 'resolved':
      return 'Resuelta'
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
    <div v-if="!loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      <!-- Resueltas Hoy -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Resueltas Hoy</p>
              <p class="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-1">{{ resolvedAlerts.length }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-500/10">
              <CheckSquare class="h-6 w-6 text-gray-600 dark:text-gray-500" />
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
              <ChevronDown
                :class="[
                  'h-5 w-5 text-muted-foreground transition-transform duration-200',
                  expandedGroups.critical ? 'rotate-180' : ''
                ]"
              />
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
              <ChevronDown
                :class="[
                  'h-5 w-5 text-muted-foreground transition-transform duration-200',
                  expandedGroups.warning ? 'rotate-180' : ''
                ]"
              />
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
              <ChevronDown
                :class="[
                  'h-5 w-5 text-muted-foreground transition-transform duration-200',
                  expandedGroups.success ? 'rotate-180' : ''
                ]"
              />
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
          </div>
        </CardContent>
        <CardContent v-if="expandedGroups.success && successAlerts.length === 0" class="text-center py-6 text-muted-foreground">
          No hay alertas en esta categoría
        </CardContent>
      </Card>

      <!-- GRUPO: Resueltas -->
      <Card class="overflow-hidden">
        <button @click="toggleGroup('resolved')" class="w-full">
          <CardHeader class="py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <CheckSquare class="h-5 w-5 text-gray-600" />
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-foreground">Resueltas</h3>
                  <Badge variant="outline" :class="getBadgeClass('resolved')">
                    {{ resolvedAlerts.length }}
                  </Badge>
                </div>
              </div>
              <ChevronDown
                :class="[
                  'h-5 w-5 text-muted-foreground transition-transform duration-200',
                  expandedGroups.resolved ? 'rotate-180' : ''
                ]"
              />
            </div>
          </CardHeader>
        </button>
        <CardContent v-if="expandedGroups.resolved && resolvedAlerts.length > 0" class="space-y-3 border-t pt-4">
          <div
            v-for="alert in resolvedAlerts"
            :key="alert.id"
            class="flex items-start justify-between p-3 rounded-lg bg-gray-500/10 hover:bg-accent/50 transition-colors"
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
          </div>
        </CardContent>
        <CardContent v-if="expandedGroups.resolved && resolvedAlerts.length === 0" class="text-center py-6 text-muted-foreground">
          No hay alertas en esta categoría
        </CardContent>
      </Card>
    </div>
  </div>
</template>