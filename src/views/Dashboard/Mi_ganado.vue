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
import { Progress } from '@/components/ui/progress'
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
	notes?: string
	beacons?: string[]
}

const mockCattle: Cattle[] = [
	{
		id: 1,
		tag: 'El Pinto',
		image: '/images/Vaca.jpeg',
		zone: 'Establo A',
		lastSeen: 'Hace 2 minutos',
		notes: 'Ganado tranquilo, sin observaciones',
		beacons: ['BCN-001'],
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
		image: '/images/Vaca.jpeg',
		zone: 'Pastizal Norte',
		lastSeen: 'Hace 5 minutos',
		notes: '',
		beacons: [],
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
		image: '/images/Vaca.jpeg',
		zone: 'Área de Alimentación',
		lastSeen: 'Hace 1 minuto',
		notes: '',
		beacons: [],
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
	{ id: 4, tag: 'La Negra', image: '/images/Vaca.jpeg', zone: null, lastSeen: 'Hace 45 minutos', notes: '', beacons: [] },
	{
		id: 5,
		tag: 'El Colorado',
		image: '/images/Vaca.jpeg',
		zone: 'Pastizal Sur',
		lastSeen: 'Hace 3 minutos',
		notes: '',
		beacons: [],
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
		image: '/images/Vaca.jpeg',
		zone: 'Establo B',
		lastSeen: 'Hace 8 minutos',
		notes: '',
		beacons: [],
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
	{ id: 7, tag: 'El Chico', image: '/images/Vaca.jpeg', zone: null, lastSeen: 'Hace 1 hora', notes: '', beacons: [] },
	{
		id: 8,
		tag: 'La Grande',
		image: '/images/Vaca.jpeg',
		zone: 'Pastizal Norte',
		lastSeen: 'Hace 4 minutos',
		notes: '',
		beacons: [],
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
const tempAdd = reactive({ tag: '', image: '', zone: '', notes: '', beacons: [] as string[] })
const editTemp = reactive({ id: 0, tag: '', image: '', zone: '', notes: '', beacons: [] as string[] })

// validation state
const addErrors = reactive({ tag: '', image: '', zone: '' })
const editErrors = reactive({ tag: '', image: '' })

const validateImageUrl = (url?: string) => {
	if (!url) return true
	// allow relative paths starting with /, http(s), blob or data URLs (for local file previews)
	return /^\/|^https?:\/\/|^blob:|^data:/.test(url)
}

const isDuplicateTag = (tag: string, excludeId?: number) => {
	if (!tag) return false
	return cattleList.value.some((c) => c.tag.toLowerCase() === tag.toLowerCase() && c.id !== excludeId)
}

const canAdd = computed(() => {
	// require name and a selected zone; image optional (can be blob/data/http or empty)
	return (
		tempAdd.tag.trim().length > 0 &&
		tempAdd.zone &&
		validateImageUrl(tempAdd.image) &&
		!isDuplicateTag(tempAdd.tag)
	)
})

const canSaveEdit = computed(() => {
	return editTemp.id !== 0 && editTemp.tag.trim().length > 0 && validateImageUrl(editTemp.image) && !isDuplicateTag(editTemp.tag, editTemp.id)
})

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
	cattleList.value = [...cattleList.value, { id, tag: newCattle.tag || `Ganado ${id}`, image: newCattle.image || null, zone: newCattle.zone ?? null, lastSeen: 'Recién agregado', notes: (newCattle.notes as string) || '', beacons: (newCattle.beacons as string[]) || [] } as Cattle]
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
	editTemp.notes = cattle.notes ?? ''
	editTemp.beacons = cattle.beacons ? [...cattle.beacons] : []
	editDialogOpen.value = true
}

const handleDeleteCattle = (cattle: Cattle) => {
	cattleToDelete.value = cattle
	deleteDialogOpen.value = true
}


const saveEditFromTemp = () => {
	// clear previous errors
	editErrors.tag = ''
	editErrors.image = ''

	if (!editTemp.tag || editTemp.tag.trim() === '') {
		editErrors.tag = 'El nombre es requerido'
	}
	if (!validateImageUrl(editTemp.image)) {
		editErrors.image = 'URL de imagen inválida'
	}
	if (isDuplicateTag(editTemp.tag, editTemp.id)) {
		editErrors.tag = 'Ya existe un animal con este nombre'
	}

	if (editErrors.tag || editErrors.image) return

		const id = editTemp.id
		cattleList.value = cattleList.value.map((c) => (c.id === id ? { ...c, tag: editTemp.tag, image: editTemp.image || null, zone: editTemp.zone || null, notes: editTemp.notes || '', beacons: editTemp.beacons ? [...editTemp.beacons] : [] } : c))
	editDialogOpen.value = false
	cattleToEdit.value = null
	editTemp.id = 0
	editTemp.tag = ''
	editTemp.image = ''
	editTemp.zone = ''
		editTemp.notes = ''
		editTemp.beacons = []
}

const handleConfirmAdd = () => {
	// clear errors
	addErrors.tag = ''
	addErrors.image = ''

		if (!tempAdd.tag || tempAdd.tag.trim() === '') addErrors.tag = 'El nombre es requerido'
		if (!tempAdd.zone || tempAdd.zone === '') addErrors.zone = 'La zona inicial es requerida'
		if (!validateImageUrl(tempAdd.image)) addErrors.image = 'URL de imagen inválida'
		if (isDuplicateTag(tempAdd.tag)) addErrors.tag = 'Ya existe un animal con este nombre'

	if (addErrors.tag || addErrors.image) return

		handleAddCattle(tempAdd)
		// reset
		tempAdd.tag = ''
		tempAdd.image = ''
		tempAdd.zone = ''
		tempAdd.notes = ''
		tempAdd.beacons = []
}

		// file inputs for add dialog (gallery and camera)
		const fileInputAddGallery = ref<HTMLInputElement | null>(null)
		const fileInputAddCamera = ref<HTMLInputElement | null>(null)
		let currentAddObjectUrl: string | null = null
		const onAddFileSelected = (e: Event) => {
			const input = e.target as HTMLInputElement
			if (!input.files || input.files.length === 0) return
			const file = input.files[0]
			if (currentAddObjectUrl) URL.revokeObjectURL(currentAddObjectUrl)
			currentAddObjectUrl = URL.createObjectURL(file)
			tempAdd.image = currentAddObjectUrl
		}
		const triggerAddGallery = () => fileInputAddGallery.value?.click()
		const triggerAddCamera = () => fileInputAddCamera.value?.click()

	// beacon helpers for edit dialog
	const editBeaconInput = ref('')
	const addBeaconToEdit = () => {
		const v = editBeaconInput.value.trim()
		if (!v) return
		if (!editTemp.beacons) editTemp.beacons = []
		if (!editTemp.beacons.includes(v)) editTemp.beacons.push(v)
		editBeaconInput.value = ''
	}
	const removeBeaconFromEdit = (idx: number) => {
		if (!editTemp.beacons) return
		editTemp.beacons.splice(idx, 1)
	}

	// beacon helpers for add dialog
	const addBeaconInput = ref('')
	const addBeaconToTemp = () => {
		const v = addBeaconInput.value.trim()
		if (!v) return
		if (!tempAdd.beacons) tempAdd.beacons = []
		if (!tempAdd.beacons.includes(v)) tempAdd.beacons.push(v)
		addBeaconInput.value = ''
	}
	const removeBeaconFromTemp = (idx: number) => {
		if (!tempAdd.beacons) return
		tempAdd.beacons.splice(idx, 1)
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
			<Button @click="addDialogOpen = true" size="lg" class="gap-2 bg-emerald-600 text-white hover:bg-emerald-700" >
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
			<Card
				v-for="cattle in filteredCattle"
				:key="cattle.id"
				@click="handleCattleClick(cattle)"
				:class="`transition-shadow cursor-pointer hover:shadow-md ${cattle.zone ? 'border border-gray-100 rounded-lg' : 'border border-red-200 rounded-lg ring-1 ring-red-50'}`"
			>
				<CardContent class="p-0 overflow-hidden">
					<div class="flex flex-col items-start gap-0">
						<!-- image area with optional overlay when offline -->
						<div class="relative w-full">
							<img :src="cattle.image || '/images/Vaca.jpeg'" :alt="cattle.tag" class="h-44 w-full object-cover" />
							<!-- overlay for no-signal -->
							<div v-if="!cattle.zone" class="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
								<Badge variant="destructive" class="px-3 py-2 text-sm">Sin Señal</Badge>
							</div>
						</div>

						<div class="w-full p-4 flex items-start justify-between">
							<div class="min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<span class="text-sm font-bold text-foreground">ID: {{ cattle.id }}</span>
								</div>
								<h3 class="font-semibold text-lg text-foreground truncate">{{ cattle.tag }}</h3>
								<div class="flex items-center gap-2 text-sm text-muted-foreground mt-2">
									<template v-if="cattle.zone">
										<Badge class="bg-primary/10 text-primary px-2 py-1">{{ cattle.zone }}</Badge>
										<span class="ml-2">Última vez: {{ cattle.lastSeen }}</span>
									</template>
									<template v-else>
										<span class="text-destructive font-medium">Sin señal • {{ cattle.lastSeen }}</span>
									</template>
								</div>
							</div>

							<div class="flex flex-col items-end gap-2">
								<Badge v-if="cattle.zone" class="bg-primary/10 text-primary">En línea</Badge>
								<Badge v-else variant="destructive">Desconocido</Badge>
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
					  <img :src="cattle.image || '/images/Vaca.jpeg'" :alt="cattle.tag" class="h-16 w-16 rounded-lg object-cover shrink-0" />

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
					<DialogContent :showCloseButton="false" class="max-w-4xl p-6 rounded-lg bg-white shadow-lg">
					<div class="relative">

						<!-- Header row: image left + title/info right -->
						<div class="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
							<div class="md:col-span-1 flex items-start gap-4">
								<img :src="selectedCattle?.image || '/images/Vaca.jpeg'" :alt="selectedCattle?.tag" class="w-44 h-36 rounded-lg object-cover" />
								<div class="hidden md:block">
									<!-- spacer to align with right column on md+ screens -->
								</div>
							</div>

										<div class="md:col-span-2">
											<div class="flex flex-col md:flex-row md:items-start md:justify-between">
																<div class="max-w-lg">
																	<h3 class="text-3xl font-extrabold leading-tight">ID: {{ selectedCattle?.id }}</h3>
																	<p class="text-xl font-semibold mt-1">{{ selectedCattle?.tag }}</p>
																</div>
									<div class="mt-3 md:mt-0 flex flex-col gap-2">
										<div class="flex items-center gap-2">
											<span class="text-sm text-muted-foreground">Ubicación Actual:</span>
											<div class="flex items-center gap-2">
												  <MapPin class="h-4 w-4 text-primary" />
												  <Badge class="bg-primary/10 text-primary px-2 py-1">{{ selectedCattle?.zone || 'Sin ubicación' }}</Badge>
											</div>
										</div>

										<div class="flex items-center gap-2">
											<div class="text-sm text-muted-foreground">Última detección:</div>
											<div class="text-sm font-medium">{{ selectedCattle?.lastSeen }}</div>
										</div>

										<div class="flex items-center gap-2">
											<div class="text-sm text-muted-foreground">Estado:</div>
											<Badge class="bg-green-100 text-green-700 px-2 py-1">{{ selectedCattle?.zone ? 'Monitoreado' : 'Sin señal' }}</Badge>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Zones card full width -->
						<div class="mt-6">
							<Card class="rounded-lg">
								<CardContent>
									<div class="flex items-center gap-2 mb-3">
										<MapPin class="h-5 w-5 text-primary" />
										<h4 class="text-lg font-medium">Zonas Más Visitadas</h4>
									</div>

									<div class="space-y-4">
										<template v-for="(z) in selectedCattle?.behaviorStats?.mostVisitedZones || []" :key="z.zone">
											<div class="flex items-center justify-between">
												<div class="text-sm font-medium">{{ z.zone }}</div>
												<div class="text-sm text-muted-foreground">{{ z.percentage }}% ({{ z.visits }} visitas)</div>
											</div>
											<Progress :modelValue="z.percentage" class="h-3 rounded-full [&>div]:bg-emerald-700 [&>div]:rounded-full" />
										</template>
									</div>
								</CardContent>
							</Card>
						</div>

						<!-- Two info cards -->
						<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Card>
								<CardContent class="p-6">
									<div class="text-sm text-muted-foreground">Consumo de Agua</div>
									<div class="text-2xl font-bold mt-3">{{ selectedCattle?.behaviorStats?.waterFrequency || 'N/D' }}</div>
									<div class="text-xs text-muted-foreground mt-1">Frecuencia promedio</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent class="p-6">
									<div class="text-sm text-muted-foreground">Preferencia de Alimentación</div>
									<div class="mt-3 space-y-2">
										<template v-for="(p) in selectedCattle?.behaviorStats?.feedingPreference || []" :key="p.type">
											<div class="flex items-center justify-between text-sm">
												<div>{{ p.type }}</div>
												<div class="font-medium">{{ p.percentage }}%</div>
											</div>
										</template>
									</div>
								</CardContent>
							</Card>
						</div>

						<!-- Beacons / Notas -->
						<div class="mt-6 grid grid-cols-1 gap-4">
							<Card>
								<CardContent class="p-6">
									<div class="flex items-center justify-between">
										<div>
											<div class="text-sm text-muted-foreground">Beacons asignados</div>
											<div class="mt-2 flex gap-2 flex-wrap">
												<template v-for="b in selectedCattle?.beacons || []" :key="b">
													<span class="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-sm">{{ b }}</span>
												</template>
												<template v-if="!(selectedCattle?.beacons && selectedCattle.beacons.length)">
												<span class="text-sm text-muted-foreground">No hay beacons asignados</span>
												</template>
											</div>
										</div>
									</div>
									<div class="mt-3 text-sm text-muted-foreground">Notas</div>
									<div class="mt-2">{{ selectedCattle?.notes || 'Sin notas' }}</div>
								</CardContent>
							</Card>
						</div>

						<!-- Footer buttons aligned right -->
						<div class="mt-6 flex justify-end gap-3">
							<Button variant="ghost" @click="detailModalOpen = false">Cerrar</Button>
							<Button variant="secondary" class="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-md" v-if="selectedCattle" @click="() => { if (selectedCattle) { handleEditCattle(selectedCattle); detailModalOpen = false } }">Editar</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

		<!-- Add Dialog -->
			<Dialog v-model:open="addDialogOpen">
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Registrar Nuevo Ganado</DialogTitle>
						<DialogDescription>Completa la información del animal para agregarlo al sistema de monitoreo.</DialogDescription>
					</DialogHeader>

					<div class="py-4 space-y-3">
						<!-- Nombre / Tag -->
						<div>
							<label class="block text-sm font-medium">Nombre / Tag <span class="text-destructive">*</span></label>
							<Input v-model="tempAdd.tag" placeholder="Ej: El Pinto, La Manchada..." />
							<div v-if="addErrors.tag" class="text-destructive text-sm mt-1">{{ addErrors.tag }}</div>
						</div>

						<!-- ID (auto) -->
						<div>
							<label class="block text-sm font-medium mt-1">ID del Animal</label>
							<input class="w-full rounded-md border p-2 bg-muted text-sm" placeholder="Dejar vacío para generar automáticamente" disabled />
							<div class="text-xs text-muted-foreground mt-1">Si no se especifica, se generará un ID automáticamente</div>
						</div>

						<!-- Zona inicial (select) -->
						<div>
							<label class="block text-sm font-medium mt-3">Zona Inicial <span class="text-destructive">*</span></label>
							<Select v-model="tempAdd.zone">
								<SelectTrigger class="w-full">
									<SelectValue placeholder="Selecciona una zona" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Selecciona una zona</SelectItem>
									<template v-for="z in zones" :key="z">
										<SelectItem :value="z">{{ z }}</SelectItem>
									</template>
								</SelectContent>
							</Select>
							<div v-if="addErrors.zone" class="text-destructive text-sm mt-1">{{ addErrors.zone }}</div>
						</div>

						<!-- Imagen: gallery / camera boxes -->
						<div>
							<label class="block text-sm font-medium mt-3">Imagen del Animal</label>
							<div class="mt-2 grid grid-cols-2 gap-3">
								<!-- gallery -->
								<div @click.prevent="triggerAddGallery" class="flex flex-col items-center justify-center border-dashed border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:bg-gray-50">
									<div class="text-sm font-medium">Subir desde galería</div>
									<div class="text-xs text-muted-foreground mt-2">Selecciona una imagen desde tu dispositivo</div>
								</div>
								<!-- camera -->
								<div @click.prevent="triggerAddCamera" class="flex flex-col items-center justify-center border-dashed border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:bg-gray-50">
									<div class="text-sm font-medium">Tomar foto</div>
									<div class="text-xs text-muted-foreground mt-2">Abrir la cámara (si el dispositivo lo permite)</div>
								</div>
							</div>
							<div class="text-xs text-muted-foreground mt-2">Opcional: Si no se proporciona, se usará una imagen por defecto</div>
							<!-- hidden file inputs -->
							<input ref="fileInputAddGallery" type="file" accept="image/*" class="hidden" @change="onAddFileSelected" />
							<input ref="fileInputAddCamera" type="file" accept="image/*" capture="environment" class="hidden" @change="onAddFileSelected" />
							<div v-if="tempAdd.image" class="mt-3">
								<img :src="tempAdd.image" alt="preview" class="w-full h-40 object-cover rounded-lg" />
							</div>
							<div v-if="addErrors.image" class="text-destructive text-sm mt-1">{{ addErrors.image }}</div>
						</div>

						<!-- beacons and notes -->
						<label class="block text-sm font-medium mt-3">Beacons</label>
						<div class="flex gap-2 mt-2">
							<input v-model="addBeaconInput" placeholder="Agregar beacon (ID)" class="flex-1 rounded-md border p-2" />
							<button @click.prevent="addBeaconToTemp" class="px-3 py-2 bg-primary text-white rounded-md">Agregar</button>
						</div>
						<div class="flex gap-2 flex-wrap mt-2">
							<span v-for="(b, idx) in tempAdd.beacons" :key="b" class="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-sm">
								{{ b }}
								<button @click.prevent="removeBeaconFromTemp(idx)" class="ml-1 text-sm text-destructive">✕</button>
							</span>
						</div>

						<label class="block text-sm font-medium mt-3">Notas Adicionales</label>
						<textarea v-model="tempAdd.notes" placeholder="Información adicional sobre el animal..." class="w-full rounded-md border p-3 h-24"></textarea>
					</div>

					<DialogFooter>
						<Button variant="outline" @click="addDialogOpen = false">Cancelar</Button>
						<Button :disabled="!canAdd" @click="handleConfirmAdd" class="bg-emerald-600 text-white hover:bg-emerald-700">Registrar Ganado</Button>
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
									<!-- Nombre / Tag -->
									<label class="block text-sm font-medium">Nombre / Tag <span class="text-destructive">*</span></label>
									<Input v-model="editTemp.tag" placeholder="Nombre / Apodo" />
									<div v-if="editErrors.tag" class="text-destructive text-sm mt-1">{{ editErrors.tag }}</div>

									<!-- ID (no editable) -->
									<label class="block text-sm font-medium mt-3">ID del Animal</label>
									<input class="w-full rounded-md border p-2 bg-muted text-sm" :value="editTemp.id" disabled />
									<div class="text-xs text-muted-foreground mt-1">El ID no se puede modificar</div>

									<!-- Zona -->
									<label class="block text-sm font-medium mt-3">Zona Actual <span class="text-destructive">*</span></label>
									<Input v-model="editTemp.zone" placeholder="Zona (opcional)" />

									<!-- Imagen preview con boton eliminar -->
									<label class="block text-sm font-medium mt-3">Imagen del Animal</label>
									<div class="relative mt-2">
										<img :src="editTemp.image || '/images/Vaca.jpeg'" alt="preview" class="w-full h-40 object-cover rounded-lg" />
										<button @click.prevent="editTemp.image = ''" class="absolute right-3 top-3 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center">×</button>
									</div>

									<!-- Beacons: show existing and add new -->
									<label class="block text-sm font-medium mt-3">Beacons</label>
									<div class="flex items-center gap-2 mt-2">
										<input v-model="editBeaconInput" placeholder="Agregar beacon (ID)" class="flex-1 rounded-md border p-2" />
										<button @click.prevent="addBeaconToEdit" class="px-3 py-2 bg-primary text-white rounded-md">Agregar</button>
									</div>
									<div class="flex gap-2 flex-wrap mt-2">
										<span v-for="(b, idx) in editTemp.beacons" :key="b" class="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-sm">
											{{ b }}
											<button @click.prevent="removeBeaconFromEdit(idx)" class="ml-1 text-sm text-destructive">✕</button>
										</span>
									</div>

									<!-- Notas adicionales -->
									<label class="block text-sm font-medium mt-3">Notas Adicionales</label>
									<textarea v-model="editTemp.notes" placeholder="Información adicional sobre el animal..." class="w-full rounded-md border p-3 h-28"></textarea>
								</template>
							</div>

							<DialogFooter>
								<Button variant="outline" @click="editDialogOpen = false">Cancelar</Button>
								<Button :disabled="!canSaveEdit" v-if="editTemp.id !== 0" @click="saveEditFromTemp" class="bg-emerald-600 text-white hover:bg-emerald-700">Guardar</Button>
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
