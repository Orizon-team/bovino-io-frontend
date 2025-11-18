<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { cn } from '@/lib/utils'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPin,
  Radio,
  Plus,
  WifiOff,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-vue-next'
import { getZonesByUser, createZone, updateZone, deleteZone } from '@/services/Zones'
import { getDevicesByZone, createDevice, deleteDevice, updateDevice } from '@/services/Devices'

type Device = {
  id: string
  type: string
  location: string | null
  battery: number
  status: 'active' | 'inactive' | 'warning' | 'pending'
  macAddress?: string | null
}

type Zone = {
  id: string
  name: string
  devices: Device[]
  devicesLoading?: boolean
}

const zones = ref<Zone[]>([])
const expandedZones = ref<Set<string>>(new Set())
const addZoneDialogOpen = ref(false)
const addDeviceDialogOpen = ref(false)
const editZoneDialogOpen = ref(false)
const editDeviceDialogOpen = ref(false)
const deleteZoneDialogOpen = ref(false)
const deleteDeviceDialogOpen = ref(false)
const selectedZone = ref<Zone | null>(null)
const selectedDevice = ref<{ zoneId: string; device: Device } | null>(null)

const loading = ref(false)
const error = ref<string | null>(null)

const addZoneLoading = ref(false)
const addZoneError = ref<string | null>(null)
const addZoneTouched = ref(false)

const editZoneLoading = ref(false)
const editZoneError = ref<string | null>(null)
const editZoneTouched = ref(false)

const deleteZoneLoading = ref(false)
const deleteZoneError = ref<string | null>(null)

const addDeviceLoading = ref(false)
const addDeviceError = ref<string | null>(null)

const editDeviceLoading = ref(false)
const editDeviceError = ref<string | null>(null)

const editDeviceIdDialogOpen = ref(false)
const editDeviceIdLoading = ref(false)
const editDeviceIdError = ref<string | null>(null)

const deleteDeviceLoading = ref(false)
const deleteDeviceError = ref<string | null>(null)

const zoneFormData = ref<{ name: string }>({ name: '' })
const deviceFormData = ref<{ ubicacion: string; tipo: string; zoneId: string; macAddress: string }>({
  ubicacion: '', 
  tipo: 'master', 
  zoneId: '',
  macAddress: ''
})

const isZoneNameValid = computed(() => {
  return zoneFormData.value.name.trim().length >= 3
})

const totalZones = computed(() => zones.value.length)
const totalDevices = computed(() => zones.value.reduce((acc, z) => acc + z.devices.length, 0))
const activeDevices = computed(() => zones.value.reduce((acc, z) => acc + z.devices.filter((d) => d.status === 'active').length, 0))
const warningDevices = computed(() => zones.value.reduce((acc, z) => acc + z.devices.filter((d) => d.status === 'warning').length, 0))
const inactiveDevices = computed(() => zones.value.reduce((acc, z) => acc + z.devices.filter((d) => d.status === 'inactive').length, 0))
const pendingDevices = computed(() => zones.value.reduce((acc, z) => acc + z.devices.filter((d) => d.status === 'pending').length, 0))

const loadZones = async () => {
  loading.value = true
  error.value = null

  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      throw new Error('No se encontró información del usuario')
    }

    const user = JSON.parse(userString)
    const userId = user.id_user

    if (!userId) {
      throw new Error('ID de usuario no válido')
    }

    const apiZones = await getZonesByUser(userId)

    zones.value = apiZones.map((zone) => ({
      id: String(zone.id),
      name: zone.name,
      devices: [],
      devicesLoading: false,
    }))

    await Promise.all(
      apiZones.map(async (zone) => {
        try {
          const apiDevices = await getDevicesByZone(zone.id)
          
          const devices: Device[] = apiDevices.map((device) => ({
            id: String(device.id),
            type: device.type,
            location: device.location,
            battery: device.battery_level || 0,
            macAddress: device.mac_address || null,
            status: device.status === 'active' ? 'active' 
                   : device.status === 'inactive' ? 'inactive'
                   : device.status === 'pending' ? 'pending'
                   : 'warning',
          }))

          zones.value = zones.value.map((z) =>
            z.id === String(zone.id) ? { ...z, devices } : z
          )
        } catch (err) {
          console.error(`Error al cargar dispositivos de zona ${zone.id}:`, err)
        }
      })
    )

  } catch (err) {
    console.error('Error al cargar zonas:', err)
    error.value = err instanceof Error ? err.message : 'Error al cargar las zonas'
  } finally {
    loading.value = false
  }
}

const loadDevicesForZone = async (zoneId: string) => {
  const zone = zones.value.find((z) => z.id === zoneId)
  if (!zone || zone.devicesLoading || zone.devices.length > 0) return

  zone.devicesLoading = true

  try {
    const apiDevices = await getDevicesByZone(Number(zoneId))

    const devices: Device[] = apiDevices.map((device) => ({
      id: String(device.id),
      type: device.type,
      location: device.location,
      battery: device.battery_level || 0,
      macAddress: device.mac_address || null,
      status: device.status === 'active' ? 'active' 
             : device.status === 'inactive' ? 'inactive'
             : device.status === 'pending' ? 'pending'
             : 'warning',
    }))

    zones.value = zones.value.map((z) =>
      z.id === zoneId ? { ...z, devices, devicesLoading: false } : z
    )
  } catch (err) {
    console.error('Error al cargar dispositivos:', err)
    zones.value = zones.value.map((z) =>
      z.id === zoneId ? { ...z, devicesLoading: false } : z
    )
  }
}

onMounted(() => {
  loadZones()
})

const toggleZone = async (zoneId: string) => {
  const newSet = new Set(expandedZones.value)
  const isExpanding = !newSet.has(zoneId)
  
  if (isExpanding) {
    newSet.add(zoneId)
    expandedZones.value = newSet
    await loadDevicesForZone(zoneId)
  } else {
    newSet.delete(zoneId)
    expandedZones.value = newSet
  }
}

const handleAddZone = async () => {
  addZoneTouched.value = true

  if (!isZoneNameValid.value) {
    return
  }

  addZoneLoading.value = true
  addZoneError.value = null

  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      throw new Error('No se encontró información del usuario')
    }

    const user = JSON.parse(userString)
    const userId = user.id_user

    if (!userId) {
      throw new Error('ID de usuario no válido')
    }

    const newZone = await createZone({
      name: zoneFormData.value.name,
      id_user: userId,
    })

    zones.value = [...zones.value, {
      id: String(newZone.id),
      name: newZone.name,
      devices: [],
      devicesLoading: false,
    }]

    addZoneDialogOpen.value = false
    zoneFormData.value = { name: '' }
    addZoneTouched.value = false
  } catch (err) {
    console.error('Error al crear zona:', err)
    addZoneError.value = err instanceof Error ? err.message : 'Error al crear la zona'
  } finally {
    addZoneLoading.value = false
  }
}

const handleAddDevice = async () => {
  if (!deviceFormData.value.ubicacion || !deviceFormData.value.zoneId) {
    return
  }

  addDeviceLoading.value = true
  addDeviceError.value = null

  try {
    const newDevice = await createDevice({
      battery_level: null,
      id_zona: Number(deviceFormData.value.zoneId),
      status: 'pending',
      tipo: deviceFormData.value.tipo,
      ubicacion: deviceFormData.value.ubicacion,
      ultima_actualizacion: null,
    })

    const device: Device = {
      id: String(newDevice.id),
      type: newDevice.type,
      location: newDevice.location,
      battery: newDevice.battery_level || 0,
      macAddress: newDevice.mac_address, 
      status: 'pending',
    }

    zones.value = zones.value.map((z) =>
      z.id === deviceFormData.value.zoneId ? { ...z, devices: [...z.devices, device] } : z,
    )

    addDeviceDialogOpen.value = false
    deviceFormData.value = { ubicacion: '', tipo: 'master', zoneId: '', macAddress: '' }
  } catch (err) {
    console.error('Error al crear dispositivo:', err)
    addDeviceError.value = err instanceof Error ? err.message : 'Error al crear el dispositivo'
  } finally {
    addDeviceLoading.value = false
  }
}

const handleEditZone = async () => {
  editZoneTouched.value = true

  if (!selectedZone.value || !isZoneNameValid.value) {
    return
  }

  editZoneLoading.value = true
  editZoneError.value = null

  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      throw new Error('No se encontró información del usuario')
    }

    const user = JSON.parse(userString)
    const userId = user.id_user

    if (!userId) {
      throw new Error('ID de usuario no válido')
    }

    const updatedZone = await updateZone(Number(selectedZone.value.id), {
      name: zoneFormData.value.name,
      id_user: userId,
    })

    zones.value = zones.value.map((z) =>
      z.id === selectedZone.value?.id ? { ...z, name: updatedZone.name } : z
    )

    editZoneDialogOpen.value = false
    selectedZone.value = null
    zoneFormData.value = { name: '' }
    editZoneTouched.value = false
  } catch (err) {
    console.error('Error al actualizar zona:', err)
    editZoneError.value = err instanceof Error ? err.message : 'Error al actualizar la zona'
  } finally {
    editZoneLoading.value = false
  }
}

const handleEditDevice = async () => {
  if (!selectedDevice.value || !deviceFormData.value.ubicacion) {
    return
  }

  editDeviceLoading.value = true
  editDeviceError.value = null

  try {
    const updatedDevice = await updateDevice(Number(selectedDevice.value.device.id), {
      ubicacion: deviceFormData.value.ubicacion,
    })

    zones.value = zones.value.map((z) =>
      z.id === selectedDevice.value!.zoneId
        ? {
            ...z,
            devices: z.devices.map((d) =>
              d.id === selectedDevice.value!.device.id ? {
                ...d,
                type: updatedDevice.type,
                location: updatedDevice.location,
                macAddress: updatedDevice.mac_address,
              } : d,
            ),
          }
        : z,
    )

    editDeviceDialogOpen.value = false
    selectedDevice.value = null
    deviceFormData.value = { ubicacion: '', tipo: 'master', zoneId: '', macAddress: '' }
  } catch (err) {
    console.error('Error al editar dispositivo:', err)
    editDeviceError.value = err instanceof Error ? err.message : 'Error al editar el dispositivo'
  } finally {
    editDeviceLoading.value = false
  }
}

const handleEditDeviceId = async () => {
  if (!selectedDevice.value || !deviceFormData.value.macAddress) {
    return
  }

  editDeviceIdLoading.value = true
  editDeviceIdError.value = null

  try {
    const input = {
      mac_address: deviceFormData.value.macAddress,
      status: 'active',
      battery_level: 100
    }

    const updatedDevice = await updateDevice(Number(selectedDevice.value.device.id), input)

    zones.value = zones.value.map((z) =>
      z.id === selectedDevice.value!.zoneId
        ? {
            ...z,
            devices: z.devices.map((d) =>
              d.id === selectedDevice.value!.device.id ? {
                ...d,
                macAddress: updatedDevice.mac_address,
                status: 'active',
                battery: 100,
              } : d,
            ),
          }
        : z,
    )

    editDeviceIdDialogOpen.value = false
    selectedDevice.value = null
    deviceFormData.value = { ubicacion: '', tipo: 'master', zoneId: '', macAddress: '' }
  } catch (err) {
    console.error('Error al editar ID del dispositivo:', err)
    editDeviceIdError.value = err instanceof Error ? err.message : 'Error al editar el ID del dispositivo'
  } finally {
    editDeviceIdLoading.value = false
  }
}

const handleDeleteZone = async () => {
  if (!selectedZone.value) return

  deleteZoneLoading.value = true
  deleteZoneError.value = null

  try {
    await deleteZone(Number(selectedZone.value.id))

    zones.value = zones.value.filter((z) => z.id !== selectedZone.value!.id)

    deleteZoneDialogOpen.value = false
    selectedZone.value = null
  } catch (err) {
    console.error('Error al eliminar zona:', err)
    deleteZoneError.value = err instanceof Error ? err.message : 'Error al eliminar la zona'
  } finally {
    deleteZoneLoading.value = false
  }
}

const handleDeleteDevice = async () => {
  if (!selectedDevice.value) return

  deleteDeviceLoading.value = true
  deleteDeviceError.value = null

  try {
    await deleteDevice(Number(selectedDevice.value.device.id))

    zones.value = zones.value.map((z) =>
      z.id === selectedDevice.value!.zoneId
        ? { ...z, devices: z.devices.filter((d) => d.id !== selectedDevice.value!.device.id) }
        : z,
    )

    deleteDeviceDialogOpen.value = false
    selectedDevice.value = null
  } catch (err) {
    console.error('Error al eliminar dispositivo:', err)
    deleteDeviceError.value = err instanceof Error ? err.message : 'Error al eliminar el dispositivo'
  } finally {
    deleteDeviceLoading.value = false
  }
}

const openEditZoneDialog = (zone: Zone) => {
  selectedZone.value = zone
  zoneFormData.value = { name: zone.name }
  editZoneTouched.value = false
  editZoneError.value = null
  editZoneDialogOpen.value = true
}

const openDeleteZoneDialog = (zone: Zone) => {
  selectedZone.value = zone
  deleteZoneError.value = null
  deleteZoneDialogOpen.value = true
}

const openAddDeviceDialog = (zoneId: string) => {
  deviceFormData.value = { ubicacion: '', tipo: 'master', zoneId, macAddress: '' }
  addDeviceDialogOpen.value = true
}

const openEditDeviceDialog = (zoneId: string, device: Device) => {
  selectedDevice.value = { zoneId, device }
  deviceFormData.value = { ubicacion: device.location || '', tipo: device.type, zoneId, macAddress: device.macAddress || '' } 
  editDeviceError.value = null
  editDeviceDialogOpen.value = true
}

const openEditDeviceIdDialog = (zoneId: string, device: Device) => {
  selectedDevice.value = { zoneId, device }
  deviceFormData.value = { ubicacion: device.location || '', tipo: device.type, zoneId, macAddress: device.macAddress || '' }
  editDeviceIdError.value = null
  editDeviceIdDialogOpen.value = true
}

const openDeleteDeviceDialog = (zoneId: string, device: Device) => {
  selectedDevice.value = { zoneId, device }
  deleteDeviceError.value = null
  deleteDeviceDialogOpen.value = true
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Zonas y Dispositivos</h1>
        <p class="text-muted-foreground mt-1">Gestiona las zonas y sus dispositivos IoT asociados</p>
      </div>
      <Button @click="addZoneDialogOpen = true" size="lg" class="gap-2">
        <Plus class="h-5 w-5" />
        Agregar Zona
      </Button>
    </div>

    <div v-if="error" class="text-destructive text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-12">
      <p class="text-muted-foreground">Cargando zonas...</p>
    </div>

    <div v-if="!loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-muted-foreground">Zonas</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ totalZones }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MapPin class="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-muted-foreground">Dispositivos</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ totalDevices }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Radio class="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div> 
              <p class="text-xs font-medium text-muted-foreground">Activos</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{{ activeDevices }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 class="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between"> 
            <div>
              <p class="text-xs font-medium text-muted-foreground">Advertencias</p>
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{{ warningDevices }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertCircle class="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-muted-foreground">Inactivos</p>
              <p class="text-2xl font-bold text-destructive mt-1">{{ inactiveDevices }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <WifiOff class="h-5 w-5 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-muted-foreground">Pendiente</p>
              <p class="text-2xl font-bold text-gray-600 mt-1">{{ pendingDevices }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-500/10">
              <Clock class="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="!loading && zones.length === 0" class="text-center py-12">
      <MapPin class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 class="text-lg font-semibold text-foreground mb-2">No tienes zonas creadas</h3>
      <p class="text-muted-foreground mb-4">Comienza agregando tu primera zona para monitorear tu ganado</p>
      <Button @click="addZoneDialogOpen = true" class="gap-2">
        <Plus class="h-4 w-4" />
        Agregar Primera Zona
      </Button>
    </div>

    <div v-if="!loading && zones.length > 0" class="space-y-4">
      <template v-for="zone in zones" :key="zone.id">
        <Card class="overflow-hidden">
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1">
                <button
                  @click="toggleZone(zone.id)"
                  class="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                >
                  <component :is="expandedZones.has(zone.id) ? ChevronDown : ChevronRight" class="h-5 w-5 text-muted-foreground shrink-0" />
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg shrink-0 bg-primary/10">
                    <MapPin class="h-5 w-5 text-primary" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <CardTitle class="text-lg font-semibold truncate">{{ zone.name }}</CardTitle>
                    <CardDescription class="text-xs">
                      {{ zone.devices.length }} dispositivo{{ zone.devices.length !== 1 ? 's' : '' }}
                    </CardDescription>
                  </div>
                </button>
              </div>

              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 mr-2">
                  <Badge
                    v-if="zone.devices.filter(d => d.status === 'active').length > 0"
                    variant="outline"
                    class="bg-green-500/10 text-green-700 border-green-500/20"
                  >
                    {{ zone.devices.filter(d => d.status === 'active').length }} activo{{ zone.devices.filter(d => d.status === 'active').length !== 1 ? 's' : '' }}
                  </Badge>

                  <Badge
                    v-if="zone.devices.filter(d => d.status === 'warning').length > 0"
                    variant="outline"
                    class="bg-amber-500/10 text-amber-700 border-amber-500/20"
                  >
                    {{ zone.devices.filter(d => d.status === 'warning').length }}
                  </Badge>

                  <Badge
                    v-if="zone.devices.filter(d => d.status === 'inactive').length > 0"
                    variant="outline"
                    class="bg-destructive/10 text-destructive border-destructive/20"
                  >
                    {{ zone.devices.filter(d => d.status === 'inactive').length }}
                  </Badge>

                  <Badge
                    v-if="zone.devices.filter(d => d.status === 'pending').length > 0"
                    variant="outline"
                    class="bg-gray-500/10 text-gray-600 border-gray-500/20"
                  >
                    {{ zone.devices.filter(d => d.status === 'pending').length }}{{ zone.devices.filter(d => d.status === 'pending').length !== 1 ? 's' : '' }}
                  </Badge>
                </div>

                <Button variant="outline" size="sm" class="gap-2 bg-transparent" @click="openAddDeviceDialog(zone.id)">
                  <Plus class="h-4 w-4" />
                  Dispositivo
                </Button>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="openEditZoneDialog(zone)">
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click="openDeleteZoneDialog(zone)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent v-if="expandedZones.has(zone.id)" class="pt-0">
            <div class="space-y-3 pl-8">
              <div v-if="zone.devicesLoading" class="text-center py-8 text-muted-foreground text-sm">
                Cargando dispositivos...
              </div>

              <div v-else-if="zone.devices.length === 0" class="text-center py-8 text-muted-foreground text-sm">
                No hay dispositivos en esta zona. Agrega uno para comenzar el monitoreo.
              </div>

              <template v-else v-for="device in zone.devices" :key="device.id">
                <Card class="bg-muted/30">
                  <CardContent class="p-4">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Radio class="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p class="font-semibold text-sm">{{ device.location }}</p>
                          <p class="text-xs text-muted-foreground">ID: {{ device.id }} • Tipo {{ device.type }}</p>
                        </div>
                      </div>

                      <div class="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          :class="cn(
                            'text-xs',
                            device.status === 'active' && 'bg-green-500/10 text-green-700 border-green-500/20',
                            device.status === 'warning' && 'bg-amber-500/10 text-amber-700 border-amber-500/20',
                            device.status === 'inactive' && 'bg-destructive/10 text-destructive border-destructive/20',
                            device.status === 'pending' && 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                          )"
                        >
                          {{ 
                            device.status === 'active' ? 'Activo' 
                            : device.status === 'warning' ? 'Advertencia' 
                            : device.status === 'inactive' ? 'Inactivo'
                            : 'Pendiente'
                          }}
                        </Badge>
                        
                        <Button variant="ghost" size="icon" class="h-7 w-7" @click="openEditDeviceDialog(zone.id, device)">
                          <Pencil class="h-3 w-3" />
                        </Button>

                        <Button 
                            v-if="device.status === 'pending'" 
                            variant="ghost" 
                            size="icon" 
                            class="h-8 w-8" 
                            @click="openEditDeviceIdDialog(zone.id, device)"
                          >
                            <Settings class="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="icon" class="h-7 w-7 text-destructive hover:text-destructive" @click="openDeleteDeviceDialog(zone.id, device)">
                          <Trash2 class="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center gap-1">
                          <Zap class="h-3 w-3 text-muted-foreground" />
                          <span class="text-muted-foreground">Batería</span>
                        </div>
                        <span :class="cn(
                          'font-semibold', 
                          device.status === 'pending' ? 'text-gray-600'
                          : device.battery > 50 ? 'text-green-600' 
                          : device.battery > 20 ? 'text-amber-600' 
                          : 'text-destructive'
                        )">
                          {{ device.battery }}%
                        </span>
                      </div>
                      <Progress
                        :modelValue="device.battery"
                        :class="cn(
                          'h-1.5', 
                          device.status === 'pending' ? '[&>div]:bg-gray-400'
                          : device.battery > 50 ? '[&>div]:bg-green-600' 
                          : device.battery > 20 ? '[&>div]:bg-amber-600' 
                          : '[&>div]:bg-destructive'
                        )"
                      />
                    </div>
                  </CardContent>
                </Card>
              </template>
            </div>
          </CardContent>
        </Card>
      </template>
    </div>

    <!-- Dialog: Agregar Zona -->
    <Dialog v-model:open="addZoneDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Zona</DialogTitle>
          <DialogDescription>Crea una nueva zona para agrupar dispositivos IoT</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div v-if="addZoneError" class="text-destructive text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
            {{ addZoneError }}
          </div>

          <div class="space-y-2">
            <Label for="zone-name">Nombre de la Zona</Label>
            <Input
              id="zone-name"
              v-model="zoneFormData.name"
              placeholder="Ej: Pastizal Norte"
              @blur="addZoneTouched = true"
              :disabled="addZoneLoading"
            />
            <p v-if="addZoneTouched && !isZoneNameValid" class="text-destructive text-sm">
              El nombre debe tener al menos 3 caracteres.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            @click="addZoneDialogOpen = false"
            :disabled="addZoneLoading"
          >
            Cancelar
          </Button>
          <Button
            @click="handleAddZone"
            :disabled="addZoneLoading || !zoneFormData.name"
          >
            <span v-if="addZoneLoading">Agregando...</span>
            <span v-else>Agregar Zona</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Dialog: Agregar Dispositivo -->
    <Dialog v-model:open="addDeviceDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Dispositivo</DialogTitle>
          <DialogDescription>Registra un nuevo dispositivo IoT en esta zona</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div v-if="addDeviceError" class="text-destructive text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
            {{ addDeviceError }}
          </div>

          <div class="space-y-2">
            <Label for="device-ubicacion">Localización</Label>
            <Input
              id="device-ubicacion"
              v-model="deviceFormData.ubicacion"
              placeholder="Ej: Pastizal 1"
              :disabled="addDeviceLoading"
            />
            <p class="text-xs text-muted-foreground">
              Ubicación física del dispositivo en la zona
            </p>
          </div>

          <div class="space-y-2">
            <Label for="device-tipo">Tipo de Dispositivo</Label>
            <Select v-model="deviceFormData.tipo" :disabled="addDeviceLoading">
              <SelectTrigger id="device-tipo">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="master">master</SelectItem>
                <SelectItem value="slave">slave</SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">
              Los dispositivos maestros coordinan la red, los esclavos recopilan datos
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            @click="addDeviceDialogOpen = false"
            :disabled="addDeviceLoading"
          >
            Cancelar
          </Button>
          <Button
            @click="handleAddDevice"
            :disabled="addDeviceLoading || !deviceFormData.ubicacion"
          >
            <span v-if="addDeviceLoading">Agregando...</span>
            <span v-else>Agregar Dispositivo</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Dialog: Editar Zona -->
    <Dialog v-model:open="editZoneDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Zona</DialogTitle>
          <DialogDescription>Modifica la información de la zona</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div v-if="editZoneError" class="text-destructive text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
            {{ editZoneError }}
          </div>

          <div class="space-y-2">
            <Label for="edit-zone-name">Nombre de la Zona</Label>
            <Input
              id="edit-zone-name"
              v-model="zoneFormData.name"
              placeholder="Ej: Pastizal Sur"
              @blur="editZoneTouched = true"
              :disabled="editZoneLoading"
            />
            <p v-if="editZoneTouched && !isZoneNameValid" class="text-destructive text-sm">
              El nombre debe tener al menos 3 caracteres.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            @click="editZoneDialogOpen = false"
            :disabled="editZoneLoading"
          >
            Cancelar
          </Button>
          <Button
            @click="handleEditZone"
            :disabled="editZoneLoading || !isZoneNameValid"
          >
            <span v-if="editZoneLoading">Guardando...</span>
            <span v-else>Guardar Cambios</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Dialog: Editar Dispositivo -->
    <Dialog v-model:open="editDeviceDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Dispositivo</DialogTitle>
          <DialogDescription>Modifica la ubicación y tipo del dispositivo IoT</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div v-if="editDeviceError" class="text-destructive text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
            {{ editDeviceError }}
          </div>

          <div class="space-y-2">
            <Label for="edit-device-ubicacion">Localización</Label>
            <Input
              id="edit-device-ubicacion"
              v-model="deviceFormData.ubicacion"
              placeholder="Ej: Pastizal 1"
              :disabled="editDeviceLoading"
            />
            <p class="text-xs text-muted-foreground">
              Ubicación física del dispositivo en la zona
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            @click="editDeviceDialogOpen = false"
            :disabled="editDeviceLoading"
          >
            Cancelar
          </Button>
          <Button
            @click="handleEditDevice"
            :disabled="editDeviceLoading || !deviceFormData.ubicacion"
          >
            <span v-if="editDeviceLoading">Guardando...</span>
            <span v-else>Guardar Cambios</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- MAC_ADDRESS: Dialog actualizado para editar ID -->
    <Dialog v-model:open="editDeviceIdDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar ID del Dispositivo</DialogTitle>
          <DialogDescription>Modifica el ID del dispositivo IoT</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div v-if="editDeviceIdError" class="text-destructive text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
            {{ editDeviceIdError }}
          </div>

          <div class="space-y-2">
            <Label for="edit-device-mac">ID del Dispositivo</Label>
            <Input
              id="edit-device-mac"
              v-model="deviceFormData.macAddress"
              placeholder="Ej: AA:BB:CC:DD:EE:FF"
              :disabled="editDeviceIdLoading"
            />
          </div>
          <p class="text-xs text-muted-foreground">
            Identificador único del dispositivo IoT
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            @click="editDeviceIdDialogOpen = false"
            :disabled="editDeviceIdLoading"
          >
            Cancelar
          </Button>
          <Button
            @click="handleEditDeviceId"
            :disabled="editDeviceIdLoading || (!deviceFormData.ubicacion && !deviceFormData.macAddress)"
          >
            <span v-if="editDeviceIdLoading">Guardando...</span>
            <span v-else>Guardar Cambios</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- AlertDialog: Eliminar Zona -->
    <AlertDialog v-model:open="deleteZoneDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente la zona "{{ selectedZone?.name }}" y todos sus dispositivos asociados ({{ selectedZone?.devices.length || 0 }}). Los datos históricos se conservarán pero los dispositivos dejarán de monitorear.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div v-if="deleteZoneError" class="text-destructive text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
          {{ deleteZoneError }}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteZoneLoading">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            @click="handleDeleteZone"
            :disabled="deleteZoneLoading"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <span v-if="deleteZoneLoading">Eliminando...</span>
            <span v-else>Eliminar</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- AlertDialog: Eliminar Dispositivo -->
    <AlertDialog v-model:open="deleteDeviceDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el dispositivo "{{ selectedDevice?.device.location }}". Los datos históricos se conservarán pero el dispositivo dejará de monitorear.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div v-if="deleteDeviceError" class="text-destructive text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
          {{ deleteDeviceError }}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteDeviceLoading">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            @click="handleDeleteDevice"
            :disabled="deleteDeviceLoading"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <span v-if="deleteDeviceLoading">Eliminando...</span>
            <span v-else>Eliminar</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

  </div>
</template>