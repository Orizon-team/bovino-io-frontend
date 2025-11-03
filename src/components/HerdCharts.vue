<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface CattleData {
  id: number
  tag: string
  image: string
  zone: string | null
  lastSeen: string
}

interface Props {
  cattleData: CattleData[]
}

const props = defineProps<Props>()

const zoneCounts = computed(() => {
  const counts = props.cattleData.reduce(
    (acc, cattle) => {
      if (cattle.zone) {
        acc[cattle.zone] = (acc[cattle.zone] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )
  return Object.entries(counts).map(([zone, count]) => ({ zone, count }))
})

const statusCounts = computed(() => {
  const online = props.cattleData.filter((c) => c.zone).length
  const offline = props.cattleData.filter((c) => !c.zone).length
  return [
    { status: 'En Línea', count: online },
    { status: 'Sin Señal', count: offline },
  ]
})

const maxZoneCount = computed(() => {
  return Math.max(...zoneCounts.value.map(z => z.count), 1)
})

const maxStatusCount = computed(() => {
  return Math.max(...statusCounts.value.map(s => s.count), 1)
})
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Zone Distribution Chart -->
    <Card>
      <CardHeader>
        <CardTitle>Distribución por Zona</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="item in zoneCounts" :key="item.zone" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-foreground">{{ item.zone }}</span>
              <span class="text-muted-foreground">{{ item.count }} animales</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                class="h-full bg-primary transition-all duration-300"
                :style="{ width: `${(item.count / maxZoneCount) * 100}%` }"
              ></div>
            </div>
          </div>
          <div v-if="zoneCounts.length === 0" class="text-center text-sm text-muted-foreground py-8">
            No hay datos disponibles
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Status Distribution Chart -->
    <Card>
      <CardHeader>
        <CardTitle>Estado de Conexión</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="item in statusCounts" :key="item.status" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-foreground">{{ item.status }}</span>
              <span class="text-muted-foreground">{{ item.count }} animales</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                :class="[
                  'h-full transition-all duration-300',
                  item.status === 'En Línea' ? 'bg-green-500' : 'bg-red-500'
                ]"
                :style="{ width: `${(item.count / maxStatusCount) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
