<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Beef, MapPin, AlertTriangle, Radio } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import StatsCard from '@/components/StatsCard.vue'
import HerdCharts from '@/components/HerdCharts.vue'

const router = useRouter()

const mockCattle = [
  {
    id: 1,
    tag: "El Pinto",
    image: "/brown-and-white-spotted-cow.jpg",
    zone: "Establo A",
    lastSeen: "Hace 2 minutos",
  },
  {
    id: 2,
    tag: "La Manchada",
    image: "/black-and-white-dairy-cow.jpg",
    zone: "Pastizal Norte",
    lastSeen: "Hace 5 minutos",
  },
  {
    id: 3,
    tag: "El Toro",
    image: "/brown-bull.jpg",
    zone: "Área de Alimentación",
    lastSeen: "Hace 1 minuto",
  },
  {
    id: 4,
    tag: "La Negra",
    image: "/black-cow.png",
    zone: null,
    lastSeen: "Hace 45 minutos",
  },
  {
    id: 5,
    tag: "El Colorado",
    image: "/red-brown-cow.jpg",
    zone: "Pastizal Sur",
    lastSeen: "Hace 3 minutos",
  },
  {
    id: 6,
    tag: "La Blanca",
    image: "/white-cow.jpg",
    zone: "Establo B",
    lastSeen: "Hace 8 minutos",
  },
  {
    id: 7,
    tag: "El Chico",
    image: "/young-brown-calf.jpg",
    zone: null,
    lastSeen: "Hace 1 hora",
  },
  {
    id: 8,
    tag: "La Grande",
    image: "/large-dairy-cow.jpg",
    zone: "Pastizal Norte",
    lastSeen: "Hace 4 minutos",
  },
]

const totalCattle = computed(() => mockCattle.length)
const onlineCattle = computed(() => mockCattle.filter((c) => c.zone).length)
const offlineCattle = computed(() => mockCattle.filter((c) => !c.zone).length)

const zoneCounts = computed(() => {
  return mockCattle.reduce(
    (acc, cattle) => {
      if (cattle.zone) {
        acc[cattle.zone] = (acc[cattle.zone] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )
})

const mostPopularZone = computed(() => {
  const entries = Object.entries(zoneCounts.value).sort((a, b) => b[1] - a[1])
  return entries.length > 0 ? entries[0] : null
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Welcome Section with Total Cattle -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Panel de Control</h1>
        <p class="text-muted-foreground mt-1">Resumen general de tu ganadería</p>
      </div>
      <Button
        variant="outline"
        size="lg"
        class="flex items-center gap-3 h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary transition-colors bg-transparent"
        @click="router.push('/dashboard/cattle')"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Beef class="h-5 w-5 text-primary" />
        </div>
        <div class="text-left">
          <p class="text-xs text-muted-foreground font-medium">Total de Ganado</p>
          <p class="text-2xl font-bold text-foreground">{{ totalCattle }}</p>
        </div>
      </Button>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Zona más Popular"
        :value="mostPopularZone ? mostPopularZone[0] : 'N/A'"
        :description="mostPopularZone ? `${mostPopularZone[1]} animales` : 'Sin datos'"
        :icon="MapPin"
        variant="default"
        @click="router.push('/dashboard/zones')"
      />
      <StatsCard
        title="En Línea"
        :value="onlineCattle"
        :description="`${Math.round((onlineCattle / totalCattle) * 100)}% del total`"
        :icon="Radio"
        variant="success"
        @click="router.push('/dashboard/cattle?filter=online')"
      />
      <StatsCard
        title="Sin Señal"
        :value="offlineCattle"
        :description="offlineCattle > 0 ? 'Requiere atención' : 'Todo en orden'"
        :icon="AlertTriangle"
        :variant="offlineCattle > 0 ? 'danger' : 'success'"
        @click="router.push('/dashboard/alerts')"
      />
    </div>

    <!-- Herd Charts -->
    <HerdCharts :cattleData="mockCattle" />
  </div>
</template>