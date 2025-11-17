<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { listVacas, getVacasByUser, createVaca, createCowWithImage, updateVaca, deleteVaca, type Cow } from '@/services/Cows'
import { getZonesByUser, type Zone } from '@/services/Zones'
import { updateTag } from '@/services/Tags'
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
	Droplet,
	Wheat,
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
	ear_tag?: string
	favorite_food?: string
	tag_id?: number
}

const route = useRoute()
const { userId, loadUser } = useUser()

const searchQuery = ref('')
const zoneFilter = ref<string>('all')
const viewMode = ref<'grid' | 'list'>('grid')
const cattleList = ref<Cattle[]>([])
const availableZones = ref<Zone[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const selectedCattle = ref<Cattle | null>(null)

const detailModalOpen = ref(false)
const addDialogOpen = ref(false)
const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)

const cattleToEdit = ref<Cattle | null>(null)
const cattleToDelete = ref<Cattle | null>(null)

// Usar las zonas disponibles del usuario en lugar de las zonas de los animales
const zones = computed(() => availableZones.value.map(z => z.name))

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
	// require name; zone and image are optional
	return (
		tempAdd.tag.trim().length > 0 &&
		validateImageUrl(tempAdd.image) &&
		!isDuplicateTag(tempAdd.tag)
	)
})

const canSaveEdit = computed(() => {
	return editTemp.id !== 0 && editTemp.tag.trim().length > 0 && validateImageUrl(editTemp.image) && !isDuplicateTag(editTemp.tag, editTemp.id)
})

// Mapear Cow de la API a Cattle del componente
const mapCowToCattle = (cow: Cow): Cattle => {
	console.log('%c🐄 DATOS DEL BACKEND', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold; padding: 4px;')
	console.log('ID de la vaca:', cow.id)
	console.log('Nombre:', cow.name)
	console.log('Tag completo:', cow.tag)
	console.log('current_location (ZONA):', cow.tag?.current_location)
	console.log('---')
	
	return {
		id: cow.id,
		tag: cow.name,
		image: cow.image || '/images/Vaca.jpeg',
		zone: cow.tag?.current_location || null,
		lastSeen: 'Hace unos momentos',
		notes: cow.favorite_food ? `Comida favorita: ${cow.favorite_food}` : '',
		beacons: cow.tag ? [cow.tag.id_tag] : [],
		ear_tag: cow.ear_tag,
		favorite_food: cow.favorite_food,
		tag_id: cow.tag?.id
	}
}

// Cargar vacas desde la API
const loadCattle = async () => {
	isLoading.value = true
	error.value = null
	try {
		let cows: Cow[]
		// Si hay un userId válido, cargar solo sus vacas
		if (userId.value && userId.value > 0) {
			cows = await getVacasByUser(userId.value)
		} else {
			// Si no hay usuario, cargar todas las vacas
			cows = await listVacas()
		}
		cattleList.value = cows.map(mapCowToCattle)
	} catch (err) {
		console.error('Error al cargar ganado:', err)
		error.value = 'Error al cargar los datos del ganado'
	} finally {
		isLoading.value = false
	}
}

// Cargar zonas del usuario
const loadZones = async () => {
	if (!userId.value || userId.value <= 0) return
	
	try {
		const zones = await getZonesByUser(userId.value)
		availableZones.value = zones
	} catch (err) {
		console.error('Error al cargar zonas:', err)
	}
}

onMounted(() => {
	const filter = route.query.filter as string | undefined
	if (filter === 'online') zoneFilter.value = 'online'
	else if (filter === 'offline') zoneFilter.value = 'offline'
	
	// Cargar usuario desde localStorage
	loadUser()
	
	// Cargar zonas y datos desde la API
	loadZones()
	loadCattle()
})

watch(
	() => route.query.filter,
	(val) => {
		const filter = val as string | undefined
		if (filter === 'online') zoneFilter.value = 'online'
		else if (filter === 'offline') zoneFilter.value = 'offline'
	},
)

// Limpiar errores cuando se abre el diálogo de agregar
watch(addDialogOpen, (isOpen) => {
	if (isOpen) {
		error.value = null
		addErrors.tag = ''
		addErrors.image = ''
		addErrors.zone = ''
	}
})

// Limpiar errores cuando se abre el diálogo de eliminar
watch(deleteDialogOpen, (isOpen) => {
	if (isOpen) {
		error.value = null
	}
})

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

const handleAddCattle = async (newCattle: Partial<Cattle>) => {
	try {
		isLoading.value = true
		error.value = null
		
		// Verificar que tenemos userId
		if (!userId.value || userId.value <= 0) {
			error.value = 'No se encontró el ID de usuario. Por favor, inicia sesión nuevamente.'
			isLoading.value = false
			return
		}
		
		// Por ahora, usaremos tag_id = 1 como ejemplo si no hay uno específico
		// TODO: Agregar selector de tag_id en el formulario
		const tagId = newCattle.tag_id || 1
		
		let createdCow: Cow
		
		// Si hay un archivo seleccionado, usar el endpoint REST con imagen
		if (selectedFile.value) {
			createdCow = await createCowWithImage(
				tagId,
				newCattle.tag || `Ganado ${Date.now()}`,
				userId.value,
				newCattle.notes || 'Sin información adicional',
				selectedFile.value
			)
		} else {
			// Si no hay imagen, usar GraphQL createVaca
			createdCow = await createVaca({
				nombre: newCattle.tag || `Ganado ${Date.now()}`,
				comida_preferida: newCattle.notes || 'No especificada',
				id_usuario: userId.value,
				tag_id: tagId
			})
		}
		
		addDialogOpen.value = false
		
		// Recargar lista después de agregar
		await loadCattle()
	} catch (err: any) {
		console.error('Error al agregar ganado:', err)
		error.value = err.message || 'Error al agregar el ganado. Por favor, intenta nuevamente.'
	} finally {
		isLoading.value = false
	}
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


const saveEditFromTemp = async () => {
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

	try {
		isLoading.value = true
		const id = editTemp.id
		
		// Obtener la vaca actual para saber su tag_id
		const currentCattle = cattleList.value.find(c => c.id === id)
		
		// Actualizar en la API
		await updateVaca(id, {
			nombre: editTemp.tag,
			comida_preferida: editTemp.notes || undefined,
			// tag_id se puede agregar si es necesario
		})
		
		// Si la zona cambió y tenemos el tag_id, actualizar la ubicación del tag
		if (currentCattle?.tag_id) {
			console.log('%c📍 ACTUALIZANDO ZONA', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px;')
			console.log('Tag ID:', currentCattle.tag_id)
			console.log('Nueva zona:', editTemp.zone)
			console.log('Zona vacía?', editTemp.zone === '')
			
			const updatePayload = {
				current_location: editTemp.zone || undefined
			}
			console.log('Payload para updateTag:', updatePayload)
			
			try {
				const result = await updateTag(currentCattle.tag_id, updatePayload)
				console.log('✅ Respuesta del backend:', result)
			} catch (tagErr: any) {
				console.error('❌ Error al actualizar ubicación del tag:', tagErr)
				console.error('❌ Mensaje de error:', tagErr.message)
				error.value = `Error al actualizar la zona: ${tagErr.message}`
				return // No continuar si falla la actualización
			}
		} else {
			console.warn('⚠️ No se puede actualizar la zona: tag_id no encontrado')
			console.log('currentCattle:', currentCattle)
		}
		
		// Actualizar localmente
		const updatedCattle = { ...currentCattle!, tag: editTemp.tag, image: editTemp.image || null, zone: editTemp.zone || null, notes: editTemp.notes || '', beacons: editTemp.beacons ? [...editTemp.beacons] : [] }
		cattleList.value = cattleList.value.map((c) => (c.id === id ? updatedCattle : c))
		
		// Si el ganado editado es el que está seleccionado en detalles, actualizarlo también
		if (selectedCattle.value?.id === id) {
			selectedCattle.value = updatedCattle
		}
		
		editDialogOpen.value = false
		cattleToEdit.value = null
		editTemp.id = 0
		editTemp.tag = ''
		editTemp.image = ''
		editTemp.zone = ''
		editTemp.notes = ''
		editTemp.beacons = []
		
		// Recargar lista después de editar
		await loadCattle()
	} catch (err) {
		console.error('Error al actualizar ganado:', err)
		error.value = 'Error al actualizar el ganado'
	} finally {
		isLoading.value = false
	}
}

const handleConfirmAdd = () => {
	// clear errors
	addErrors.tag = ''
	addErrors.image = ''
	addErrors.zone = ''

	if (!tempAdd.tag || tempAdd.tag.trim() === '') addErrors.tag = 'El nombre es requerido'
	if (!validateImageUrl(tempAdd.image)) addErrors.image = 'URL de imagen inválida'
	if (isDuplicateTag(tempAdd.tag)) addErrors.tag = 'Ya existe un animal con este nombre'

	if (addErrors.tag || addErrors.image || addErrors.zone) return

	handleAddCattle(tempAdd)
	// reset
	tempAdd.tag = ''
	tempAdd.image = ''
	tempAdd.zone = ''
	tempAdd.notes = ''
	tempAdd.beacons = []
	selectedFile.value = null
	if (currentAddObjectUrl) {
		URL.revokeObjectURL(currentAddObjectUrl)
		currentAddObjectUrl = null
	}
}

		// file inputs for add dialog (gallery and camera)
		const fileInputAddGallery = ref<HTMLInputElement | null>(null)
		const fileInputAddCamera = ref<HTMLInputElement | null>(null)
		const selectedFile = ref<File | null>(null)
		let currentAddObjectUrl: string | null = null
		const onAddFileSelected = (e: Event) => {
			const input = e.target as HTMLInputElement
			if (!input.files || input.files.length === 0) return
			const file = input.files[0]
			if (!file) return
			// Guardar el archivo para enviarlo después
			selectedFile.value = file
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

const handleConfirmDelete = async () => {
	if (!cattleToDelete.value) return
	
	try {
		isLoading.value = true
		error.value = null
		
		const idToDelete = cattleToDelete.value.id
		
		// Llamar a la API para eliminar
		await deleteVaca(idToDelete)
		
		// Eliminar localmente
		cattleList.value = cattleList.value.filter((c) => c.id !== idToDelete)
		
		deleteDialogOpen.value = false
		cattleToDelete.value = null
		
		// Recargar lista para confirmar
		await loadCattle()
	} catch (err: any) {
		console.error('Error al eliminar ganado:', err)
		error.value = err.message || 'Error al eliminar el ganado. Por favor, intenta nuevamente.'
		// Mantener el diálogo abierto para mostrar el error
	} finally {
		isLoading.value = false
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
			<Button @click="addDialogOpen = true" size="lg" class="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" >
				<Plus class="h-5 w-5" />
				Agregar Ganado
			</Button>
		</div>

	<!-- Filters -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative flex-1 max-w-md">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input placeholder="Buscar por nombre o ID..." v-model="searchQuery" class="pl-9 !bg-white" />
		</div>

	<Select v-model="zoneFilter">
			<SelectTrigger class="w-[220px] !bg-white">
				<Filter class="h-4 w-4 mr-2" />
				<SelectValue placeholder="Filtrar por zona">
					<span v-if="zoneFilter === 'all'">Todas las zonas</span>
					<span v-else-if="zoneFilter === 'online'">En línea</span>
					<span v-else-if="zoneFilter === 'offline'">Sin señal</span>
					<span v-else>{{ zoneFilter }}</span>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all">Todas las zonas</SelectItem>
				<SelectItem value="online">En línea</SelectItem>
				<SelectItem value="offline">Sin señal</SelectItem>
				<template v-for="zone in zones" :key="zone">
					<SelectItem :value="zone">{{ zone }}</SelectItem>
				</template>
			</SelectContent>
		</Select>			<div class="flex gap-1 border rounded-lg p-1">
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

		<!-- Loading State -->
		<div v-if="isLoading" class="flex flex-col items-center justify-center py-16 text-center">
			<div class="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
			<p class="text-muted-foreground">Cargando ganado...</p>
		</div>

		<!-- Error State -->
		<div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center">
			<AlertTriangle class="h-16 w-16 text-destructive mb-4" />
			<h3 class="text-xl font-semibold text-foreground mb-2">Error al cargar datos</h3>
			<p class="text-sm text-muted-foreground mb-6">{{ error }}</p>
			<Button variant="outline" @click="loadCattle">Reintentar</Button>
		</div>

		<!-- Cattle Display -->
		<div v-else-if="filteredCattle.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
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
						
						<!-- Botones de editar y eliminar sobre la imagen -->
						<div class="absolute top-2 right-2 flex gap-2">
							<Button variant="ghost" size="icon" class="h-9 w-9 bg-white hover:bg-white/90 rounded-full shadow-md" @click.stop.prevent="handleEditCattle(cattle)">
								<Pencil class="h-4 w-4 text-foreground" />
							</Button>
							<Button variant="ghost" size="icon" class="h-9 w-9 bg-red-500 hover:bg-red-600 rounded-full shadow-md" @click.stop.prevent="handleDeleteCattle(cattle)">
								<Trash2 class="h-4 w-4 text-white" />
							</Button>
						</div>
						
						<!-- overlay for no-signal -->
						<div v-if="!cattle.zone" class="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
							<Badge variant="destructive" class="px-3 py-2 text-sm">Sin Señal</Badge>
						</div>
					</div>

					<div class="w-full p-4">
						<div class="flex items-center justify-between mb-1">
							<span class="text-sm font-bold text-foreground">ID: {{ cattle.id }}</span>
							<Badge v-if="cattle.zone" class="bg-emerald-100 text-emerald-700">En línea</Badge>
							<Badge v-else variant="destructive">Desconocido</Badge>
						</div>
						<h3 class="font-semibold text-lg text-foreground truncate">{{ cattle.tag }}</h3>
						<div class="flex items-center gap-2 text-sm text-muted-foreground mt-2">
							<template v-if="cattle.zone">
								<MapPin class="h-3 w-3 text-primary" />
								<Badge class="bg-emerald-100 text-emerald-700 px-2 py-1">{{ cattle.zone }}</Badge>
							</template>
							<template v-else>
								<span class="text-destructive font-medium">Sin señal</span>
							</template>
						</div>
						<div class="text-xs text-muted-foreground mt-1">
							Última vez: {{ cattle.lastSeen }}
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
					<Badge v-if="cattle.zone" class="bg-emerald-100 text-emerald-700">En línea</Badge>						
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
					<DialogContent :showCloseButton="false" class="w-full md:max-w-xl p-6 rounded-lg bg-white shadow-lg max-h-[80vh] overflow-y-auto">
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
													<Badge class="bg-emerald-100 text-emerald-700 px-2 py-1">{{ selectedCattle?.zone || 'Sin ubicación' }}</Badge>
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
								<CardContent class="p-6">
									<div class="flex items-center gap-2 mb-4">
										<MapPin class="h-5 w-5 text-primary" />
										<h4 class="text-lg font-semibold">Zonas Más Visitadas</h4>
									</div>

									<div class="space-y-4">
										<template v-for="(z) in selectedCattle?.behaviorStats?.mostVisitedZones || []" :key="z.zone">
											<div>
												<div class="flex items-center justify-between mb-2">
													<div class="text-sm font-medium">{{ z.zone }}</div>
													<div class="text-sm text-muted-foreground">{{ z.percentage }}% ({{ z.visits }} visitas)</div>
												</div>
												<Progress :modelValue="z.percentage" class="h-3 rounded-full [&>div]:bg-emerald-700 [&>div]:rounded-full" />
											</div>
										</template>
									</div>
								</CardContent>
							</Card>
						</div>

						<!-- Two info cards -->
						<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Card>
								<CardContent class="p-6">
									<div class="flex items-center gap-2 text-sm text-primary mb-3">
										<Droplet class="h-5 w-5" />
										<span class="font-medium">Consumo de Agua</span>
									</div>
									<div class="text-3xl font-bold mt-2">{{ selectedCattle?.behaviorStats?.waterFrequency || 'N/D' }}</div>
									<div class="text-xs text-muted-foreground mt-1">Frecuencia promedio</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent class="p-6">
									<div class="flex items-center gap-2 text-sm text-amber-600 mb-3">
										<Wheat class="h-5 w-5" />
										<span class="font-medium">Preferencia de Alimentación</span>
									</div>
									<div class="mt-3 space-y-2">
										<template v-for="(p) in selectedCattle?.behaviorStats?.feedingPreference || []" :key="p.type">
											<div class="flex items-center justify-between text-sm">
												<div>{{ p.type }}</div>
												<div class="font-semibold">{{ p.percentage }}%</div>
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
									<div class="space-y-4">
										<div>
											<div class="text-sm font-semibold text-foreground mb-2">Beacons asignados</div>
											<div class="flex gap-2 flex-wrap">
												<template v-for="b in selectedCattle?.beacons || []" :key="b">
													<span class="inline-flex items-center gap-2 bg-secondary border border-border px-3 py-1 rounded-md text-sm font-medium">{{ b }}</span>
												</template>
												<template v-if="!(selectedCattle?.beacons && selectedCattle.beacons.length)">
													<span class="text-sm text-muted-foreground">No hay beacons asignados</span>
												</template>
											</div>
										</div>
										
										<div>
											<div class="text-sm font-semibold text-foreground mb-2">Notas</div>
											<div class="text-sm text-muted-foreground">{{ selectedCattle?.notes || 'Sin notas' }}</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<!-- Footer buttons aligned right -->
						<div class="mt-6 flex justify-end gap-3">
							<Button variant="ghost" @click="detailModalOpen = false">Cerrar</Button>
											<Button variant="secondary" class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md" v-if="selectedCattle" @click="() => { if (selectedCattle) { handleEditCattle(selectedCattle); detailModalOpen = false } }">Editar</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

		<!-- Add Dialog -->
			<Dialog v-model:open="addDialogOpen">
				<DialogContent class="max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Registrar Nuevo Ganado</DialogTitle>
						<DialogDescription>Completa la información del animal para agregarlo al sistema de monitoreo.</DialogDescription>
					</DialogHeader>

					<div class="py-4 space-y-3">
						<!-- Nombre / Tag -->
						<div>
							<label class="block text-sm font-medium">Nombre / Tag <span class="text-destructive">*</span></label>
							<Input class="!bg-white" v-model="tempAdd.tag" placeholder="Ej: El Pinto, La Manchada..." />
							<div v-if="addErrors.tag" class="text-destructive text-sm mt-1">{{ addErrors.tag }}</div>
						</div>

						<!-- ID (auto) -->
						<div>
							<label class="block text-sm font-medium mt-1">ID del Animal</label>
							<input class="w-full rounded-md border p-2 bg-muted text-sm" placeholder="Dejar vacío para generar automáticamente" disabled />
							<div class="text-xs !bg-white">Si no se especifica, se generará un ID automáticamente</div>
						</div>

						<!-- Zona inicial (select) - OPCIONAL -->
						<div>
							<label class="block text-sm font-medium mt-3">Zona Inicial (opcional)</label>
							<Select v-model="tempAdd.zone">
								<SelectTrigger class="w-full">
									<SelectValue placeholder="Selecciona una zona (opcional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Sin zona asignada</SelectItem>
									<template v-for="z in zones" :key="z">
										<SelectItem :value="z">{{ z }}</SelectItem>
									</template>
								</SelectContent>
							</Select>
							<div v-if="addErrors.zone" class="text-destructive text-sm mt-1">{{ addErrors.zone }}</div>
							<div class="text-xs text-muted-foreground mt-1">Puedes asignar una zona más tarde</div>
						</div>

						<!-- Imagen: gallery / camera boxes -->
						<div>
							<label class="block text-sm font-medium mt-3">Imagen del Animal</label>
						<div class="mt-2 grid grid-cols-2 gap-3">
							<!-- gallery -->
							<div @click.prevent="triggerAddGallery" class="flex flex-col items-center justify-center border-dashed border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:bg-white">
								<div class="text-sm font-medium">Subir desde galería</div>
								<div class="text-xs text-muted-foreground mt-2">Selecciona una imagen desde tu dispositivo</div>
							</div>
							<!-- camera -->
							<div @click.prevent="triggerAddCamera" class="flex flex-col items-center justify-center border-dashed border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:bg-white">
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
						<span v-for="(b, idx) in tempAdd.beacons" :key="b" class="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-md text-sm">
							{{ b }}
							<button @click.prevent="removeBeaconFromTemp(idx)" class="ml-1 text-sm text-destructive">✕</button>
						</span>
					</div>

					<label class="block text-sm font-medium mt-3">Notas Adicionales</label>
						<textarea v-model="tempAdd.notes" placeholder="Información adicional sobre el animal..." class="w-full rounded-md border p-3 h-24"></textarea>
						
						<!-- Error message -->
						<div v-if="error" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
							<p class="text-sm text-red-600">{{ error }}</p>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" @click="addDialogOpen = false">Cancelar</Button>
						<Button :disabled="!canAdd || isLoading" @click="handleConfirmAdd" class="bg-primary text-primary-foreground hover:bg-primary/90">
							<span v-if="isLoading">Agregando...</span>
							<span v-else>Registrar Ganado</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

		<!-- Edit Dialog -->
		<Dialog v-model:open="editDialogOpen">
			<DialogContent class="w-full md:max-w-xl p-6 rounded-lg bg-white shadow-lg max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Editar Ganado</DialogTitle>
					<DialogDescription>Modifica la información del animal</DialogDescription>
				</DialogHeader>

							<div class="py-4 space-y-3">
								<template v-if="editTemp.id !== 0">
									<!-- Nombre / Tag -->
									<label class="block text-sm font-medium">Nombre / Tag <span class="text-destructive">*</span></label>
									<Input class="!bg-white" v-model="editTemp.tag" placeholder="Nombre / Apodo" />
									<div v-if="editErrors.tag" class="text-destructive text-sm mt-1 ">{{ editErrors.tag }}</div>

								<!-- ID (no editable) -->
								<label class="block text-sm font-medium mt-3">ID del Animal</label>
								<input class="w-full rounded-md border p-2 !bg-white" :value="editTemp.id" disabled />
								<div class="text-xs text-muted-foreground mt-1">El ID no se puede modificar</div>

								<!-- Zona Actual (select) -->
								<label class="block text-sm font-medium mt-3">Zona Actual</label>
								<Select v-model="editTemp.zone">
									<SelectTrigger class="w-full">
										<SelectValue placeholder="Selecciona una zona (opcional)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">Sin zona asignada</SelectItem>
										<template v-for="z in zones" :key="z">
											<SelectItem :value="z">{{ z }}</SelectItem>
										</template>
									</SelectContent>
								</Select>
								<div class="text-xs text-muted-foreground mt-1">La zona se actualiza automáticamente según el tag</div>

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
									<span v-for="(b, idx) in editTemp.beacons" :key="b" class="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-md text-sm">
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
								<Button :disabled="!canSaveEdit" v-if="editTemp.id !== 0" @click="saveEditFromTemp" class="bg-primary text-primary-foreground hover:bg-primary/90">Guardar</Button>
							</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- Delete Alert -->
		<AlertDialog v-model:open="deleteDialogOpen">
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
					<AlertDialogDescription>
						Esta acción eliminará permanentemente el animal "{{ cattleToDelete?.tag }}" (ID: {{ cattleToDelete?.id }}).
					</AlertDialogDescription>
				</AlertDialogHeader>

				<!-- Error message -->
				<div v-if="error && deleteDialogOpen" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
					<p class="text-sm text-red-600">{{ error }}</p>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel :disabled="isLoading">Cancelar</AlertDialogCancel>
					<AlertDialogAction variant="destructive" @click="handleConfirmDelete" :disabled="isLoading">
						<span v-if="isLoading">Eliminando...</span>
						<span v-else>Eliminar</span>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</div>
</template>

<!-- tempAdd and editTemp are declared in the <script setup> block -->
