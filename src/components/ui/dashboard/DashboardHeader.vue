<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/ui/Button.vue'
import NotificationsPanel from '@/components/ui/dashboard/NotificationsPanel.vue'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Bell } from 'lucide-vue-next'

interface Props {
  offlineCattle?: number
  title?: string
  subtitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  offlineCattle: 0,
  title: 'Panel de Control',
  subtitle: 'Monitoreo en tiempo real de tu ganadería'
})

const notificationsOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
    <div class="flex h-20 items-center justify-between px-6 sm:px-8 lg:px-10">
      <div>
        <h1 class="text-2xl font-bold text-foreground">{{ title }}</h1>
        <p class="text-sm text-muted-foreground">{{ subtitle }}</p>
      </div>

      <div class="flex items-center gap-3">
        <Popover v-model:open="notificationsOpen">
          <PopoverTrigger>
            <Button variant="ghost" size="icon" class="relative">
              <Bell class="h-5 w-5" />
              <span 
                v-if="offlineCattle > 0"
                class="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
              >
                {{ offlineCattle }}
              </span>
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" class="w-80 p-0">
            <NotificationsPanel :offlineCount="offlineCattle" />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  </header>
</template>