const API_URL = 'https://bovino-io-backend.onrender.com/graphql'

export type Zone = {
  id: number
  name: string
  user: {
    id_user: number
    username: string
    name: string
  }
}

export type ZonesByUserResponse = {
  data?: {
    zonesByUser: Zone[]
  }
  errors?: Array<{ message: string }>
}

export type CreateZoneResponse = {
  data?: {
    createZone: Zone
  }
  errors?: Array<{ message: string }>
}

export type CreateZoneInput = {
  name: string
  id_user: number
}

export type UpdateZoneResponse = {
  data?: {
    updateZone: Zone
  }
  errors?: Array<{ message: string }>
}

export type UpdateZoneInput = {
  name: string
  id_user: number
}

export type DeleteZoneResponse = {
  data?: {
    deleteZone: boolean
  }
  errors?: Array<{ message: string }>
}

export async function getZonesByUser(userId: number): Promise<Zone[]> {
  const query = `
    query ZonesByUser($userId: Int!) {
      zonesByUser(userId: $userId) {
        id
        name
        user {
          id_user
          username
          name
        }
      }
    }
  `

  const variables = { userId }

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

  const result: ZonesByUserResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error al obtener las zonas')
  }
  
  if (!result.data?.zonesByUser) {
    throw new Error('No se recibieron datos de las zonas')
  }
  
  return result.data.zonesByUser
}

export async function createZone(input: CreateZoneInput): Promise<Zone> {
  const query = `
    mutation CreateZone($input: CreateZoneInput!) {
      createZone(input: $input) {
        id
        name
        user {
          id_user
          username
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

  const result: CreateZoneResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error al crear la zona')
  }
  
  if (!result.data?.createZone) {
    throw new Error('No se recibieron datos de la zona creada')
  }
  
  return result.data.createZone
}

export async function updateZone(id: number, input: UpdateZoneInput): Promise<Zone> {
  const query = `
    mutation UpdateZone($id: Int!, $input: UpdateZoneInput!) {
      updateZone(id: $id, input: $input) {
        id
        name
        user {
          id_user
          username
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

  const result: UpdateZoneResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error al actualizar la zona')
  }
  
  if (!result.data?.updateZone) {
    throw new Error('No se recibieron datos de la zona actualizada')
  }
  
  return result.data.updateZone
}

export async function deleteZone(id: number): Promise<boolean> {
  const query = `
    mutation DeleteZone($id: Int!) {
      deleteZone(id: $id)
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

  const result: DeleteZoneResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error al eliminar la zona')
  }
  
  if (result.data?.deleteZone === undefined) {
    throw new Error('No se recibió confirmación de la eliminación')
  }
  
  return result.data.deleteZone
}