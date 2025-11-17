<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BarChart3, PieChart } from 'lucide-vue-next'

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

const hoveredSlice = ref<string | null>(null)
const hoveredBar = ref<string | null>(null)

// Calcular conteos por zona
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
  return Object.entries(counts)
    .map(([zone, count]) => ({ zone, count }))
    .sort((a, b) => b.count - a.count)
})

// Calcular tiempo promedio por zona (simulado basado en conteos)
const averageTimeByZone = computed(() => {
  return zoneCounts.value.map(item => ({
    zone: item.zone,
    hours: Math.round((item.count / props.cattleData.length) * 8 * 10) / 10 // Simular horas
  }))
})

const maxHours = computed(() => {
  return Math.max(...averageTimeByZone.value.map(z => z.hours), 1)
})

// Calcular distribución de tiempo total (porcentajes)
const timeDistribution = computed(() => {
  const total = props.cattleData.length
  if (total === 0) return []
  
  const offline = props.cattleData.filter(c => !c.zone).length
  
  const distribution = zoneCounts.value.map(item => ({
    zone: item.zone,
    percentage: Math.round((item.count / total) * 100)
  }))
  
  if (offline > 0) {
    distribution.push({
      zone: 'Sin señal',
      percentage: Math.round((offline / total) * 100)
    })
  }
  
  return distribution
})

// Colores para el gráfico de pastel
const pieColors = [
  'rgb(139, 92, 246)', // violet-500
  'rgb(167, 139, 250)', // violet-400
  'rgb(196, 181, 253)', // violet-300
  'rgb(221, 214, 254)', // violet-200
  'rgb(237, 233, 254)', // violet-100
  'rgb(245, 243, 255)', // violet-50
]

// Calcular ángulos para el gráfico de pastel
const pieSlices = computed(() => {
  let currentAngle = 0
  return timeDistribution.value.map((item, index) => {
    const angle = (item.percentage / 100) * 360
    const slice = {
      zone: item.zone,
      percentage: item.percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: pieColors[index % pieColors.length]
    }
    currentAngle += angle
    return slice
  })
})

// Función para crear el path del slice del pie
const createPieSlice = (startAngle: number, endAngle: number) => {
  const centerX = 100
  const centerY = 100
  const radius = 80
  
  // Si el slice cubre todo el círculo (o casi), dibujarlo como un círculo completo
  if (endAngle - startAngle >= 359.9) {
    return `M ${centerX} ${centerY} m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`
  }
  
  const startRad = (startAngle - 90) * Math.PI / 180
  const endRad = (endAngle - 90) * Math.PI / 180
  
  const x1 = centerX + radius * Math.cos(startRad)
  const y1 = centerY + radius * Math.sin(startRad)
  const x2 = centerX + radius * Math.cos(endRad)
  const y2 = centerY + radius * Math.sin(endRad)
  
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  
  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg sm:text-xl flex items-center gap-2">
        <BarChart3 class="h-5 w-5 text-primary" />
        Análisis de Comportamiento
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Gráfica de Barras: Tiempo Promedio por Zona -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <BarChart3 class="h-4 w-4 text-muted-foreground" />
            <h3 class="text-sm font-semibold text-foreground">Tiempo Promedio por Zona</h3>
          </div>
          
          <div v-if="averageTimeByZone.length > 0" class="space-y-4">
            <!-- Gráfico de barras -->
            <div class="relative h-64 flex items-end justify-around gap-2 border-b border-l border-border pb-2 pl-2">
              <!-- Eje Y -->
              <div class="absolute left-0 bottom-0 top-0 flex flex-col justify-between text-[10px] text-muted-foreground pr-1">
                <span>{{ Math.ceil(maxHours) }}</span>
                <span>{{ Math.ceil(maxHours * 0.75) }}</span>
                <span>{{ Math.ceil(maxHours * 0.5) }}</span>
                <span>{{ Math.ceil(maxHours * 0.25) }}</span>
                <span class="pb-2">0</span>
              </div>
              
              <!-- Barras -->
              <div class="flex-1 flex items-end justify-around gap-2 ml-8">
                <div 
                  v-for="item in averageTimeByZone" 
                  :key="item.zone"
                  class="flex flex-col items-center gap-1 flex-1 max-w-20 relative group"
                  @mouseenter="hoveredBar = item.zone"
                  @mouseleave="hoveredBar = null"
                >
                  <div class="w-full flex items-end justify-center" :style="{ height: '240px' }">
                    <div 
                      :class="[
                        'w-full rounded-t transition-all duration-300',
                        hoveredBar === item.zone ? 'bg-primary' : 'bg-black'
                      ]"
                      :style="{ height: `${(item.hours / maxHours) * 100}%` }"
                    ></div>
                  </div>
                  
                  <!-- Tooltip -->
                  <div 
                    v-if="hoveredBar === item.zone"
                    class="absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-10 shadow-lg"
                  >
                    <div class="font-semibold">{{ item.zone }}</div>
                    <div class="text-gray-300">{{ item.hours }} horas promedio</div>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                  </div>
                  
                  <span class="text-[10px] text-muted-foreground text-center leading-tight wrap-break-word w-full">
                    {{ item.zone }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="text-center">
              <span class="text-xs text-muted-foreground">Horas</span>
            </div>
          </div>
          
          <div v-else class="flex items-center justify-center h-64 text-sm text-muted-foreground">
            No hay datos disponibles
          </div>
        </div>

        <!-- Gráfica de Pastel: Distribución de Tiempo Total -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <PieChart class="h-4 w-4 text-muted-foreground" />
            <h3 class="text-sm font-semibold text-foreground">Distribución de Tiempo Total</h3>
          </div>
          
          <div v-if="timeDistribution.length > 0" class="flex flex-col items-center gap-6">
            <!-- Gráfico de pastel -->
            <div class="relative w-64 h-64">
              <svg viewBox="0 0 200 200" class="w-full h-full">
                <g v-for="slice in pieSlices" :key="slice.zone">
                  <path
                    :d="createPieSlice(slice.startAngle, slice.endAngle)"
                    :fill="slice.color"
                    :class="[
                      'transition-all duration-200 cursor-pointer',
                      hoveredSlice === slice.zone ? 'opacity-100 brightness-110' : 'opacity-90'
                    ]"
                    :style="{ 
                      stroke: 'white', 
                      strokeWidth: hoveredSlice === slice.zone ? '3' : '2',
                      filter: hoveredSlice === slice.zone ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : 'none'
                    }"
                    @mouseenter="hoveredSlice = slice.zone"
                    @mouseleave="hoveredSlice = null"
                  />
                </g>
              </svg>
              
              <!-- Tooltip central -->
              <div 
                v-if="hoveredSlice"
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white rounded-lg py-3 px-4 shadow-xl pointer-events-none z-20"
              >
                <div class="text-center">
                  <div class="font-bold text-sm whitespace-nowrap">{{ hoveredSlice }}</div>
                  <div class="text-2xl font-bold mt-1">
                    {{ pieSlices.find(s => s.zone === hoveredSlice)?.percentage }}%
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Leyenda -->
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
              <div 
                v-for="slice in pieSlices" 
                :key="slice.zone"
                :class="[
                  'flex items-center gap-2 p-2 rounded-md transition-all duration-200 cursor-pointer',
                  hoveredSlice === slice.zone ? 'bg-secondary scale-105' : 'hover:bg-secondary/50'
                ]"
                @mouseenter="hoveredSlice = slice.zone"
                @mouseleave="hoveredSlice = null"
              >
                <div 
                  class="w-3 h-3 rounded-sm shrink-0 transition-all duration-200"
                  :style="{ 
                    backgroundColor: slice.color,
                    transform: hoveredSlice === slice.zone ? 'scale(1.2)' : 'scale(1)'
                  }"
                ></div>
                <span :class="[
                  'text-xs truncate transition-all duration-200',
                  hoveredSlice === slice.zone ? 'text-foreground font-semibold' : 'text-muted-foreground'
                ]">
                  {{ slice.zone }}: {{ slice.percentage }}%
                </span>
              </div>
            </div>
          </div>
          
          <div v-else class="flex items-center justify-center h-64 text-sm text-muted-foreground">
            No hay datos disponibles
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
