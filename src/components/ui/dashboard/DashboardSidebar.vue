<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Button from '@/components/ui/button/Button.vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown'
import { Beef, LayoutDashboard, MapPin, Bell, Settings, User, LogOut } from 'lucide-vue-next'
import { useUser } from '@/composables/useUser'

const route = useRoute()
const router = useRouter()

const { userName, userEmail, userInitials, loadUser, clearUser } = useUser()

onMounted(() => {
  loadUser()
})

const navItems = [
  {
    title: 'Panel de Control',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Mi Ganadería',
    href: '/dashboard/cattle',
    icon: Beef,
  },
  {
    title: 'Zonas y Sondeadores',
    href: '/dashboard/zones',
    icon: MapPin,
  },
  {
    title: 'Alertas',
    href: '/dashboard/alerts',
    icon: Bell,
  },
]

const isActive = (href: string) => {
  return route.path === href
}

const getButtonClass = (href: string) => {
  const baseClasses = 'w-full justify-start gap-3'
  const activeClasses = isActive(href)
    ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
    : ''
  
  return [baseClasses, activeClasses].filter(Boolean).join(' ')
}

const handleLogout = () => {
  localStorage.clear()
  clearUser()
  router.push('/')
}

const handleProfile = () => {
  router.push('/dashboard/profile')
}

const handleSettings = () => {
  router.push('/dashboard/settings')
}
</script>

<template>
  <div class="flex h-full w-64 flex-col border-r border-border bg-card">
    <div class="flex h-16 items-center gap-2 border-b border-border px-6">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
        <Beef class="h-6 w-6 text-primary-foreground" />
      </div>
      <div class="flex flex-col">
        <span class="text-lg font-bold text-foreground">Bovino-io</span>
        <span class="text-xs text-muted-foreground">Monitoreo BLE</span>
      </div>
    </div>

    <nav class="flex-1 space-y-1 p-4">
      <div class="space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.href"
          :to="item.href"
          custom
          v-slot="{ navigate, isExactActive }"
        >
          <Button
            :variant="isExactActive ? 'secondary' : 'ghost'"
            :class="getButtonClass(item.href)"
            @click="navigate"
          >
            <component :is="item.icon" class="h-5 w-5" />
            <span>{{ item.title }}</span>
          </Button>
        </RouterLink>
      </div>
    </nav>

    <div class="p-4 pt-0">
      <RouterLink to="/dashboard/settings" custom v-slot="{ navigate }">
        <Button
          variant="ghost"
          :class="getButtonClass('/dashboard/settings')"
          @click="navigate"
        >
          <Settings class="h-5 w-5" />
          <span>Configuración</span>
        </Button>
      </RouterLink>
    </div>

    <div class="border-t border-border p-4">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button 
            variant="ghost" 
            class="w-full justify-start gap-3 h-auto py-3 px-3"
          >
            <Avatar class="h-9 w-9">
              <AvatarFallback class="bg-primary text-primary-foreground">
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>
            <div class="flex flex-col items-start text-left">
              <span class="text-sm font-semibold text-foreground">{{ userName }}</span>
              <span class="text-xs text-muted-foreground">{{ userEmail }}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent class="w-56" align="end" side="top">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem @select="handleProfile">
            <User class="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem @select="handleSettings">
            <Settings class="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem variant="destructive" @select="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>