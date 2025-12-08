<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { wsClient } from '@/services/WebSockets'
import { listVacas, getVacasByUser, getVacaById, createVaca, createCowWithImage, updateVaca, deleteVaca, type Cow } from '@/services/Cows'
import { getZonesByUser, type Zone } from '@/services/Zones'
import { getDevicesByZone } from '@/services/Devices'
import { updateTag, createTag } from '@/services/Tags'
import {
	Search,
	Plus, 
	Camera,
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
import TagDetectedPrompt from '@/components/TagDetectedPrompt.vue'
import TagDetectada from '@/components/TagDetectada.vue'
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
	deviceLocation: string | null  // Ubicación del dispositivo que detecta al tag
	lastSeen: string
	status?: string
	battery_level?: number
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
// Cache de dispositivos por zona (clave: id de zona como string)
const devicesByZone = ref<Record<string, any[]>>({})
const isLoading = ref(false)
const error = ref<string | null>(null)
const selectedCattle = ref<Cattle | null>(null)
// Estado de conexión WebSocket (seguir patrón de Zones)
const wsConnected = ref(false)

const detailModalOpen = ref(false)
const addDialogOpen = ref(false)
const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)

// Estado para mostrar el componente TagDetectada (toast) y el nuevo prompt modal
const detectedTag = ref<null | { mensaje?: string; tagId?: string | number; nivel?: 'info' | 'success' | 'warning' | 'error' }>(null)
const showDetectedTag = ref(false)
let detectedTimeout: ReturnType<typeof setTimeout> | null = null

// Nuevo prompt modal que solicita aceptar/cancelar el registro
const detectedPromptOpen = ref(false)
const detectedPromptPayload = ref<any>(null)

const onDetectedClose = () => {
	showDetectedTag.value = false
	detectedTag.value = null
	if (detectedTimeout) {
		clearTimeout(detectedTimeout)
		detectedTimeout = null
	}
}

const onPromptAccept = (payload: any) => {
	try {
		// Emitir respuesta al backend indicando que el usuario aceptó
		try { wsClient.emit('cow.registration.response', { tag_id: payload?.tag_id ?? payload?.id ?? null, accepted: true }) } catch (e) { console.warn('No se pudo emitir respuesta WS aceptada', e) }

		// Prefill add dialog con la info del payload (misma lógica previa)
		if (payload) {
			if (payload.ear_tag) {
				tempAdd.customId = String(payload.ear_tag)
			}
			tempAdd.beacons = []
			if (payload.tag_id) tempAdd.beacons.push(String(payload.tag_id))
			if (payload.mac_address) tempAdd.notes = `MAC: ${payload.mac_address}`
			if (payload.zone) tempAdd.zone = payload.zone
			addDialogOpen.value = true
		}

	} catch (err) {
		console.error('Error al aceptar prompt de registro:', err)
	} finally {
		detectedPromptOpen.value = false
		detectedPromptPayload.value = null
	}
}

const onPromptCancel = (payload?: any) => {
	try {
		try { wsClient.emit('cow.registration.response', { tag_id: payload?.tag_id ?? payload?.id ?? null, accepted: false }) } catch (e) { console.warn('No se pudo emitir respuesta WS cancelada', e) }
	} catch (err) {
		console.error('Error al cancelar prompt de registro:', err)
	} finally {
		detectedPromptOpen.value = false
		detectedPromptPayload.value = null
	}
}

const cattleToEdit = ref<Cattle | null>(null)
const cattleToDelete = ref<Cattle | null>(null)

// Usar las zonas disponibles del usuario en lugar de las zonas de los animales
const zones = computed(() => availableZones.value.map(z => z.name))

// temp state for add / edit dialogs (avoid nullable types in v-models)
const tempAdd = reactive({ tag: '', image: '', zone: '', notes: '', beacons: [] as string[], customId: '', favorite_food: '' })
const editTemp = reactive({ id: 0, tag: '', image: '', zone: '', notes: '', beacons: [] as string[], ear_tag: '', favorite_food: '' })

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

// Generar un id válido para el backend: cadena numérica (10-12 dígitos)
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

// Normaliza distintos formatos de current_location a string legible o null
const normalizeLocation = (loc: any): string | null => {
	if (!loc && loc !== 0) return null
	try {
		if (typeof loc === 'string') {
			const s = loc.trim()
			return s === '' ? null : s
		}
		if (typeof loc === 'object') {
			// Backend puede enviar { name } o { name, part, subzone }
			const name = loc.name || loc.zone || loc.location || ''
			const part = loc.part || loc.subzone || loc.section || loc.area || ''
			const joined = (name || '') + (part ? ` — ${part}` : '')
			const s = joined.trim()
			return s === '' ? null : s
		}
		return String(loc)
	} catch (e) {
		return null
	}
}

// Intentar inferir la zona humana (zone.name) a partir de current_location normalizado
const inferZoneFromLocation = (locStr: string | null, tagPayload?: any): string | null => {
	if (!locStr) return null
	// 1) Coincidencia directa con nombre de zona
	const zoneMatch = availableZones.value.find(z => String(z.name).toLowerCase() === String(locStr).toLowerCase())
	if (zoneMatch) return zoneMatch.name

	// 2) Buscar en cache de dispositivos por zona (comparar location y mac_address)
	for (const z of availableZones.value) {
		const devs = devicesByZone.value[String(z.id)] || []
		for (const d of devs) {
			try {
				const devLocation = (d.location || d.ubicacion || d.name || '').toString().toLowerCase()
				const locLower = locStr.toLowerCase()
				if (devLocation && devLocation === locLower) return z.name
				// A veces el current_location puede ser el nombre del dispositivo parcial
				if (devLocation && devLocation.includes(locLower)) return z.name
				// Intentar emparejar por MAC si tagPayload incluye mac_address
				if (tagPayload && tagPayload.mac_address && d.mac_address && String(tagPayload.mac_address).toLowerCase() === String(d.mac_address).toLowerCase()) return z.name
			} catch (e) {
				// ignore
			}
		}
	}

	// 3) No se pudo inferir -> devolver el string original (puede ser útil) o null
	return locStr
}

// Buscar la ubicación del dispositivo asociado al tag basándose en la zona
const findDeviceLocation = (zoneName: string | null, tagPayload?: any): string | null => {
	if (!zoneName) return null
	
	// Buscar en el cache de dispositivos por zona
	for (const z of availableZones.value) {
		const devs = devicesByZone.value[String(z.id)] || []
		
		// Si el nombre de la zona coincide
		if (String(z.name).toLowerCase() === String(zoneName).toLowerCase()) {
			// Buscar dispositivo por MAC si está disponible
			if (tagPayload?.mac_address) {
				const matchingDev = devs.find((d: any) => 
					d.mac_address && String(d.mac_address).toLowerCase() === String(tagPayload.mac_address).toLowerCase()
				)
				if (matchingDev?.location) return matchingDev.location
			}
			// Si hay dispositivos en la zona, devolver la ubicación del primero
			if (devs.length > 0 && devs[0]?.location) {
				return devs[0].location
			}
		}
		
		// También buscar si el current_location coincide con alguna ubicación de dispositivo
		for (const d of devs) {
			const devLocation = (d.location || '').toString().toLowerCase()
			if (devLocation && devLocation === String(zoneName).toLowerCase()) {
				return d.location
			}
		}
	}
	
	return null
}

// Mapear Cow de la API a Cattle del componente
const mapCowToCattle = (cow: Cow): Cattle => {
	console.log('%c🐄 DATOS DEL BACKEND', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold; padding: 4px;')
	console.log('ID de la vaca:', cow.id)
	console.log('Nombre:', cow.name)
	console.log('Tag completo:', cow.tag)
	console.log('current_location (ZONA):', cow.tag?.current_location)
	console.log('---')
	
	// Formatear la última transmisión si existe
	const formatLastSeen = (lastTransmission?: string): string => {
		if (!lastTransmission) return 'Sin señal'
		try {
			const date = new Date(lastTransmission)
			const now = new Date()
			const diffMs = now.getTime() - date.getTime()
			const diffMins = Math.floor(diffMs / 60000)
			if (diffMins < 1) return 'Hace unos momentos'
			if (diffMins < 60) return `Hace ${diffMins} minutos`
			const diffHours = Math.floor(diffMins / 60)
			if (diffHours < 24) return `Hace ${diffHours} horas`
			const diffDays = Math.floor(diffHours / 24)
			return `Hace ${diffDays} días`
		} catch {
			return 'Sin señal'
		}
	}
	
	return {
		id: cow.id,
		tag: cow.name,
		image: cow.image || null,
		// current_location puede venir como string o como objeto { name }
		zone: (typeof cow.tag?.current_location === 'string'
			? cow.tag?.current_location
			: (cow.tag?.current_location as any)?.name) ,
		// Buscar la ubicación del dispositivo asociado al tag
		deviceLocation: findDeviceLocation(
			typeof cow.tag?.current_location === 'string'
				? cow.tag?.current_location
				: (cow.tag?.current_location as any)?.name,
			cow.tag
		),
		lastSeen: formatLastSeen(cow.tag?.last_transmission),
		status: cow.tag?.status || 'unknown',
		battery_level: cow.tag?.battery_level,
		notes: (cow as any).description ?? (cow as any).descripcion ?? (cow as any).notes ?? '',
		beacons: cow.tag?.id ? [String(cow.tag.id)] : [],
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
			try {
				cows = await getVacasByUser(userId.value)
			} catch (e) {
				console.warn('getVacasByUser falló, intentando cargar todas las vacas como fallback:', e)
				// Intentar cargar todas las vacas si la consulta por usuario falla
				cows = await listVacas()
				// notificar al usuario que se usó un fallback
				error.value = 'No se pudieron cargar las vacas del usuario; mostrando todas las vacas como respaldo.'
				setTimeout(() => { error.value = null }, 6000)
			}
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

		// Cargar y cachear dispositivos por zona (para poder inferir zone desde device name/mac)
		try {
			await Promise.all(
				availableZones.value.map(async (z) => {
					try {
						const devs = await getDevicesByZone(Number((z as any).id))
						devicesByZone.value[String((z as any).id)] = devs || []
					} catch (e) {
						console.warn('No se pudieron cargar dispositivos para zona', (z as any).id, e)
						devicesByZone.value[String((z as any).id)] = []
					}
				})
			)
		} catch (e) {
			console.warn('Error al cachear dispositivos por zona:', e)
		}
	} catch (err) {
		console.error('Error al cargar zonas:', err)
	}
}

/**
 * Inicializa la conexión WebSocket y registra los handlers específicos para Mi_ganado
 * Separado en función para seguir el patrón usado en `Zones.vue`.
 */
const initWebSocket = () => {
	wsClient.connect({
		onConnect: (socketId) => {
			console.log('✅ WebSocket conectado (Mi_ganado):', socketId)
			wsConnected.value = true
			if (userId.value && userId.value > 0) {
				wsClient.userSubscribe(userId.value)
			} else {
				console.warn('No hay userId disponible para user.subscribe')
			}
		},
		onDisconnect: () => {
			console.log('❌ WebSocket desconectado (Mi_ganado)')
			wsConnected.value = false
		},
		onError: (err) => {
			console.error('Error WebSocket (Mi_ganado):', err)
			wsConnected.value = false
		},
		// Mantener los handlers existentes para registro/actualización de vacas y tags
		onCowRegistrationRequest: (payload) => {
			console.log('📨 cow.registration.request (Mi_ganado):', payload)
			try {
				if (payload) {
					// Mostrar un toast breve indicando que se detectó un tag
					detectedTag.value = { mensaje: payload?.message ?? payload?.mensaje ?? 'Tag detectado', tagId: payload?.tag_id ?? payload?.id ?? payload?.tag?.id ?? null, nivel: 'info' }
					showDetectedTag.value = true
					if (detectedTimeout) { clearTimeout(detectedTimeout); detectedTimeout = null }
					detectedTimeout = setTimeout(() => { onDetectedClose() }, 6000)
					// Abrir prompt para confirmar registro
					detectedPromptPayload.value = payload
					detectedPromptOpen.value = true
					if (payload.redirect_url) {
						try { window.location.href = payload.redirect_url } catch (navErr) { console.warn('No se pudo navegar a redirect_url:', navErr) }
					}
				}
			} catch (err) { console.error('Error al manejar cow.registration.request:', err) }
		},
		onCowRegistrationTimeout: (payload) => {
			console.log('⏱️ cow.registration.timeout (Mi_ganado):', payload)
			addDialogOpen.value = false
			// Cerrar prompt de registro si estaba abierto
			detectedPromptOpen.value = false
			detectedPromptPayload.value = null
			error.value = 'El registro del tag venció. Intenta nuevamente.'
			setTimeout(() => { error.value = null }, 5000)
		},
		onCowRegistrationError: (payload) => {
			console.log('❌ cow.registration.error (Mi_ganado):', payload)
			addDialogOpen.value = false
			// Cerrar prompt si hay error
			detectedPromptOpen.value = false
			detectedPromptPayload.value = null
			error.value = payload?.message || 'Error durante el registro del tag'
			setTimeout(() => { error.value = null }, 5000)
		},
		onCowStatus: (cow) => {
			console.log('🔄 onCowStatus (Mi_ganado):', cow)
			try {
				if (selectedCattle.value && String(selectedCattle.value.id) === String(cow.id)) {
					const rawLoc = (cow as any).tag?.current_location
					const normalizedLoc = normalizeLocation(rawLoc)
					const inferredZone = inferZoneFromLocation(normalizedLoc, (cow as any).tag)
					const updated: Partial<Cattle> = {
						tag: (cow as any).name ?? selectedCattle.value.tag,
						image: (cow as any).image ?? selectedCattle.value.image ?? null,
						zone: inferredZone ?? selectedCattle.value.zone ?? null,
						deviceLocation: findDeviceLocation(inferredZone, (cow as any).tag) ?? selectedCattle.value.deviceLocation ?? null,
						lastSeen: (() => {
							const lt = (cow as any).tag?.last_transmission
							if (!lt) return selectedCattle.value.lastSeen
							try {
								const date = new Date(lt)
								const now = new Date()
								const diffMs = now.getTime() - date.getTime()
								const diffMins = Math.floor(diffMs / 60000)
								if (diffMins < 1) return 'Hace unos momentos'
								if (diffMins < 60) return `Hace ${diffMins} minutos`
								const diffHours = Math.floor(diffMins / 60)
								if (diffHours < 24) return `Hace ${diffHours} horas`
								const diffDays = Math.floor(diffHours / 24)
								return `Hace ${diffDays} días`
							} catch { return selectedCattle.value.lastSeen }
						})(),
						status: (cow as any).tag?.status ?? selectedCattle.value.status,
						battery_level: (cow as any).tag?.battery_level ?? selectedCattle.value.battery_level,
						notes: (() => {
							const desc = (cow as any).description ?? (cow as any).descripcion
							if (typeof desc === 'string' && desc.trim() !== '') return desc
							return selectedCattle.value.notes
						})(),
						beacons: (() => {
							const id = (cow as any).tag?.id
							if (!id) return selectedCattle.value.beacons
							return [String(id)]
						})(),
						tag_id: (cow as any).tag?.id ?? selectedCattle.value.tag_id,
					}
					selectedCattle.value = { ...selectedCattle.value, ...updated }
				}
			} catch (e) { console.warn('Error aplicando cow.status update:', e) }
		},
		onCowError: (err) => { console.warn('onCowError (Mi_ganado):', err) },
		onCowCreated: async (cow) => { console.log('🆕 cow.created (Mi_ganado):', cow); await loadCattle() },
		onCowUpdated: async (cow) => { console.log('♻️ cow.updated (Mi_ganado):', cow); await loadCattle() },
		onCowDeleted: (payload) => {
			try {
				const id = Number((payload && payload.id) ?? payload)
				if (!isNaN(id)) {
					const idx = cattleList.value.findIndex(c => Number(c.id) === id)
					if (idx >= 0) cattleList.value.splice(idx, 1)
				}
				console.log('🗑️ cow.deleted aplicado (Mi_ganado):', id)
			} catch (e) { console.warn('No se pudo aplicar cow.deleted:', e) }
		},
		onUserCowsUpdated: async () => { console.log('👥 user.cows.updated (Mi_ganado): recargando lista'); await loadCattle() },
		onTagUpdated: async (tag: any) => {
			try {
						const rawLoc = tag?.current_location
						const normalizedLoc = normalizeLocation(rawLoc)
						const zone = inferZoneFromLocation(normalizedLoc, tag)
						const deviceLocation = findDeviceLocation(zone, tag)
				const formatLastSeen = (lastTransmission?: string): string => {
					if (!lastTransmission) return 'Sin señal'
					try {
						const date = new Date(lastTransmission)
						const now = new Date()
						const diffMs = now.getTime() - date.getTime()
						const diffMins = Math.floor(diffMs / 60000)
						if (diffMins < 1) return 'Hace unos momentos'
						if (diffMins < 60) return `Hace ${diffMins} minutos`
						const diffHours = Math.floor(diffMins / 60)
						if (diffHours < 24) return `Hace ${diffHours} horas`
						const diffDays = Math.floor(diffHours / 24)
						return `Hace ${diffDays} días`
					} catch { return 'Sin señal' }
				}
				if (tag?.id) {
					cattleList.value = cattleList.value.map(c => {
						if (Number(c.tag_id) === Number(tag.id)) {
							return {
								...c,
								zone,
								deviceLocation,
								status: tag?.status ?? c.status,
								battery_level: typeof tag?.battery_level === 'number' ? tag.battery_level : c.battery_level,
								lastSeen: formatLastSeen(tag?.last_transmission)
							}
						}
						return c
					})
					if (selectedCattle.value && Number(selectedCattle.value.tag_id) === Number(tag.id)) {
						selectedCattle.value = {
							...selectedCattle.value,
							zone,
							deviceLocation,
							status: tag?.status ?? selectedCattle.value.status,
							battery_level: typeof tag?.battery_level === 'number' ? tag.battery_level : selectedCattle.value.battery_level,
							lastSeen: formatLastSeen(tag?.last_transmission)
						}
					}
				}
			} catch (e) { console.warn('Error aplicando tag.updated:', e) }
		}
	})
}

/**
 * Cierra la conexión WS y limpia suscripciones
 */
const closeWebSocket = () => {
	try {
		if (userId.value && userId.value > 0) {
			try { wsClient.userUnsubscribe(userId.value) } catch (e) { console.warn('userUnsubscribe falló', e) }
		}
	} catch {}
	try { wsClient.disconnect() } catch (e) { console.warn('wsClient.disconnect falló', e) }
	wsConnected.value = false
}

onMounted(async () => {
	const filter = route.query.filter as string | undefined
	if (filter === 'online') zoneFilter.value = 'online'
	else if (filter === 'offline') zoneFilter.value = 'offline'
	
	// Cargar usuario desde localStorage
	loadUser()
	
	// Cargar zonas y datos desde la API de forma secuencial
	await loadZones()
	await loadCattle()

	// Iniciar WebSocket usando la función centralizada
	initWebSocket()

	// Si el userId aún no estaba listo al conectar, suscribir en cuanto esté disponible
	watch(userId, (val) => {
	    try {
	        if (val && val > 0 && wsClient.isConnected()) {
	            console.log('🔄 userId disponible, suscribiendo a user:', val)
	            wsClient.userSubscribe(val)
	        }
	    } catch (e) { console.warn('Fallo al suscribir user tras cambio de userId:', e) }
	})
})

onUnmounted(() => {
	// Usar closeWebSocket para limpiar suscripciones y desconectar
	closeWebSocket()
})

// Suscribir/desuscribir a la vaca cuando se abre/cierra el modal de detalle
watch([detailModalOpen, selectedCattle], ([open, cattle]) => {
	try {
		if (open && cattle && cattle.id) {
			wsClient.subscribeCow(Number(cattle.id))
			// No llamar getCow() para evitar conexiones adicionales
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
		// Limpiar imagen y archivo previo para evitar que persista entre aperturas
		try {
			if (currentAddObjectUrl) {
				URL.revokeObjectURL(currentAddObjectUrl)
				currentAddObjectUrl = null
			}
		} catch {}
		selectedFile.value = null
		tempAdd.image = ''
	} else {
		// Al cerrar el diálogo, asegurarse de limpiar todo el estado temporal
		try {
			if (currentAddObjectUrl) {
				URL.revokeObjectURL(currentAddObjectUrl)
				currentAddObjectUrl = null
			}
		} catch {}
		selectedFile.value = null
		tempAdd.tag = ''
		tempAdd.image = ''
		tempAdd.zone = ''
		tempAdd.notes = ''
		tempAdd.beacons = []
		tempAdd.customId = ''
		tempAdd.favorite_food = ''
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
		
		// Obtener el ear_tag si fue proporcionado (no forzar a número)
		const cowEarTag = newCattle.customId && String(newCattle.customId).trim() !== ''
			? String(newCattle.customId).trim()
			: undefined

		if (cowEarTag !== undefined) {
			console.log('🆔 ear_tag personalizado del animal:', cowEarTag)
		}
		
		// Verificar si viene un tag_id existente (desde WebSocket)
		const existingTagId = newCattle.beacons && newCattle.beacons.length > 0 
			? parseInt(newCattle.beacons[0]) 
			: null
		
		let tagIdToUse: number
		
		if (existingTagId && !isNaN(existingTagId)) {
			// Usar tag existente (viene del WebSocket)
			console.log('%c🔗 RELACIONANDO VACA CON TAG EXISTENTE', 'background: #2196F3; color: white; font-size: 16px; font-weight: bold; padding: 6px;')
			console.log('📍 Tag ID existente:', existingTagId)
			console.log('🗺️ Zona asignada:', newCattle.zone || 'Sin zona')
			tagIdToUse = existingTagId
		} else {
			// Crear un tag nuevo (flujo manual)
			console.log('%c🆕 CREANDO NUEVA VACA CON TAG ÚNICO', 'background: #4CAF50; color: white; font-size: 16px; font-weight: bold; padding: 6px;')
			
			const uniqueTagId = generateNumericTagId()
			const macAddress = `MAC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

			console.log('📍 Creando tag único (numérico id):', uniqueTagId)
			console.log('📡 MAC Address:', macAddress)
			console.log('🗺️ Zona inicial:', newCattle.zone || 'Sin zona')
			
			const newTag = await createTag({
				id: uniqueTagId,
				mac_address: macAddress,
				battery_level: 100,
				status: 'active',
				last_transmission: new Date().toISOString(),
				current_location: newCattle.zone || ''
			})
			
			console.log('✅ Tag creado exitosamente:', newTag)
			tagIdToUse = newTag.id
		}
		
		// 2. CREAR LA VACA con el tag_id (existente o nuevo)
		let createdCow: Cow
		
		// Si hay un archivo seleccionado, usar el endpoint REST con imagen
		if (selectedFile.value) {
			createdCow = await createCowWithImage(
				tagIdToUse, // Usar el tag_id (existente o nuevo)
				newCattle.tag || `Ganado ${Date.now()}`,
				userId.value,
				newCattle.favorite_food || undefined,
				newCattle.notes || undefined,
				selectedFile.value,
				cowEarTag // Pasar ear_tag personalizado si fue proporcionado
			)
		} else {
			// Si no hay imagen, usar GraphQL createVaca
			const createInput: any = {
				nombre: newCattle.tag || `Ganado ${Date.now()}`,
				// Enviar descripción desde el campo de notas
				descripcion: newCattle.notes || undefined,
				// Enviar comida_preferida solo si se capturó explícitamente
				comida_preferida: newCattle.favorite_food || undefined,
				id_usuario: userId.value,
				tag_id: tagIdToUse // Usar el tag_id (existente o nuevo)
			}
			
			// Agregar ear_tag si fue proporcionado
			if (cowEarTag !== undefined) {
				createInput.ear_tag = cowEarTag
			}
			
			createdCow = await createVaca(createInput)
		}
		
		console.log('✅ Vaca creada exitosamente:', createdCow)
		console.log('🔗 Vaca ID:', createdCow.id, '- Tag ID:', tagIdToUse)
		
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
	editTemp.ear_tag = cattle.ear_tag ?? ''
	editTemp.favorite_food = cattle.favorite_food ?? ''
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
							id: generateNumericTagId(),
							mac_address: `MAC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
							battery_level: 100,
							status: 'active',
							last_transmission: new Date().toISOString(),
							// Backend espera objeto TagLocationInput o null
							current_location: (editTemp.zone === '' || editTemp.zone === null) ? null : { name: editTemp.zone },
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
						const updatePayload: { current_location?: { name: string } | null } = {}
						updatePayload.current_location = (editTemp.zone === '' || editTemp.zone === null) ? null : { name: editTemp.zone }
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
		
		// Actualizar los datos de la vaca (nombre, descripción, comida favorita)
		console.log('%c🐄 ACTUALIZANDO DATOS DE LA VACA', 'background: #FF9800; color: white; font-size: 14px; padding: 4px;')
		// Preparar payload de actualización de vaca. Si creamos un tag nuevo, asignarlo aquí.
		const vacaUpdatePayload: any = {
			nombre: editTemp.tag,
			// Enviar 'descripcion' desde el campo de notas
			descripcion: editTemp.notes || undefined,
			// Enviar 'comida_preferida' desde su propio campo si existe
			comida_preferida: editTemp.favorite_food || undefined,
			ear_tag: editTemp.ear_tag || undefined,
		}
		if ((editTemp as any)._newTagId) {
			vacaUpdatePayload.tag_id = (editTemp as any)._newTagId
			console.log('Asignando nuevo tag_id a la vaca en updateVaca:', vacaUpdatePayload.tag_id)
		}
		await updateVaca(id, vacaUpdatePayload)
		console.log('✅ Datos de la vaca actualizados')

		// Actualizar solo localmente para evitar conexiones adicionales
		const updatedCattle: Cattle = {
			id,
			tag: editTemp.tag,
			image: editTemp.image || currentCattle?.image || null,
			zone: editTemp.zone === '' ? null : editTemp.zone,
			lastSeen: currentCattle?.lastSeen || 'Hace unos momentos',
			notes: (() => {
				const n = editTemp.notes
				if (typeof n === 'string' && n.trim() !== '') return n
				return currentCattle?.notes || ''
			})(),
			beacons: editTemp.beacons && editTemp.beacons.length ? [...editTemp.beacons] : currentCattle?.beacons || [],
			ear_tag: editTemp.ear_tag,
			favorite_food: currentCattle?.favorite_food,
			tag_id: (editTemp as any)._newTagId || currentCattle?.tag_id,
			behaviorStats: currentCattle?.behaviorStats
		}

		cattleList.value = cattleList.value.map(c => (c.id === id ? updatedCattle : c))
		if (selectedCattle.value && selectedCattle.value.id === id) {
			selectedCattle.value = { ...selectedCattle.value, ...updatedCattle }
		}
		console.log('✅ Animal actualizado localmente sin recargar la lista completa')

		editDialogOpen.value = false
		cattleToEdit.value = null
		editTemp.id = 0
		editTemp.tag = ''
		editTemp.image = ''
		editTemp.zone = ''
		editTemp.notes = ''
		editTemp.beacons = []
		editTemp.ear_tag = ''
		editTemp.favorite_food = ''
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
				favorite_food: tempAdd.favorite_food,
			})

		// Reset temporary add form
		tempAdd.tag = ''
		tempAdd.image = ''
		tempAdd.zone = ''
		tempAdd.notes = ''
		tempAdd.beacons = []
		tempAdd.customId = ''
		tempAdd.favorite_food = ''

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
		
		// Eliminar localmente (no recargar toda la lista para evitar conexiones adicionales)
		cattleList.value = cattleList.value.filter((c) => c.id !== idToDelete)
		
		deleteDialogOpen.value = false
		cattleToDelete.value = null
		
		console.log('✅ Animal eliminado correctamente')
	} catch (err: any) {
		console.error('Error al eliminar ganado:', err)
		error.value = err.message || 'Error al eliminar el ganado. Por favor, intenta nuevamente.'
		// Mantener el diálogo abierto para mostrar el error
	} finally {
		isLoading.value = false
	}
}

/**
 * Helper: devuelve el texto de estado a mostrar en la tarjeta/modal.
 * Se deja sencillo: si no hay lastSeen mostramos "Sin señal", si existe devolvemos el propio lastSeen.
 */
const getStatusText = (lastSeen?: string | null): string => {
	if (!lastSeen || lastSeen === '') return 'Sin señal'
	return lastSeen
}

/**
 * Helper: devuelve clases de Badge según el estado (lastSeen).
 * - Si no hay lastSeen -> estilo destructivo
 * - Si hay lastSeen -> estilo positivo
 */
const getBadgeClass = (lastSeen?: string | null): string => {
	if (!lastSeen || lastSeen === '') {
		return 'bg-red-100 text-red-700 px-2 py-1'
	}
	return 'bg-emerald-100 text-emerald-700 px-2 py-1'
}
</script>

<template>
	<div class="p-6 space-y-6">
		<!-- Header 
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-foreground">Mi Ganadería</h1>
				<p class="text-muted-foreground mt-1">Gestiona y monitorea todos tus animales ({{ cattleList.length }} registrados)</p>
			</div>
			<Button @click="addDialogOpen = true" size="lg" class="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" >
				<Plus class="h-5 w-5" />
				Agregar Ganado
			</Button>
		</div> -->

		<!-- Toast breve cuando se detecta un tag -->
		<TagDetectada v-if="showDetectedTag" :mensaje="detectedTag?.mensaje" :tagId="detectedTag?.tagId" :nivel="detectedTag?.nivel" @close="onDetectedClose" />

		<!-- Prompt modal para registro de tag (se muestra al recibir evento WS) -->
		<TagDetectedPrompt v-model:open="detectedPromptOpen" :payload="detectedPromptPayload" @accept="onPromptAccept" @cancel="onPromptCancel" />

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
					Cartas
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
			<img src="/images/Vaca.png" alt="Vaca" class="h-40 w-40 mb-4 select-none" />
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
								<img src="/images/Vaca.png" alt="Vaca" class="h-40 w-40 select-none" />
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
						<div class="flex justify-between items-center">
							<p class="text-sm font-semibold text-gray-600">{{ cattle.ear_tag || `ID: ${cattle.id}` }}</p>
							<Badge :class="getBadgeClass(cattle.lastSeen)">{{ getStatusText(cattle.lastSeen) }}</Badge>
						</div>
						<h3 class="font-semibold text-lg text-foreground truncate">{{ cattle.tag }}</h3>
						<div class="flex items-center gap-2 text-sm text-muted-foreground mt-2">
							<template v-if="cattle.zone">
								<MapPin class="h-3 w-3 text-primary" />
								<Badge class="bg-emerald-100 text-emerald-700 px-2 py-1">{{ cattle.deviceLocation || cattle.zone }}</Badge>
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
							<img src="/images/Vaca.png" alt="Vaca" class="h-12 w-12 select-none" />
						</div>
					  </template>

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h3 class="font-semibold text-lg text-foreground truncate">{{ cattle.tag }}</h3>
							<Badge variant="outline" class="text-xs">{{ cattle.ear_tag || `ID: ${cattle.id}` }}</Badge>
						</div>
					<div class="flex items-center gap-4 text-sm text-muted-foreground">
						<template v-if="cattle.zone">
							<div class="flex items-center gap-1">
								<MapPin class="h-4 w-4 text-primary" />
								<span>{{ cattle.deviceLocation || cattle.zone }}</span>
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
										<img src="/images/Vaca.png" alt="Vaca" class="h-25 w-25 select-none" />
									</div>
								</template>
								<div class="hidden md:block">
									<!-- spacer to align with right column on md+ screens -->
								</div>
							</div>

										<div class="md:col-span-2">
											<div class="flex flex-col md:flex-row md:items-start md:justify-between">
																<div class="max-w-lg">
																	<h2 class="text-2xl font-bold leading-tight">Etiqueta: {{ selectedCattle?.ear_tag }}</h2>
																	<p class="text-xl font-semibold mt-1">{{ selectedCattle?.tag }}</p>
																</div>
									<div class="mt-3 md:mt-0 flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground">Dispositivo:</span>
									<div class="flex items-center gap-2">
											<MapPin class="h-4 w-4 text-primary" />
											<Badge v-if="selectedCattle?.zone" class="bg-emerald-100 text-emerald-700 px-2 py-1">{{ selectedCattle.deviceLocation || selectedCattle.zone }}</Badge>
											<Badge v-else variant="destructive" class="px-2 py-1">Sin ubicación</Badge>
									</div>
								</div>										<div class="flex items-center gap-2">
											<div class="text-sm text-muted-foreground">Última detección:</div>
											<div class="text-sm font-medium">{{ selectedCattle?.lastSeen }}</div>
										</div>

										<div class="flex items-center gap-2">
											<div class="text-sm text-muted-foreground">Estado:</div>
											<Badge v-if="selectedCattle?.status === 'active'" class="bg-green-100 text-green-700 px-2 py-1">Activo</Badge>
											<Badge v-else-if="selectedCattle?.status === 'inactive'" class="bg-gray-100 text-gray-700 px-2 py-1">Inactivo</Badge>
											<Badge v-else variant="destructive" class="px-2 py-1">Sin señal</Badge>
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
						<label class="block text-sm font-medium mt-1">Numero de etiqueta</label>
						<Input v-model="tempAdd.customId" class="w-full rounded-md border p-2 bg-white!" placeholder="Agregar etiqueta" />
						<div v-if="addErrors.customId" class="text-destructive text-sm mt-1">{{ addErrors.customId }}</div>
						<div v-else class="text-xs text-muted-foreground mt-1">Si lo proporcionas, se usará como ID de la vaca.</div>
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
								<Camera class="w-8 h-8 text-muted-foreground mb-2" />
								<div class="text-sm font-medium">Agregar Imagen</div>

								
								<div class="text-xs text-muted-foreground mt-2">Agregar Imagen(si el dispositivo lo permite)</div>
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
					<div class="flex gap-2 flex-wrap mt-2">
						<span v-for="(b, idx) in tempAdd.beacons" :key="b" class="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-md text-sm">
							{{ b }}
							<button @click.prevent="removeBeaconFromTemp(idx)" class="ml-1 text-sm text-destructive">✕</button>
						</span>
					</div>

					<label class="block text-sm font-medium mt-3">Descripción</label>
						<textarea v-model="tempAdd.notes" placeholder="Describe a la vaca..." class="w-full rounded-md border p-3 h-24 bg-white!"></textarea>
						
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
						<label class="block text-sm font-medium mt-3">ID del Animal (ear_tag)</label>
						<Input class="w-full rounded-md border p-2 bg-white!" v-model="editTemp.ear_tag" placeholder="Ej: VA-120" />
						<div class="text-xs text-muted-foreground mt-1">ID único del animal.</div>

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
							<template v-if="editTemp.image">
								<img :src="editTemp.image" alt="preview" class="w-full h-40 object-cover rounded-lg" />
							</template>
							<template v-else>
								<div class="w-full h-40 rounded-lg flex items-center justify-center bg-gray-100">
												<img src="/images/Vaca.png" alt="Vaca" class="h-16 w-16 select-none" />
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

						<!-- Descripción -->
						<label class="block text-sm font-medium mt-3">Descripción</label>
						<textarea v-model="editTemp.notes" placeholder="Describe a la vaca..." class="w-full rounded-md border p-3 h-28 bg-white!"></textarea>
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
