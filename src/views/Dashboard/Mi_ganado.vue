<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { wsClient } from '@/services/WebSockets'
import { listVacas, getVacasByUser, getVacaById, createVaca, createCowWithImage, updateVaca, deleteVaca, type Cow } from '@/services/Cows'
import { getZonesByUser, type Zone } from '@/services/Zones'
import { updateTag, createTag } from '@/services/Tags'
import {
	PiggyBank,
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
const tempAdd = reactive({ tag: '', image: '', zone: '', notes: '', beacons: [] as string[], customId: '' })
const editTemp = reactive({ id: 0, tag: '', image: '', zone: '', notes: '', beacons: [] as string[] })

// validation state
const addErrors = reactive({ tag: '', image: '', zone: '', customId: '' })
const editErrors = reactive({ tag: '', image: '' })

// Flag de mitigación: si true, NO llamamos a updateTag (evita cambios globales si el backend está roto)
// Poner en `false` para permitir persistencia en backend.
const DISABLE_TAG_UPDATE = false

const validateImageUrl = (url?: string) => {
	if (!url) return true
	// allow relative paths starting with /, http(s), blob or data URLs (for local file previews)
	return /^\/|^https?:\/\/|^blob:|^data:/.test(url)
}

// Generar un id_tag válido para el backend: cadena numérica (10-12 dígitos)
const generateNumericTagId = (): string => {
	// usar timestamp + 3 dígitos aleatorios para minimizar colisiones
	const timestampPart = (Date.now() % 10000000000).toString().padStart(10, '0')
	const randPart = Math.floor(Math.random() * 900 + 100).toString() // 3 dígitos
	return `${timestampPart}${randPart}`
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
		image: cow.image || null,
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
		
		// 🔍 VERIFICACIÓN: Asegurar que cada vaca tiene su propio tag único
		console.log('%c📊 VERIFICACIÓN DE TAGS ÚNICOS', 'background: #2196F3; color: white; font-size: 16px; font-weight: bold; padding: 6px;')
		console.table(cattleList.value.map(c => ({
			'ID Vaca': c.id,
			'Nombre': c.tag,
			'Tag ID': c.tag_id,
			'Zona': c.zone || 'Sin zona'
		})))
		
		// Verificar si hay duplicados
		const tagIds = cattleList.value.map(c => c.tag_id).filter(Boolean)
		const duplicates = tagIds.filter((id, index) => tagIds.indexOf(id) !== index)
		
		if (duplicates.length > 0) {
			console.warn('%c⚠️ ADVERTENCIA: Tags compartidos detectados', 'background: #FF9800; color: white; font-size: 14px; padding: 4px;')
			console.warn('Tags duplicados:', [...new Set(duplicates)])
		} else {
			console.log('%c✅ Perfecto: Cada vaca tiene su propio tag único', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px;')
		}
		
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

	// Inicializar WebSocket y suscribirse a eventos de registro de vacas
	wsClient.connect({
		onConnect: (socketId) => {
			console.log('✅ WebSocket conectado (Mi_ganado):', socketId)
			// Suscribir al usuario si existe
			if (userId.value && userId.value > 0) {
				wsClient.userSubscribe(userId.value)
			} else {
				console.warn('No hay userId disponible para user.subscribe')
			}
		},
		onDisconnect: () => {
			console.log('❌ WebSocket desconectado (Mi_ganado)')
		},
		onError: (err) => {
			console.error('Error WebSocket (Mi_ganado):', err)
		},
		onCowRegistrationRequest: (payload) => {
			console.log('📨 cow.registration.request (Mi_ganado):', payload)
			// Prefill add dialog with info from payload
			try {
				if (payload) {
					// Prefill 'ear_tag' (campo mostrado en UI como "ID del Animal (ear_tag)")
					// El campo del formulario se llama tempAdd.customId, así que lo rellenamos con el valor del payload
					// Preferir ear_tag (campo que usan en la BD) si está presente
					if (payload.ear_tag) {
						tempAdd.customId = String(payload.ear_tag)
					} else if (payload.tag_id) {
						tempAdd.customId = String(payload.tag_id)
					} else if (payload.tag && payload.tag.id_tag) {
						tempAdd.customId = String(payload.tag.id_tag)
					}

					// también mantener beacons si se usa en otros flujos
					tempAdd.beacons = []
					if (tempAdd.customId) tempAdd.beacons.push(tempAdd.customId)

					// mac_address -> anotar en notas para referencia
					if (payload.mac_address) tempAdd.notes = `MAC: ${payload.mac_address}`

					// zona sugerida
					if (payload.zone) tempAdd.zone = payload.zone

					// abrir diálogo de agregar vaca
					addDialogOpen.value = true

					// si viene redirect_url, navegar a ella (por ejemplo para flujo móvil)
					if (payload.redirect_url) {
						try {
							window.location.href = payload.redirect_url
						} catch (navErr) {
							console.warn('No se pudo navegar a redirect_url:', navErr)
						}
					}
				}
			} catch (err) {
				console.error('Error al manejar cow.registration.request:', err)
			}
		},
		onCowRegistrationTimeout: (payload) => {
			console.log('⏱️ cow.registration.timeout (Mi_ganado):', payload)
			// Cerrar diálogo y avisar al usuario
			addDialogOpen.value = false
			error.value = 'El registro del tag venció. Intenta nuevamente.'
			setTimeout(() => { error.value = null }, 5000)
		},
		onCowRegistrationError: (payload) => {
			console.log('❌ cow.registration.error (Mi_ganado):', payload)
			addDialogOpen.value = false
			error.value = payload?.message || 'Error durante el registro del tag'
			setTimeout(() => { error.value = null }, 5000)
		}
		,onCowStatus: (cow) => {
			// Actualizaciones en tiempo real para una vaca suscrita
			console.log('🔄 onCowStatus (Mi_ganado):', cow)
			try {
				if (selectedCattle.value && String(selectedCattle.value.id) === String(cow.id)) {
					// actualizar campos visibles del modal
					selectedCattle.value = { ...selectedCattle.value, ...cow }
				}
			} catch (e) {
				console.warn('Error aplicando cow.status update:', e)
			}
		},
		onCowError: (err) => {
			console.warn('onCowError (Mi_ganado):', err)
			// mostrar error breve si aplica
			if (err && err.message) {
				error.value = err.message
				setTimeout(() => { error.value = null }, 5000)
			}
		}
	})
})

onUnmounted(() => {
	// Desuscribir usuario y cerrar WebSocket al salir del componente
	if (userId.value && userId.value > 0) {
		try { wsClient.userUnsubscribe(userId.value) } catch (e) { console.warn('userUnsubscribe falló', e) }
	}
	wsClient.disconnect()
})

// Suscribir/desuscribir a la vaca cuando se abre/cierra el modal de detalle
watch([detailModalOpen, selectedCattle], ([open, cattle]) => {
	try {
		if (open && cattle && cattle.id) {
			wsClient.subscribeCow(Number(cattle.id))
			// también solicitar snapshot puntual para sincronizar
			wsClient.getCow(Number(cattle.id))
		} else if (!open && cattle && cattle.id) {
			wsClient.unsubscribeCow(Number(cattle.id))
		}
	} catch (e) {
		console.warn('Error gestionando suscripción a cow:', e)
	}
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

const handleAddCattle = async (newCattle: any) => {
	try {
		isLoading.value = true
		error.value = null
		
		// Verificar que tenemos userId
		if (!userId.value || userId.value <= 0) {
			error.value = 'No se encontró el ID de usuario. Por favor, inicia sesión nuevamente.'
			isLoading.value = false
			return
		}
		
		console.log('%c🆕 CREANDO NUEVA VACA CON TAG ÚNICO', 'background: #4CAF50; color: white; font-size: 16px; font-weight: bold; padding: 6px;')
		
		// 1. CREAR UN TAG ÚNICO para esta vaca (id_tag debe ser numérico)
		const uniqueTagId = generateNumericTagId()
		const macAddress = `MAC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

		console.log('📍 Creando tag único (numérico id_tag):', uniqueTagId)
		console.log('📡 MAC Address:', macAddress)
		console.log('🗺️ Zona inicial:', newCattle.zone || 'Sin zona')
		
				// Obtener el ear_tag si fue proporcionado (no forzar a número)
				const cowEarTag = newCattle.customId && String(newCattle.customId).trim() !== ''
					? String(newCattle.customId).trim()
					: undefined

				if (cowEarTag !== undefined) {
					console.log('🆔 ear_tag personalizado del animal:', cowEarTag)
				}
		
		const newTag = await createTag({
			id_tag: uniqueTagId,
			mac_address: macAddress,
			battery_level: 100,
			status: 'active',
			last_transmission: new Date().toISOString(),
			current_location: newCattle.zone || ''
		})
		
		console.log('✅ Tag creado exitosamente:', newTag)
		
		// 2. CREAR LA VACA con el tag_id único y opcionalmente el ID personalizado
		let createdCow: Cow
		
		// Si hay un archivo seleccionado, usar el endpoint REST con imagen
		if (selectedFile.value) {
			createdCow = await createCowWithImage(
				newTag.id, // Usar el ID del tag recién creado
				newCattle.tag || `Ganado ${Date.now()}`,
				userId.value,
				newCattle.notes || 'Sin información adicional',
				selectedFile.value,
				cowEarTag // Pasar ear_tag personalizado si fue proporcionado
			)
		} else {
			// Si no hay imagen, usar GraphQL createVaca
			const createInput: any = {
				nombre: newCattle.tag || `Ganado ${Date.now()}`,
				comida_preferida: newCattle.notes || 'No especificada',
				id_usuario: userId.value,
				tag_id: newTag.id // Usar el ID del tag recién creado
			}
			
			// Agregar ear_tag si fue proporcionado
			if (cowEarTag !== undefined) {
				createInput.ear_tag = cowEarTag
			}
			
			createdCow = await createVaca(createInput)
		}
		
		console.log('✅ Vaca creada exitosamente:', createdCow)
		console.log('🔗 Vaca ID:', createdCow.id, '- Tag ID:', newTag.id)
		
		addDialogOpen.value = false
		
		// Recargar lista después de agregar
		await loadCattle()
	} catch (err: any) {
		console.error('❌ Error al agregar ganado:', err)
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
		
		// Obtener la vaca actual para saber su tag_id y zona actual
		const currentCattle = cattleList.value.find(c => c.id === id)
		
		console.log('%c🔍 EDITANDO VACA', 'background: #2196F3; color: white; font-size: 14px; font-weight: bold; padding: 4px;')
		console.log('ID Vaca:', id)
		console.log('Nombre nuevo:', editTemp.tag)
		console.log('Tag ID:', currentCattle?.tag_id)
		console.log('Zona ACTUAL:', currentCattle?.zone)
		console.log('Zona NUEVA:', editTemp.zone)
		console.log('¿Zona cambió?:', editTemp.zone !== currentCattle?.zone)
		
		// SOLO actualizar el tag si la zona REALMENTE cambió
		if (editTemp.zone !== currentCattle?.zone) {
			// Validaciones: asegurar tag_id válido y zona permitida
			if (!currentCattle?.tag_id) {
				console.warn('⚠️ Intento de actualizar zona pero tag_id no existe o es inválido', currentCattle)
				error.value = 'No es posible actualizar la zona: tag inválido.'
				isLoading.value = false
				return
			}

			// Forzar a número si viene como string
			const tagIdNum = Number(currentCattle.tag_id)
			if (Number.isNaN(tagIdNum) || tagIdNum <= 0) {
				console.warn('⚠️ tag_id no es un número válido:', currentCattle.tag_id)
				error.value = 'ID del tag inválido. No se puede actualizar la zona.'
				isLoading.value = false
				return
			}

			// Validar que la nueva zona exista en las zonas disponibles (o esté vacía para quitar zona)
			const availableZoneNames = availableZones.value.map(z => z.name)
			if (editTemp.zone !== '' && !availableZoneNames.includes(editTemp.zone)) {
				console.warn('⚠️ Zona seleccionada no existe en las zonas del usuario:', editTemp.zone)
				error.value = 'La zona seleccionada no es válida.'
				isLoading.value = false
				return
			}

			// ahora sí usamos tagIdNum para la petición
			const effectiveTagId = tagIdNum

			console.log('¿Zona cambió?:', editTemp.zone !== currentCattle?.zone)

			if (effectiveTagId) {
				// Contar si este tag está siendo usado por otras vacas
				const tagUsageCount = cattleList.value.filter(c => c.tag_id === currentCattle?.tag_id).length
				console.log('Uso del tag por vacas en la lista:', tagUsageCount)

				// Si el tag está compartido, NO actualizamos el tag global (evita cambiar la zona para otras vacas)
				// En su lugar, creamos un tag nuevo y se lo asignamos sólo a esta vaca
				if (tagUsageCount > 1) {
					console.log('%c🔁 Tag compartido detectado — creando tag nuevo y asignando sólo a esta vaca', 'background:#FFC107;color:#000;padding:4px')
					try {
						const newTagPayload = {
							id_tag: generateNumericTagId(),
							mac_address: `MAC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
							battery_level: 100,
							status: 'active',
							last_transmission: new Date().toISOString(),
							current_location: editTemp.zone === '' || editTemp.zone === null ? '' : editTemp.zone,
						}
						console.log('📤 Payload new tag:', JSON.stringify(newTagPayload, null, 2))
						const created = await createTag(newTagPayload)
						console.log('✅ Tag nuevo creado:', created)
						// guardar el nuevo tag id para usarlo al actualizar la vaca más abajo
						// (marcamos editTemp._newTagId temporalmente)
						;(editTemp as any)._newTagId = created.id
					} catch (createErr: any) {
						console.error('❌ Error al crear tag nuevo:', createErr)
						error.value = `Error al crear tag temporal: ${createErr.message}`
						isLoading.value = false
						return
					}
				} else {
					// Tag único: es seguro actualizar el tag directamente
					if (!DISABLE_TAG_UPDATE) {
						console.log('%c📍 ACTUALIZANDO ZONA DEL TAG (único)', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px;')
						const updatePayload: { current_location?: string } = {}
						updatePayload.current_location = editTemp.zone === '' || editTemp.zone === null ? '' : editTemp.zone
						console.log('📤 Payload enviado al backend:', JSON.stringify(updatePayload, null, 2))
						try {
							const result = await updateTag(effectiveTagId, updatePayload)
							console.log('✅ Tag actualizado correctamente:', result)
							console.log('Nueva ubicación del tag:', result.current_location)
						} catch (tagErr: any) {
							console.error('❌ Error al actualizar ubicación del tag:', tagErr)
							error.value = `Error al actualizar la zona: ${tagErr.message}`
							isLoading.value = false
							return
						}
					} else {
						console.warn('⚠️ DISABLED: updateTag está deshabilitado por DISABLE_TAG_UPDATE=true — no se persistirá la zona en el backend')
					}
				}
			}
		} else if (!currentCattle?.tag_id) {
			console.warn('⚠️ Esta vaca no tiene tag_id asignado')
		} else {
			console.log('ℹ️ La zona no cambió, no es necesario actualizar el tag')
		}
		
		// Actualizar los datos de la vaca (nombre, comida favorita)
		console.log('%c🐄 ACTUALIZANDO DATOS DE LA VACA', 'background: #FF9800; color: white; font-size: 14px; padding: 4px;')
		// Preparar payload de actualización de vaca. Si creamos un tag nuevo, asignarlo aquí.
		const vacaUpdatePayload: any = {
			nombre: editTemp.tag,
			comida_preferida: editTemp.notes || undefined,
		}
		if ((editTemp as any)._newTagId) {
			vacaUpdatePayload.tag_id = (editTemp as any)._newTagId
			console.log('Asignando nuevo tag_id a la vaca en updateVaca:', vacaUpdatePayload.tag_id)
		}
		await updateVaca(id, vacaUpdatePayload)
		console.log('✅ Datos de la vaca actualizados')

		if (!DISABLE_TAG_UPDATE) {
			// Intentar obtener la vaca actualizada desde el backend para asegurar persistencia
			try {
				const freshCow = await getVacaById(id)
				if (freshCow) {
					const mapped = mapCowToCattle(freshCow)
					cattleList.value = cattleList.value.map(c => (c.id === id ? mapped : c))
					// actualizar selectedCattle si está abierto
					if (selectedCattle.value && selectedCattle.value.id === id) {
						selectedCattle.value = { ...selectedCattle.value, ...mapped }
					}
					console.log('%c🔄 Estado sincronizado con backend (vaca recargada)', 'background:#4CAF50;color:white;padding:4px', mapped)
				} else {
					console.warn('No se obtuvo la vaca actualizada del backend')
				}
			} catch (fetchErr: any) {
				console.error('Error al obtener la vaca actualizada del backend:', fetchErr)
				// como fallback, actualizar localmente para que el usuario vea los cambios
				try {
					const updatedCattle = {
						id,
						tag: editTemp.tag,
						image: editTemp.image || currentCattle?.image || null,
						zone: editTemp.zone === '' ? null : editTemp.zone,
						lastSeen: currentCattle?.lastSeen || 'Hace unos momentos',
						notes: editTemp.notes || currentCattle?.notes || '',
						beacons: editTemp.beacons && editTemp.beacons.length ? [...editTemp.beacons] : currentCattle?.beacons || [],
						ear_tag: currentCattle?.ear_tag,
						favorite_food: currentCattle?.favorite_food,
						tag_id: currentCattle?.tag_id,
					}

					cattleList.value = cattleList.value.map(c => c.id === id ? updatedCattle : c)
					if (selectedCattle.value && selectedCattle.value.id === id) {
						selectedCattle.value = { ...selectedCattle.value, ...updatedCattle }
					}
				} catch (updateLocalErr) {
					console.warn('No se pudo actualizar localmente la vaca como fallback:', updateLocalErr)
				}
			}
		} else {
			// DISABLE_TAG_UPDATE = true -> no persistimos la zona en backend; aplicamos update local como comportamiento seguro
			console.warn('⚠️ DISABLE_TAG_UPDATE está activo: aplicando cambio de zona SOLO localmente (no se persistirá en backend)')
			try {
				const updatedCattle = {
					id,
					tag: editTemp.tag,
					image: editTemp.image || currentCattle?.image || null,
					zone: editTemp.zone === '' ? null : editTemp.zone,
					lastSeen: currentCattle?.lastSeen || 'Hace unos momentos',
					notes: editTemp.notes || currentCattle?.notes || '',
					beacons: editTemp.beacons && editTemp.beacons.length ? [...editTemp.beacons] : currentCattle?.beacons || [],
					ear_tag: currentCattle?.ear_tag,
					favorite_food: currentCattle?.favorite_food,
					tag_id: currentCattle?.tag_id,
				}

				cattleList.value = cattleList.value.map(c => c.id === id ? updatedCattle : c)
				if (selectedCattle.value && selectedCattle.value.id === id) {
					selectedCattle.value = { ...selectedCattle.value, ...updatedCattle }
				}
			} catch (updateLocalErr) {
				console.warn('No se pudo actualizar localmente la vaca al aplicar DISABLE_TAG_UPDATE:', updateLocalErr)
			}
		}

		editDialogOpen.value = false
		cattleToEdit.value = null
		editTemp.id = 0
		editTemp.tag = ''
		editTemp.image = ''
		editTemp.zone = ''
		editTemp.notes = ''
		editTemp.beacons = []
		// limpiar cualquier tag temporal creado durante la edición
		if ((editTemp as any)._newTagId) delete (editTemp as any)._newTagId
	} catch (err: any) {
		console.error('Error al guardar la edición:', err)
		error.value = err.message || 'Error al actualizar la vaca.'
	} finally {
		isLoading.value = false
	}
}

const handleConfirmAdd = async () => {
	// clear errors
	addErrors.tag = ''
	addErrors.image = ''
	addErrors.zone = ''

		if (!tempAdd.tag || tempAdd.tag.trim() === '') addErrors.tag = 'El nombre es requerido'
		if (!validateImageUrl(tempAdd.image)) addErrors.image = 'URL de imagen inválida'

		// Validar ear_tag (si fue provisto)
		addErrors.customId = ''
		const providedCustomId = tempAdd.customId ? String(tempAdd.customId).trim() : ''
		if (providedCustomId) {
			// Permitir letras, números, guiones y guiones bajos
			if (!/^[A-Za-z0-9-_]+$/.test(providedCustomId)) {
				addErrors.customId = 'El ear_tag solo puede contener letras, números, guiones y guiones bajos'
			} else {
				// Validar que no exista ya ese ear_tag
				const existingCattle = cattleList.value.find(c => c.ear_tag === providedCustomId)
				if (existingCattle) {
					addErrors.customId = `El ear_tag ${providedCustomId} ya está asignado al animal "${existingCattle.tag}"`
				}
			}
		}
		
		// stop if validation errors
	if (addErrors.tag || addErrors.image || addErrors.zone || addErrors.customId) return

	try {
		isLoading.value = true
		// Reuse central handler that creates tag and cow (handles selectedFile and userId)
			await handleAddCattle({
				tag: tempAdd.tag,
				image: tempAdd.image,
				zone: tempAdd.zone,
				notes: tempAdd.notes,
				beacons: tempAdd.beacons,
				customId: tempAdd.customId,
			})

		// Reset temporary add form
		tempAdd.tag = ''
		tempAdd.image = ''
		tempAdd.zone = ''
		tempAdd.notes = ''
		tempAdd.beacons = []
		tempAdd.customId = ''

		// revoke object URL if any
		if (currentAddObjectUrl) {
			URL.revokeObjectURL(currentAddObjectUrl)
			currentAddObjectUrl = null
		}
	} catch (err) {
		// handleAddCattle already sets error, nothing extra required here
	} finally {
		isLoading.value = false
	}
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
			<Input placeholder="Buscar por nombre o ID..." v-model="searchQuery" class="pl-9 bg-white!" />
		</div>

	<Select v-model="zoneFilter">
			<SelectTrigger class="w-[220px] bg-white!">
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
			<PiggyBank class="h-16 w-16 text-muted-foreground mb-4" />
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
						<template v-if="cattle.image">
							<img :src="cattle.image" :alt="cattle.tag" class="h-44 w-full object-cover" />
						</template>
						<template v-else>
							<div class="h-44 w-full flex items-center justify-center bg-gray-100">
								<PiggyBank class="h-20 w-20 text-muted-foreground" />
							</div>
						</template>
						
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
					  <template v-if="cattle.image">
						<img :src="cattle.image" :alt="cattle.tag" class="h-16 w-16 rounded-lg object-cover shrink-0" />
					  </template>
					  <template v-else>
						<div class="h-16 w-16 rounded-lg flex items-center justify-center bg-gray-100 shrink-0">
							<PiggyBank class="h-8 w-8 text-muted-foreground" />
						</div>
					  </template>

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
								<template v-if="selectedCattle?.image">
									<img :src="selectedCattle?.image" :alt="selectedCattle?.tag" class="w-44 h-36 rounded-lg object-cover" />
								</template>
								<template v-else>
									<div class="w-44 h-36 rounded-lg flex items-center justify-center bg-gray-100">
										<PiggyBank class="h-12 w-12 text-muted-foreground" />
									</div>
								</template>
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
							<label class="block text-sm font-medium">Nombre<span class="text-destructive">*</span></label>
							<Input class="bg-white!" v-model="tempAdd.tag" placeholder="Ej: El Pinto, La Manchada..." />
							<div v-if="addErrors.tag" class="text-destructive text-sm mt-1">{{ addErrors.tag }}</div>
						</div>

					<!-- ID del Animal (opcional, puede proporcionarlo el usuario) -->
					<div>
						<label class="block text-sm font-medium mt-1">ID del Animal (ear_tag)</label>
						<input v-model="tempAdd.customId" class="w-full rounded-md border p-2 bg-white!" placeholder="Dejar vacío para generar automáticamente" />
						<div v-if="addErrors.customId" class="text-destructive text-sm mt-1">{{ addErrors.customId }}</div>
						<div v-else class="text-xs text-muted-foreground mt-1">Si lo proporcionas, se usará como ID de la vaca. Debe ser numérico.</div>
					</div>						<!-- Zona inicial (select) - OPCIONAL -->
						<div>
						<!--	<label class="block text-sm font-medium mt-3">Zona Inicial (opcional)</label>
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
							<div class="text-xs text-muted-foreground mt-1">Puedes asignar una zona más tarde</div> -->
						</div>

						<!-- Imagen: gallery / camera boxes -->
						<div>
							<label class="block text-sm font-medium mt-3">Imagen del Animal</label>
						<div class="mt-2 grid grid-cols-2 gap-3">
							<!-- gallery -->
							<!--<div @click.prevent="triggerAddGallery" class="flex flex-col items-center justify-center border-dashed border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:bg-white">
								<div class="text-sm font-medium">Subir desde galería</div>
								<div class="text-xs text-muted-foreground mt-2">Selecciona una imagen desde tu dispositivo</div>
							</div>-->
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

						<!-- beacons and notes 
						<label class="block text-sm font-medium mt-3">Beacons</label>
						<div class="flex gap-2 mt-2">
						<input v-model="addBeaconInput" placeholder="Agregar beacon (ID)" class="flex-1 rounded-md border p-2" />
						<button @click.prevent="addBeaconToTemp" class="px-3 py-2 bg-primary text-white rounded-md">Agregar</button>
					</div>-->
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
									<label class="block text-sm font-medium">Nombre<span class="text-destructive">*</span></label>
									<Input class="bg-white!" v-model="editTemp.tag" placeholder="Nombre / Apodo" />
									<div v-if="editErrors.tag" class="text-destructive text-sm mt-1 ">{{ editErrors.tag }}</div>

							<!-- ID (no editable) -->
							<label class="block text-sm font-medium mt-3">ID del Animal</label>
							<input class="w-full rounded-md border p-2 bg-white!" :value="editTemp.id" disabled />
							<div class="text-xs text-muted-foreground mt-1">El ID no se puede modificar</div>								<!-- Zona Actual (select) -->
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
										<template v-if="editTemp.image">
											<img :src="editTemp.image" alt="preview" class="w-full h-40 object-cover rounded-lg" />
										</template>
										<template v-else>
											<div class="w-full h-40 rounded-lg flex items-center justify-center bg-gray-100">
												<PiggyBank class="h-12 w-12 text-muted-foreground" />
											</div>
										</template>
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
