<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Beef, MapPin, AlertTriangle, Radio } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import StatsCard from '@/components/StatsCard.vue'
import HerdCharts from '@/components/HerdCharts.vue'
import { getVacasByUser, type Cow } from '@/services/Cows'
import { useUser } from '@/composables/useUser'

const router = useRouter()
const { userId, loadUser } = useUser()

const cattleList = ref<Cow[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Cargar datos del usuario y sus vacas
onMounted(async () => {
  await loadUser()
  if (userId.value) {
    await loadCattle()
  }
})

const loadCattle = async () => {
  if (!userId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    cattleList.value = await getVacasByUser(userId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar el ganado'
    console.error('Error loading cattle:', err)
  } finally {
    isLoading.value = false
  }
}

// Transformar los datos de la API al formato que espera el componente
const cattleData = computed(() => {
  return cattleList.value.map(cow => ({
    id: cow.id,
    tag: cow.name || cow.ear_tag || `Vaca ${cow.id}`,
    image: cow.image || '/placeholder-cow.jpg',
    zone: cow.tag?.current_location || null,
    lastSeen: cow.tag?.current_location ? 'Activo' : 'Sin señal'
  }))
})

const totalCattle = computed(() => cattleData.value.length)
const onlineCattle = computed(() => cattleData.value.filter((c) => c.zone).length)
const offlineCattle = computed(() => cattleData.value.filter((c) => !c.zone).length)

const zoneCounts = computed(() => {
  return cattleData.value.reduce(
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
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
      <p class="text-destructive text-sm">{{ error }}</p>
      <Button @click="loadCattle" variant="outline" size="sm" class="mt-2">
        Reintentar
      </Button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Welcome Section with Total Cattle -->
      <div class="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
        <div class="w-full sm:w-auto">
          <h1 class="text-2xl sm:text-3xl font-bold text-foreground">Panel de Control</h1>
          <p class="text-sm sm:text-base text-muted-foreground mt-1">Resumen general de tu ganadería</p>
        </div>
        <Button
          variant="outline"
          size="lg"
          class="flex items-center gap-2 sm:gap-3 h-auto py-2 sm:py-3 px-3 sm:px-4 hover:bg-primary/5 hover:border-primary transition-colors bg-transparent w-full sm:w-auto justify-center sm:justify-start"
          @click="router.push('/dashboard/cattle')"
        >
          <div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Beef class="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div class="text-left">
            <p class="text-xs text-muted-foreground font-medium">Total de Ganado</p>
            <p class="text-xl sm:text-2xl font-bold text-foreground">{{ totalCattle }}</p>
          </div>
        </Button>
      </div>

      <!-- Stats Section -->
      <div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
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
          :description="`${totalCattle > 0 ? Math.round((onlineCattle / totalCattle) * 100) : 0}% del total`"
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
      <HerdCharts :cattleData="cattleData" />
    </template>
  </div>
</template>