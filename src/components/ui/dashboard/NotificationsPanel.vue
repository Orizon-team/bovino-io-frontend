<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, CheckCircle2, Info, Clock } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import { getEventsByUser, type EventFromAPI } from '@/services/Alerts'

const router = useRouter()


type NotificationType = 'alert' | 'success' | 'info'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  rawEvent?: EventFromAPI
}


const events = ref<EventFromAPI[]>([])
const loading = ref(false)

const mapEventTypeToNotificationType = (eventType: string): NotificationType => {
  const type = eventType.toLowerCase()
  
  if (type.includes('critical') || type.includes('critico') || type.includes('error') || type.includes('alert')) {
    return 'alert'
  }
  if (type.includes('success') || type.includes('exito') || type.includes('ok')) {
    return 'success'
  }
  
  return 'info'
}

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

const loadEvents = async () => {
  loading.value = true

  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      console.warn('No se encontró información del usuario')
      return
    }

    const user = JSON.parse(userString)
    const userId = user.id_user

    if (!userId) {
      console.warn('ID de usuario no válido')
      return
    }

    const apiEvents = await getEventsByUser(userId)
    events.value = apiEvents.sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`)
      const dateB = new Date(`${b.fecha}T${b.hora}`)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (err) {
    console.error('Error al cargar eventos:', err)
  } finally {
    loading.value = false
  }
}

const notifications = computed<Notification[]>(() => {
  const apiNotifications: Notification[] = events.value.slice(0, 5).map((event) => ({
    id: String(event.id_event),
    type: mapEventTypeToNotificationType(event.Event_Type),
    title: event.Event_Type,
    message: event.Event_Description,
    time: formatEventTime(event.fecha, event.hora),
    rawEvent: event,
  }))

  return apiNotifications
})

const getNotificationClass = (type: NotificationType) => {
  return type === 'alert' ? 'bg-destructive/5' : ''
}

const getIconColor = (type: NotificationType) => {
  switch (type) {
    case 'alert':
      return 'text-destructive'
    case 'success':
      return 'text-green-600'
    case 'info':
      return 'text-blue-600'
  }
}

const goToNotifications = () => {
  router.push('/dashboard/alerts')
}

onMounted(() => {
  loadEvents()
})
</script>

<template>
  <div class="flex flex-col">
    <div class="flex items-center justify-between p-4 pb-3">
      <div>
        <h3 class="font-semibold text-foreground">Notificaciones</h3>
        <p class="text-xs text-muted-foreground mt-0.5">
          <span v-if="loading">Cargando...</span>
          <span v-else>
            {{ notifications.length }} {{ notifications.length === 1 ? 'notificación' : 'notificaciones' }}
          </span>
        </p>
      </div>
      <Button variant="ghost" size="sm" class="text-xs">
        Marcar todas como leídas
      </Button>
    </div>

    <div class="w-full border-t border-border"></div>

    <div class="h-[400px] overflow-y-auto">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <p class="text-sm text-muted-foreground">Cargando notificaciones...</p>
      </div>

      <div 
        v-else-if="notifications.length === 0"
        class="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <CheckCircle2 class="h-12 w-12 text-muted-foreground mb-3" />
        <p class="text-sm font-medium text-foreground">No hay notificaciones</p>
        <p class="text-xs text-muted-foreground mt-1">Estás al día con todas las alertas</p>
      </div>

      <div v-else class="divide-y divide-border">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'p-4 hover:bg-accent/50 transition-colors cursor-pointer',
            getNotificationClass(notification.type)
          ]"
          @click="goToNotifications"
        >
          <div class="flex gap-3">
            <div class="mt-0.5">
              <AlertTriangle 
                v-if="notification.type === 'alert'"
                :class="['h-5 w-5', getIconColor(notification.type)]"
              />
              <CheckCircle2 
                v-else-if="notification.type === 'success'"
                :class="['h-5 w-5', getIconColor(notification.type)]"
              />
              <Info 
                v-else
                :class="['h-5 w-5', getIconColor(notification.type)]"
              />
            </div>

            <div class="flex-1 space-y-1">
              <p class="text-sm font-medium text-foreground leading-tight">
                {{ notification.title }}
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                {{ notification.message }}
              </p>
              <div class="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                <Clock class="h-3 w-3" />
                <span>{{ notification.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full border-t border-border"></div>

    <div class="p-3">
      <Button variant="ghost" size="sm" class="w-full text-xs" @click="goToNotifications">
        Ver todas las notificaciones
      </Button>
    </div>
  </div>
</template>