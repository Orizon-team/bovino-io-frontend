<script setup lang="ts">
import { ref, computed } from 'vue'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  MapPin,
  Radio,
  Plus,
  WifiOff,
  Zap,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-vue-next'

type Beacon = {
  id: string
  deviceId: string
  name: string
  status: 'active' | 'inactive' | 'warning'
  battery: number
  lastSeen: string
}

type Zone = {
  id: string
  name: string
  type: 'pasture' | 'stable' | 'feeding' | 'water'
  beacons: Beacon[]
}

const mockZones: Zone[] = [
  {
    id: '1',
    name: 'Pastizal Norte',
    type: 'pasture',
    beacons: [
      {
        id: 'b1',
        deviceId: 'BLE-23323',
        name: 'Sondeador Norte 1',
        status: 'active',
        battery: 87,
        lastSeen: 'Hace 1 min',
      },
      {
        id: 'b2',
        deviceId: 'BLE-23329',
        name: 'Sondeador Norte 2',
        status: 'active',
        battery: 92,
        lastSeen: 'Hace 2 min',
      },
    ],
  },
  {
    id: '2',
    name: 'Establo A',
    type: 'stable',
    beacons: [
      {
        id: 'b3',
        deviceId: 'BLE-23324',
        name: 'Sondeador Establo',
        status: 'active',
        battery: 95,
        lastSeen: 'Hace 30 seg',
      },
    ],
  },
  {
    id: '3',
    name: 'Área de Alimentación',
    type: 'feeding',
    beacons: [
      {
        id: 'b4',
        deviceId: 'BLE-23325',
        name: 'Sondeador Comedor 1',
        status: 'warning',
        battery: 45,
        lastSeen: 'Hace 5 min',
      },
      {
        id: 'b5',
        deviceId: 'BLE-23330',
        name: 'Sondeador Comedor 2',
        status: 'inactive',
        battery: 12,
        lastSeen: 'Hace 1 hora',
      },
    ],
  },
  {
    id: '4',
    name: 'Pastizal Sur',
    type: 'pasture',
    beacons: [
      {
        id: 'b6',
        deviceId: 'BLE-23326',
        name: 'Sondeador Sur',
        status: 'active',
        battery: 91,
        lastSeen: 'Hace 2 min',
      },
    ],
  },
]

const zoneTypeConfig = {
  pasture: { color: 'text-primary', bgColor: 'bg-primary/10', label: 'Pastizal' },
  stable: { color: 'text-primary', bgColor: 'bg-primary/10', label: 'Establo' },
  feeding: { color: 'text-primary', bgColor: 'bg-primary/10', label: 'Alimentación' },
  water: { color: 'text-primary', bgColor: 'bg-primary/10', label: 'Agua' },
}

const zones = ref<Zone[]>(mockZones)
const expandedZones = ref<Set<string>>(new Set())
const addZoneDialogOpen = ref(false)
const addBeaconDialogOpen = ref(false)
const editZoneDialogOpen = ref(false)
const editBeaconDialogOpen = ref(false)
const deleteZoneDialogOpen = ref(false)
const deleteBeaconDialogOpen = ref(false)
const selectedZone = ref<Zone | null>(null)
const selectedBeacon = ref<{ zoneId: string; beacon: Beacon } | null>(null)

const zoneFormData = ref<{ name: string; type: Zone['type'] }>({ name: '', type: 'pasture' })
const beaconFormData = ref<{ deviceId: string; name: string; zoneId: string }>({ deviceId: '', name:'', zoneId: '' })

const totalZones = computed(() => zones.value.length)
const totalBeacons = computed(() => zones.value.reduce((acc, z) => acc + z.beacons.length, 0))
const activeBeacons = computed(() => zones.value.reduce((acc, z) => acc + z.beacons.filter((b) => b.status === 'active').length, 0))
const warningBeacons = computed(() => zones.value.reduce((acc, z) => acc + z.beacons.filter((b) => b.status === 'warning').length, 0))
const inactiveBeacons = computed(() => zones.value.reduce((acc, z) => acc + z.beacons.filter((b) => b.status === 'inactive').length, 0))

const toggleZone = (zoneId: string) => {
  const newSet = new Set(expandedZones.value)
  if (newSet.has(zoneId)) newSet.delete(zoneId)
  else newSet.add(zoneId)
  expandedZones.value = newSet
}

const handleAddZone = () => {
  const newZone: Zone = {
    id: String(zones.value.length + 1),
    name: zoneFormData.value.name,
    type: zoneFormData.value.type,
    beacons: [],
  }
  zones.value = [...zones.value, newZone]
  addZoneDialogOpen.value = false
  zoneFormData.value = { name: '', type: 'pasture' }
}

const handleAddBeacon = () => {
  const newBeacon: Beacon = {
    id: `b${Date.now()}`,
    deviceId: beaconFormData.value.deviceId,
    name: beaconFormData.value.name,
    status: 'active',
    battery: 100,
    lastSeen: 'Ahora',
  }
  zones.value = zones.value.map((z) =>
    z.id === beaconFormData.value.zoneId ? { ...z, beacons: [...z.beacons, newBeacon] } : z,
  )
  addBeaconDialogOpen.value = false
  beaconFormData.value = { deviceId: '', name: '', zoneId: '' }
}

const handleEditZone = () => {
  if (!selectedZone.value) return
  zones.value = zones.value.map((z) =>
    z.id === selectedZone.value?.id ? { ...z, name: zoneFormData.value.name, type: zoneFormData.value.type } : z,
  )
  editZoneDialogOpen.value = false
  selectedZone.value = null
  zoneFormData.value = { name: '', type: 'pasture' }
}

const handleEditBeacon = () => {
  if (!selectedBeacon.value) return
  zones.value = zones.value.map((z) =>
    z.id === selectedBeacon.value!.zoneId
      ? {
          ...z,
          beacons: z.beacons.map((b) =>
            b.id === selectedBeacon.value!.beacon.id ? { ...b, deviceId: beaconFormData.value.deviceId, name: beaconFormData.value.name } : b,
          ),
        }
      : z,
  )
  editBeaconDialogOpen.value = false
  selectedBeacon.value = null
  beaconFormData.value = { deviceId: '', name: '', zoneId: '' }
}

const handleDeleteZone = () => {
  if (!selectedZone.value) return
  zones.value = zones.value.filter((z) => z.id !== selectedZone.value!.id)
  deleteZoneDialogOpen.value = false
  selectedZone.value = null
}

const handleDeleteBeacon = () => {
  if (!selectedBeacon.value) return
  zones.value = zones.value.map((z) =>
    z.id === selectedBeacon.value!.zoneId
      ? { ...z, beacons: z.beacons.filter((b) => b.id !== selectedBeacon.value!.beacon.id) }
      : z,
  )
  deleteBeaconDialogOpen.value = false
  selectedBeacon.value = null
}

const openEditZoneDialog = (zone: Zone) => {
  selectedZone.value = zone
  zoneFormData.value = { name: zone.name, type: zone.type }
  editZoneDialogOpen.value = true
}

const openDeleteZoneDialog = (zone: Zone) => {
  selectedZone.value = zone
  deleteZoneDialogOpen.value = true
}

const openAddBeaconDialog = (zoneId: string) => {
  beaconFormData.value = { ...beaconFormData.value, zoneId }
  addBeaconDialogOpen.value = true
}

const openEditBeaconDialog = (zoneId: string, beacon: Beacon) => {
  selectedBeacon.value = { zoneId, beacon }
  beaconFormData.value = { deviceId: beacon.deviceId, name: beacon.name, zoneId }
  editBeaconDialogOpen.value = true
}

const openDeleteBeaconDialog = (zoneId: string, beacon: Beacon) => {
  selectedBeacon.value = { zoneId, beacon }
  deleteBeaconDialogOpen.value = true
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Zonas y Sondeadores</h1>
        <p class="text-muted-foreground mt-1">Gestiona las zonas y sus sondeadores BLE asociados</p>
      </div>
      <Button @click="addZoneDialogOpen = true" size="lg" class="gap-2">
        <Plus class="h-5 w-5" />
        Agregar Zona
      </Button>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <p class="text-xs font-medium text-muted-foreground">Sondeadores</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ totalBeacons }}</p>
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
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{{ activeBeacons }}</p>
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
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{{ warningBeacons }}</p>
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
              <p class="text-2xl font-bold text-destructive mt-1">{{ inactiveBeacons }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <WifiOff class="h-5 w-5 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Zones List -->
    <div class="space-y-4">
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
                  <div :class="cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', zoneTypeConfig[zone.type].bgColor)">
                    <MapPin :class="cn('h-5 w-5', zoneTypeConfig[zone.type].color)" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <CardTitle class="text-lg font-semibold truncate">{{ zone.name }}</CardTitle>
                    <CardDescription class="text-xs">
                      {{ zone.beacons.length }} sondeador{{ zone.beacons.length !== 1 ? 'es' : '' }}
                    </CardDescription>
                  </div>
                </button>
              </div>

              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 mr-2">
                  <Badge
                    v-if="zone.beacons.filter(b => b.status === 'active').length > 0"
                    variant="outline"
                    class="bg-green-500/10 text-green-700 border-green-500/20"
                  >
                    {{ zone.beacons.filter(b => b.status === 'active').length }} activo{{ zone.beacons.filter(b => b.status === 'active').length !== 1 ? 's' : '' }}
                  </Badge>

                  <Badge
                    v-if="zone.beacons.filter(b => b.status === 'warning').length > 0"
                    variant="outline"
                    class="bg-amber-500/10 text-amber-700 border-amber-500/20"
                  >
                    {{ zone.beacons.filter(b => b.status === 'warning').length }}
                  </Badge>

                  <Badge
                    v-if="zone.beacons.filter(b => b.status === 'inactive').length > 0"
                    variant="outline"
                    class="bg-destructive/10 text-destructive border-destructive/20"
                  >
                    {{ zone.beacons.filter(b => b.status === 'inactive').length }}
                  </Badge>
                </div>

                <Button variant="outline" size="sm" class="gap-2 bg-transparent" @click="openAddBeaconDialog(zone.id)">
                  <Plus class="h-4 w-4" />
                  Sondeador
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
              <div v-if="zone.beacons.length === 0" class="text-center py-8 text-muted-foreground text-sm">
                No hay sondeadores en esta zona. Agrega uno para comenzar el monitoreo.
              </div>

              <template v-else v-for="beacon in zone.beacons" :key="beacon.id">
                <Card class="bg-muted/30">
                  <CardContent class="p-4">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Radio class="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p class="font-semibold text-sm">{{ beacon.name }}</p>
                          <p class="text-xs text-muted-foreground">{{ beacon.lastSeen }}</p>
                        </div>
                      </div>

                      <div class="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          :class="cn(
                            'text-xs',
                            beacon.status === 'active' && 'bg-green-500/10 text-green-700 border-green-500/20',
                            beacon.status === 'warning' && 'bg-amber-500/10 text-amber-700 border-amber-500/20',
                            beacon.status === 'inactive' && 'bg-destructive/10 text-destructive border-destructive/20'
                          )"
                        >
                          {{ beacon.status === 'active' ? 'Activo' : beacon.status === 'warning' ? 'Advertencia' : 'Inactivo' }}
                        </Badge>
                        
                        <Button variant="ghost" size="icon" class="h-7 w-7" @click="openEditBeaconDialog(zone.id, beacon)">
                          <Pencil class="h-3 w-3" />
                        </Button>

                        <Button variant="ghost" size="icon" class="h-7 w-7 text-destructive hover:text-destructive" @click="openDeleteBeaconDialog(zone.id, beacon)">
                          <Trash2 class="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <!-- Battery -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center gap-1">
                          <Zap class="h-3 w-3 text-muted-foreground" />
                          <span class="text-muted-foreground">Batería</span>
                        </div>
                        <span :class="cn('font-semibold', beacon.battery > 50 ? 'text-green-600' : beacon.battery > 20 ? 'text-amber-600' : 'text-destructive')">
                          {{ beacon.battery }}%
                        </span>
                      </div>
                      <Progress
                        :modelValue="beacon.battery"
                        :class="cn('h-1.5', beacon.battery > 50 ? '[&>div]:bg-green-600' : beacon.battery > 20 ? '[&>div]:bg-amber-600' : '[&>div]:bg-destructive')"
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

    <!-- Add Zone Dialog -->
    <Dialog v-model:open="addZoneDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Zona</DialogTitle>
          <DialogDescription>Crea una nueva zona para agrupar sondeadores BLE</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="zone-name">Nombre de la Zona</Label>
            <Input 
              id="zone-name" 
              placeholder="Ej: Pastizal Norte" 
              v-model="zoneFormData.name"
            />
          </div>

          <div class="space-y-2">
            <Label for="zone-type">Tipo de Zona</Label>
            <Select v-model="zoneFormData.type">
              <SelectTrigger>
                <SelectValue>{{ zoneTypeConfig[zoneFormData.type].label }}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pasture">Pastizal</SelectItem>
                <SelectItem value="stable">Establo</SelectItem>
                <SelectItem value="feeding">Alimentación</SelectItem>
                <SelectItem value="water">Agua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="addZoneDialogOpen = false">Cancelar</Button>
          <Button 
            :disabled="!zoneFormData.name"
            @click="handleAddZone"
          >
            Agregar Zona
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Add Beacon Dialog -->
    <Dialog v-model:open="addBeaconDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Sondeador</DialogTitle>
          <DialogDescription>Registra un nuevo sondeador BLE en esta zona</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="beacon-name">Nombre del Dispositivo</Label>
            <Input id="beacon-name" placeholder="Ej: Sondeador Norte" v-model="beaconFormData.name" />
          </div>
          <div class="space-y-2">
            <Label for="beacon-deviceId">ID del Dispositivo</Label>
            <Input id="beacon-deviceId" placeholder="Ej: BLE-23323" v-model="beaconFormData.deviceId" />
            <p class="text-xs text-muted-foreground">Identificador único del sondeador para vincular a tu cuenta</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="addBeaconDialogOpen = false">Cancelar</Button>
          <Button :disabled="!beaconFormData.deviceId" @click="handleAddBeacon">Agregar Sondeador</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Zone Dialog -->
    <Dialog v-model:open="editZoneDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Zona</DialogTitle>
          <DialogDescription>Modifica la información de la zona</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="edit-zone-name">Nombre de la Zona</Label>
            <Input id="edit-zone-name" v-model="zoneFormData.name" />
          </div>

          <div class="space-y-2">
            <Label for="edit-zone-type">Tipo de Zona</Label>
            <Select v-model="zoneFormData.type">
              <SelectTrigger>
                <SelectValue>{{ zoneTypeConfig[zoneFormData.type].label }}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pasture">Pastizal</SelectItem>
                <SelectItem value="stable">Establo</SelectItem>
                <SelectItem value="feeding">Alimentación</SelectItem>
                <SelectItem value="water">Agua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="editZoneDialogOpen = false">Cancelar</Button>
          <Button @click="handleEditZone">Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Beacon Dialog -->
    <Dialog v-model:open="editBeaconDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Sondeador</DialogTitle>
          <DialogDescription>Modifica el Nombre del dispositivo</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="edit-beacon-name">Nombre del Dispositivo</Label>
            <Input id="edit-beacon-name" v-model="beaconFormData.name" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="editBeaconDialogOpen = false">Cancelar</Button>
          <Button @click="handleEditBeacon">Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Zone Alert -->
    <AlertDialog v-model:open="deleteZoneDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente la zona "{{ selectedZone?.name }}" y todos sus sondeadores asociados ({{ selectedZone?.beacons.length || 0 }}). Los datos históricos se conservarán pero los dispositivos dejarán de monitorear.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" @click="handleDeleteZone">Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Delete Beacon Alert -->
    <AlertDialog v-model:open="deleteBeaconDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el sondeador "{{ selectedBeacon?.beacon.name }}". Los datos históricos se conservarán pero el dispositivo dejará de monitorear.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" @click="handleDeleteBeacon">Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>