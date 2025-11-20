const API_URL = 'https://bovino-io-backend.onrender.com/graphql'

export type Device = {
  id: number
  type: string
  location: string | null
  battery_level: number
  status: string
  mac_address?: string | null
  zone: {
    id: number
    name: string
  }
}

export type DevicesByZoneResponse = {
  data?: {
    dispositivosByZone: Device[]
  }
  errors?: Array<{ message: string }>
}

export type CreateDeviceInput = {
  battery_level: number
  id_zona: number
  status: string
  tipo: string
  mac_address: string
  ubicacion: string
  ultima_actualizacion: string | null
}

export type CreateDeviceResponse = {
  data?: {
    createDispositivo: Device
  }
  errors?: Array<{ message: string }>
}

export type UpdateDeviceInput = {
  ubicacion?: string
}

export type UpdateDeviceResponse = {
  data?: {
    updateDispositivo: Device
  }
  errors?: Array<{ message: string }>
}

export type DeleteDeviceResponse = {
  data?: {
    deleteDispositivo: boolean
  }
  errors?: Array<{ message: string }>
}

export async function getDevicesByZone(id_zone: number): Promise<Device[]> {
  const query = `
    query DevicesByZone($id_zone: Int!) {
      dispositivosByZone(id_zone: $id_zone) {
        id
        type
        location
        battery_level
        status
        mac_address
        zone {
          id
          name
        }
      }
    }
  `

  const variables = { id_zone }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
  }
  

  const result: DevicesByZoneResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error al obtener los dispositivos')
  }
  
  if (!result.data?.dispositivosByZone) {
    throw new Error('No se recibieron datos de los dispositivos')
  }
  
  return result.data.dispositivosByZone
}

export async function createDevice(input: CreateDeviceInput): Promise<Device> {
  const query = `
    mutation CreateDispositivo($input: CreateDispositivoInput!) {
      createDispositivo(input: $input) {
        id
        name
        type
        location
        battery_level
        status
        mac_address
        zone {
          id
          name
        }
      }
    }
  `

  const variables = { input }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
  }

  const result: CreateDeviceResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error al crear el dispositivo')
  }
  
  if (!result.data?.createDispositivo) {
    throw new Error('No se recibieron datos del dispositivo creado')
  }
  
  return result.data.createDispositivo
}

export async function updateDevice(id: number, input: UpdateDeviceInput): Promise<Device> {
  const query = `
    mutation UpdateDispositivo($id: Int!, $input: UpdateDispositivoInput!) {
      updateDispositivo(id: $id, input: $input) {
        id
        name
        battery_level
        status
        mac_address
        type
        location
        last_update
        zone {
          id
          name
        }
      }
    }
  `

  const variables = { id, input }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
  }

  const result: UpdateDeviceResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error al actualizar el dispositivo')
  }
  
  if (!result.data?.updateDispositivo) {
    throw new Error('No se recibieron datos del dispositivo actualizado')
  }
  
  return result.data.updateDispositivo
}

export async function deleteDevice(id: number): Promise<boolean> {
  const query = `
    mutation DeleteDispositivo($id: Int!) {
      deleteDispositivo(id: $id)
    }
  `

  const variables = { id }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
  }

  const result: DeleteDeviceResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error al eliminar el dispositivo')
  }
  
  if (result.data?.deleteDispositivo === undefined) {
    throw new Error('No se recibió confirmación de la eliminación')
  }
  
  return result.data.deleteDispositivo
}