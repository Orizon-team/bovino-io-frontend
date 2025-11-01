<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, CheckCircle2, Info, Clock } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

interface Props {
  offlineCount: number
}

const props = defineProps<Props>()

interface Notification {
  id: string
  type: 'alert' | 'success' | 'info'
  title: string
  message: string
  time: string
}

const notifications = computed<Notification[]>(() => {
  const baseNotifications: Notification[] = [
    {
      id: '2',
      type: 'success',
      title: 'Nuevo animal registrado',
      message: 'El Pinto ha sido agregado exitosamente al sistema',
      time: 'Hace 1 hora',
    },
    {
      id: '3',
      type: 'info',
      title: 'Mantenimiento programado',
      message: 'Sondeador en Establo A requiere revisión de batería',
      time: 'Hace 3 horas',
    },
  ]

  if (props.offlineCount > 0) {
    return [
      {
        id: '1',
        type: 'alert',
        title: 'Animales sin señal',
        message: `${props.offlineCount} ${props.offlineCount === 1 ? 'animal no está' : 'animales no están'} siendo detectado${props.offlineCount === 1 ? '' : 's'} por los sondeadores`,
        time: 'Hace 5 minutos',
      },
      ...baseNotifications,
    ]
  }

  return baseNotifications
})

const getNotificationClass = (type: Notification['type']) => {
  return type === 'alert' ? 'bg-destructive/5' : ''
}

const getIconColor = (type: Notification['type']) => {
  switch (type) {
    case 'alert':
      return 'text-destructive'
    case 'success':
      return 'text-green-600'
    case 'info':
      return 'text-blue-600'
  }
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex items-center justify-between p-4 pb-3">
      <div>
        <h3 class="font-semibold text-foreground">Notificaciones</h3>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ notifications.length }} {{ notifications.length === 1 ? 'notificación' : 'notificaciones' }}
        </p>
      </div>
      <Button variant="ghost" size="sm" class="text-xs">
        Marcar todas como leídas
      </Button>
    </div>

    <div class="w-full border-t border-border"></div>

    <div class="h-[400px] overflow-y-auto">
      <div 
        v-if="notifications.length === 0"
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
      <Button variant="ghost" size="sm" class="w-full text-xs">
        Ver todas las notificaciones
      </Button>
    </div>
  </div>
</template>