<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import NotificationsPanel from '@/components/ui/dashboard/NotificationsPanel.vue'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Bell } from 'lucide-vue-next'
import { getEventsByUser, type EventFromAPI } from '@/services/Alerts'

const notificationsOpen = ref(false)
const events = ref<EventFromAPI[]>([])
const loadingNotifications = ref(false)

const loadNotificationsCount = async () => {
  loadingNotifications.value = true

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
    events.value = apiEvents
  } catch (err) {
    console.error('Error al cargar conteo de notificaciones:', err)
  } finally {
    loadingNotifications.value = false
  }
}

const totalNotifications = computed(() => {
  return events.value.length
})

onMounted(() => {
  loadNotificationsCount()
})
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
    <div class="flex h-20 items-center justify-between px-6 sm:px-8 lg:px-10">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Panel de Control</h1>
        <p class="text-sm text-muted-foreground">Monitoreo en tiempo real de tu ganadería</p>
      </div>

      <div class="flex items-center gap-3">
        <Popover v-model:open="notificationsOpen">
          <PopoverTrigger>
            <Button variant="ghost" size="icon" class="relative">
              <Bell class="h-5 w-5" />
              <span 
                v-if="totalNotifications > 0 && !loadingNotifications"
                class="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
              >
                {{ totalNotifications > 99 ? '99+' : totalNotifications }}
              </span>
              <span 
                v-else-if="loadingNotifications"
                class="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted animate-pulse"
              ></span>
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" class="w-80 p-0">
            <NotificationsPanel :offlineCount="0" />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  </header>
</template>