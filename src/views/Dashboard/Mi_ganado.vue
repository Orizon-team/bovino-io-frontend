<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import {
	Beef,
	Search,
	Plus,
	Filter,
	LayoutGrid,
	List,
	MapPin,
	AlertTriangle,
	Pencil,
	Trash2,
} from 'lucide-vue-next'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'

type BehaviorStats = {
	mostVisitedZones?: { zone: string; percentage: number; visits: number }[]
	waterFrequency?: string
	feedingPreference?: { type: string; percentage: number }[]
	activityPattern?: string
	lastActivities?: { time: string; zone: string; action: string }[]
}

type Cattle = {
	id: number
	tag: string
	image?: string | null
	zone: string | null
	lastSeen: string
	behaviorStats?: BehaviorStats
}

const mockCattle: Cattle[] = [
	{
		id: 1,
		tag: 'El Pinto',
		image: '/brown-and-white-spotted-cow.jpg',
		zone: 'Establo A',
		lastSeen: 'Hace 2 minutos',
		behaviorStats: {
			mostVisitedZones: [
				{ zone: 'Establo A', percentage: 45, visits: 28 },
				{ zone: 'Área de Alimentación', percentage: 30, visits: 18 },
				{ zone: 'Zona de Agua', percentage: 25, visits: 15 },
			],
			waterFrequency: 'Cada 3 horas',
			feedingPreference: [
				{ type: 'Alimento tipo A', percentage: 65 },
				{ type: 'Alimento tipo B', percentage: 35 },
			],
			activityPattern: 'Más activo durante la mañana (6am-11am) y tarde (4pm-7pm)',
			lastActivities: [
				{ time: 'Hace 2 min', zone: 'Establo A', action: 'Descansando en zona de descanso' },
				{ time: 'Hace 45 min', zone: 'Zona de Agua', action: 'Bebiendo agua' },
				{ time: 'Hace 2 horas', zone: 'Área de Alimentación', action: 'Alimentándose' },
			],
		},
	},
	{
		id: 2,
		tag: 'La Manchada',
		image: '/black-and-white-dairy-cow.jpg',
		zone: 'Pastizal Norte',
		lastSeen: 'Hace 5 minutos',
		behaviorStats: {
			mostVisitedZones: [
				{ zone: 'Pastizal Norte', percentage: 55, visits: 35 },
				{ zone: 'Zona de Agua', percentage: 25, visits: 16 },
				{ zone: 'Área de Alimentación', percentage: 20, visits: 12 },
			],
			waterFrequency: 'Cada 2.5 horas',
			feedingPreference: [
				{ type: 'Pasto natural', percentage: 70 },
				{ type: 'Alimento tipo A', percentage: 30 },
			],
			activityPattern: 'Actividad constante durante el día, prefiere pastoreo temprano',
			lastActivities: [
				{ time: 'Hace 5 min', zone: 'Pastizal Norte', action: 'Pastoreando' },
				{ time: 'Hace 1 hora', zone: 'Zona de Agua', action: 'Bebiendo agua' },
				{ time: 'Hace 3 horas', zone: 'Pastizal Norte', action: 'Descansando' },
			],
		},
	},
	{
		id: 3,
		tag: 'El Toro',
		image: '/brown-bull.jpg',
		zone: 'Área de Alimentación',
		lastSeen: 'Hace 1 minuto',
		behaviorStats: {
			mostVisitedZones: [
				{ zone: 'Área de Alimentación', percentage: 40, visits: 25 },
				{ zone: 'Establo B', percentage: 35, visits: 22 },
				{ zone: 'Zona de Agua', percentage: 25, visits: 16 },
			],
			waterFrequency: 'Cada 4 horas',
			feedingPreference: [
				{ type: 'Alimento tipo B', percentage: 80 },
				{ type: 'Alimento tipo A', percentage: 20 },
			],
			activityPattern: 'Picos de actividad al mediodía y al atardecer',
			lastActivities: [
				{ time: 'Hace 1 min', zone: 'Área de Alimentación', action: 'Alimentándose' },
				{ time: 'Hace 30 min', zone: 'Establo B', action: 'Descansando' },
				{ time: 'Hace 2 horas', zone: 'Zona de Agua', action: 'Bebiendo agua' },
			],
		},
	},
	{ id: 4, tag: 'La Negra', image: '/black-cow.png', zone: null, lastSeen: 'Hace 45 minutos' },
	{
		id: 5,
		tag: 'El Colorado',
		image: '/red-brown-cow.jpg',
		zone: 'Pastizal Sur',
		lastSeen: 'Hace 3 minutos',
		behaviorStats: {
			mostVisitedZones: [
				{ zone: 'Pastizal Sur', percentage: 60, visits: 38 },
				{ zone: 'Zona de Agua', percentage: 22, visits: 14 },
				{ zone: 'Área de Alimentación', percentage: 18, visits: 11 },
			],
			waterFrequency: 'Cada 3.5 horas',
			feedingPreference: [
				{ type: 'Pasto natural', percentage: 85 },
				{ type: 'Alimento tipo A', percentage: 15 },
			],
			activityPattern: 'Prefiere pastoreo durante todo el día, menos activo al mediodía',
			lastActivities: [
				{ time: 'Hace 3 min', zone: 'Pastizal Sur', action: 'Pastoreando' },
				{ time: 'Hace 1 hora', zone: 'Zona de Agua', action: 'Bebiendo agua' },
				{ time: 'Hace 4 horas', zone: 'Pastizal Sur', action: 'Descansando bajo sombra' },
			],
		},
	},
	{
		id: 6,
		tag: 'La Blanca',
		image: '/white-cow.jpg',
		zone: 'Establo B',
		lastSeen: 'Hace 8 minutos',
		behaviorStats: {
			mostVisitedZones: [
				{ zone: 'Establo B', percentage: 50, visits: 31 },
				{ zone: 'Área de Alimentación', percentage: 28, visits: 17 },
				{ zone: 'Zona de Agua', percentage: 22, visits: 14 },
			],
			waterFrequency: 'Cada 3 horas',
			feedingPreference: [
				{ type: 'Alimento tipo A', percentage: 55 },
				{ type: 'Alimento tipo B', percentage: 45 },
			],
			activityPattern: 'Rutina estable, prefiere permanecer en zonas cubiertas',
			lastActivities: [
				{ time: 'Hace 8 min', zone: 'Establo B', action: 'Descansando' },
				{ time: 'Hace 1 hora', zone: 'Área de Alimentación', action: 'Alimentándose' },
				{ time: 'Hace 2 horas', zone: 'Zona de Agua', action: 'Bebiendo agua' },
			],
		},
	},
	{ id: 7, tag: 'El Chico', image: '/young-brown-calf.jpg', zone: null, lastSeen: 'Hace 1 hora' },
	{
		id: 8,
		tag: 'La Grande',
		image: '/large-dairy-cow.jpg',
		zone: 'Pastizal Norte',
		lastSeen: 'Hace 4 minutos',
		behaviorStats: {
			mostVisitedZones: [
				{ zone: 'Pastizal Norte', percentage: 48, visits: 30 },
				{ zone: 'Zona de Agua', percentage: 30, visits: 19 },
				{ zone: 'Área de Alimentación', percentage: 22, visits: 14 },
			],
			waterFrequency: 'Cada 2 horas',
			feedingPreference: [
				{ type: 'Pasto natural', percentage: 60 },
				{ type: 'Alimento tipo A', percentage: 40 },
			],
			activityPattern: 'Alta actividad durante todo el día, requiere hidratación frecuente',
			lastActivities: [
				{ time: 'Hace 4 min', zone: 'Pastizal Norte', action: 'Pastoreando' },
				{ time: 'Hace 45 min', zone: 'Zona de Agua', action: 'Bebiendo agua' },
				{ time: 'Hace 2 horas', zone: 'Área de Alimentación', action: 'Alimentándose' },
			],
		},
	},
]

const route = useRoute()

const searchQuery = ref('')
const zoneFilter = ref<string>('all')
const viewMode = ref<'grid' | 'list'>('grid')
const cattleList = ref<Cattle[]>([...mockCattle])
const selectedCattle = ref<Cattle | null>(null)

const detailModalOpen = ref(false)
const addDialogOpen = ref(false)
const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)

const cattleToEdit = ref<Cattle | null>(null)
const cattleToDelete = ref<Cattle | null>(null)

const zones = computed(() => Array.from(new Set(cattleList.value.filter((c) => c.zone).map((c) => c.zone as string))) as string[])

// temp state for add / edit dialogs (avoid nullable types in v-models)
const tempAdd = reactive({ tag: '', image: '', zone: '' })
const editTemp = reactive({ id: 0, tag: '', image: '', zone: '' })

onMounted(() => {
	const filter = route.query.filter as string | undefined
	if (filter === 'online') zoneFilter.value = 'online'
	else if (filter === 'offline') zoneFilter.value = 'offline'
})

watch(
	() => route.query.filter,
	(val) => {
		const filter = val as string | undefined
		if (filter === 'online') zoneFilter.value = 'online'
		else if (filter === 'offline') zoneFilter.value = 'offline'
	},
)

const filteredCattle = computed(() => {
	return cattleList.value.filter((cattle) => {
		const matchesSearch =
			cattle.tag.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
			cattle.id.toString().includes(searchQuery.value)

		let matchesZone = true
		if (zoneFilter.value === 'online') matchesZone = cattle.zone !== null
		else if (zoneFilter.value === 'offline') matchesZone = cattle.zone === null
		else if (zoneFilter.value !== 'all') matchesZone = cattle.zone === zoneFilter.value

		return matchesSearch && matchesZone
	})
})

const handleAddCattle = (newCattle: Partial<Cattle>) => {
	const id = Math.max(...cattleList.value.map((c) => c.id), 0) + 1
	cattleList.value = [...cattleList.value, { id, tag: newCattle.tag || `Ganado ${id}`, image: newCattle.image || null, zone: newCattle.zone ?? null, lastSeen: 'Recién agregado' } as Cattle]
	addDialogOpen.value = false
}

const handleCattleClick = (cattle: Cattle) => {
	selectedCattle.value = cattle
	detailModalOpen.value = true
}

const handleEditCattle = (cattle: Cattle) => {
	cattleToEdit.value = { ...cattle }
	// populate editTemp with non-null strings for v-model
	editTemp.id = cattle.id
	editTemp.tag = cattle.tag
	editTemp.image = cattle.image ?? ''
	editTemp.zone = cattle.zone ?? ''
	editDialogOpen.value = true
}

const handleDeleteCattle = (cattle: Cattle) => {
	cattleToDelete.value = cattle
	deleteDialogOpen.value = true
}

const saveEditFromTemp = () => {
	const id = editTemp.id
	cattleList.value = cattleList.value.map((c) => (c.id === id ? { ...c, tag: editTemp.tag, image: editTemp.image || null, zone: editTemp.zone || null } : c))
	editDialogOpen.value = false
	cattleToEdit.value = null
	editTemp.id = 0
	editTemp.tag = ''
	editTemp.image = ''
	editTemp.zone = ''
}

const handleConfirmDelete = () => {
	if (cattleToDelete.value) {
		cattleList.value = cattleList.value.filter((c) => c.id !== cattleToDelete.value!.id)
		deleteDialogOpen.value = false
		cattleToDelete.value = null
	}
}
</script>

<template>
	<div class="p-6 space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-foreground">Mi Ganadería</h1>
				<p class="text-muted-foreground mt-1">Gestiona y monitorea todos tus animales ({{ cattleList.length }} registrados)</p>
			</div>
			<Button @click="addDialogOpen = true" size="lg" class="gap-2">
				<Plus class="h-5 w-5" />
				Agregar Ganado
			</Button>
		</div>

		<!-- Filters -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
			<div class="relative flex-1 max-w-md">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input placeholder="Buscar por nombre o ID..." v-model="searchQuery" class="pl-9" />
			</div>

			<Select v-model="zoneFilter">
				<SelectTrigger class="w-[220px]">
					<Filter class="h-4 w-4 mr-2" />
					<SelectValue placeholder="Filtrar por zona" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todas las zonas</SelectItem>
					<SelectItem value="online">En línea</SelectItem>
					<SelectItem value="offline">Sin señal</SelectItem>
					<template v-for="zone in zones" :key="zone">
						<SelectItem :value="zone">{{ zone }}</SelectItem>
					</template>
				</SelectContent>
			</Select>

			<div class="flex gap-1 border rounded-lg p-1">
				<Button :variant="viewMode === 'grid' ? 'secondary' : 'ghost'" size="sm" @click="viewMode = 'grid'" class="gap-2">
					<LayoutGrid class="h-4 w-4" />
					Cards
				</Button>
				<Button :variant="viewMode === 'list' ? 'secondary' : 'ghost'" size="sm" @click="viewMode = 'list'" class="gap-2">
					<List class="h-4 w-4" />
					Lista
				</Button>
			</div>
		</div>

		<!-- Cattle Display -->
		<div v-if="filteredCattle.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
			<Beef class="h-16 w-16 text-muted-foreground mb-4" />
			<h3 class="text-xl font-semibold text-foreground mb-2">No se encontraron animales</h3>
			<p class="text-sm text-muted-foreground mb-6">Intenta ajustar los filtros de búsqueda</p>
			<Button variant="outline" @click="() => { searchQuery = ''; zoneFilter = 'all' }">Limpiar filtros</Button>
		</div>

		<div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			<Card v-for="cattle in filteredCattle" :key="cattle.id" class="cursor-pointer hover:shadow-md transition-shadow" @click="handleCattleClick(cattle)">
				<CardContent class="p-4">
					<div class="flex flex-col items-start gap-3">
						<img :src="cattle.image || '/placeholder.svg'" :alt="cattle.tag" class="h-36 w-full rounded-md object-cover" />
						<div class="w-full flex items-center justify-between">
							<div>
								<h3 class="font-semibold text-lg text-foreground truncate">{{ cattle.tag }}</h3>
								<div class="flex items-center gap-2 text-sm text-muted-foreground mt-1">
									<div v-if="cattle.zone" class="flex items-center gap-1">
										<MapPin class="h-4 w-4 text-primary" />
										<span>{{ cattle.zone }}</span>
									</div>
									<div v-else class="flex items-center gap-1 text-destructive">
										<AlertTriangle class="h-4 w-4" />
										<span class="font-medium">Sin señal</span>
									</div>
								</div>
							</div>

							<div class="flex flex-col items-end gap-2">
								<Badge v-if="cattle.zone" class="bg-primary/10 text-primary">En línea</Badge>
								<Badge v-else variant="destructive">Sin señal</Badge>
								<div class="flex gap-1 mt-2">
									<Button variant="ghost" size="icon" @click.stop.prevent="handleEditCattle(cattle)">
										<Pencil class="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="icon" @click.stop.prevent="handleDeleteCattle(cattle)">
										<Trash2 class="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<div v-else class="space-y-3">
			<Card v-for="cattle in filteredCattle" :key="cattle.id" class="p-4 hover:shadow-md transition-shadow cursor-pointer" @click="handleCattleClick(cattle)">
				<div class="flex items-center gap-4">
					  <img :src="cattle.image || '/placeholder.svg'" :alt="cattle.tag" class="h-16 w-16 rounded-lg object-cover shrink-0" />

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h3 class="font-semibold text-lg text-foreground truncate">{{ cattle.tag }}</h3>
							<Badge variant="outline" class="text-xs">ID: {{ cattle.id }}</Badge>
						</div>
						<div class="flex items-center gap-4 text-sm text-muted-foreground">
							<template v-if="cattle.zone">
								<div class="flex items-center gap-1">
									<MapPin class="h-4 w-4 text-primary" />
									<span>{{ cattle.zone }}</span>
								</div>
								<span>•</span>
								<span>{{ cattle.lastSeen }}</span>
							</template>
							<template v-else>
								<div class="flex items-center gap-1 text-destructive">
									<AlertTriangle class="h-4 w-4" />
									<span class="font-medium">Sin señal - {{ cattle.lastSeen }}</span>
								</div>
							</template>
						</div>
					</div>

					  <div class="shrink-0">
						<Badge v-if="cattle.zone" class="bg-primary/10 text-primary hover:bg-primary/20">En línea</Badge>
						<Badge v-else variant="destructive">Sin señal</Badge>
					</div>

					  <div class="flex gap-2 shrink-0">
						<Button variant="ghost" size="icon" @click.stop.prevent="handleEditCattle(cattle)">
							<Pencil class="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" @click.stop.prevent="handleDeleteCattle(cattle)">
							<Trash2 class="h-4 w-4 text-destructive" />
						</Button>
					</div>
				</div>
			</Card>
		</div>

		<!-- Modals -->
		<Dialog v-model:open="detailModalOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Detalle del Animal</DialogTitle>
					<DialogDescription>Información detallada del animal seleccionado</DialogDescription>
				</DialogHeader>

				<div class="py-4">
					<template v-if="selectedCattle">
						<div class="flex gap-4">
							<img :src="selectedCattle.image || '/placeholder.svg'" :alt="selectedCattle.tag" class="h-36 w-36 rounded-md object-cover" />
							<div class="flex-1">
								<h3 class="text-xl font-bold">{{ selectedCattle.tag }}</h3>
								<p class="text-sm text-muted-foreground">ID: {{ selectedCattle.id }}</p>
								<p class="mt-2">{{ selectedCattle.behaviorStats?.activityPattern || 'Sin datos de actividad' }}</p>
								<div class="mt-3 space-y-2 text-sm">
									<div v-if="selectedCattle.behaviorStats?.mostVisitedZones">
										<h4 class="font-medium">Zonas más visitadas</h4>
										<ul class="list-disc list-inside">
											<li v-for="(z, i) in selectedCattle.behaviorStats!.mostVisitedZones!" :key="i">{{ z.zone }} — {{ z.percentage }}% ({{ z.visits }} visitas)</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</template>
					<template v-else>
						<p>No hay animal seleccionado</p>
					</template>
				</div>

						<DialogFooter>
							<Button variant="outline" @click="detailModalOpen = false">Cerrar</Button>
							<Button v-if="selectedCattle" @click="() => { if (selectedCattle) { handleEditCattle(selectedCattle); detailModalOpen = false } }">Editar</Button>
						</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- Add Dialog -->
		<Dialog v-model:open="addDialogOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Agregar Ganado</DialogTitle>
					<DialogDescription>Registra un nuevo animal</DialogDescription>
				</DialogHeader>

				<div class="py-4 space-y-3">
					<Input v-model="tempAdd.tag" placeholder="Nombre / Apodo" />
					<Input v-model="tempAdd.image" placeholder="URL de imagen (opcional)" />
					<Input v-model="tempAdd.zone" placeholder="Zona (opcional)" />
				</div>

				<DialogFooter>
					<Button variant="outline" @click="addDialogOpen = false">Cancelar</Button>
					<Button :disabled="!tempAdd.tag" @click="() => { handleAddCattle(tempAdd); tempAdd.tag=''; tempAdd.image=''; tempAdd.zone=''; }">Agregar</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- Edit Dialog -->
		<Dialog v-model:open="editDialogOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar Ganado</DialogTitle>
					<DialogDescription>Modifica la información del animal</DialogDescription>
				</DialogHeader>

						<div class="py-4 space-y-3">
							<template v-if="editTemp.id !== 0">
								<Input v-model="editTemp.tag" placeholder="Nombre / Apodo" />
								<Input v-model="editTemp.image" placeholder="URL de imagen (opcional)" />
								<Input v-model="editTemp.zone" placeholder="Zona (opcional)" />
							</template>
						</div>

						<DialogFooter>
							<Button variant="outline" @click="editDialogOpen = false">Cancelar</Button>
							<Button v-if="editTemp.id !== 0" @click="saveEditFromTemp">Guardar</Button>
						</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- Delete Alert -->
		<AlertDialog v-model:open="deleteDialogOpen">
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
					<AlertDialogDescription>Esta acción eliminará permanentemente el animal seleccionado.</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction variant="destructive" @click="handleConfirmDelete">Eliminar</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</div>
</template>

<!-- tempAdd and editTemp are declared in the <script setup> block -->
