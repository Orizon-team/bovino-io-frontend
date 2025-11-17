const API_URL = 'https://bovino-io-backend.onrender.com/graphql'

export type Tag = {
  id: number
  id_tag: string
  mac_address: string
  battery_level: number
  status: string
  current_location: string
  last_transmission?: string
}

export type CreateTagInput = {
  id_tag: string
  mac_address: string
  battery_level: number
  status: string
  last_transmission: string
  current_location: string
}

export type UpdateTagInput = {
  mac_address?: string
  battery_level?: number
  status?: string
  current_location?: string
  last_transmission?: string
}

// Crear un nuevo tag
export async function createTag(input: CreateTagInput): Promise<Tag> {
  const query = `
    mutation CreateTag($input: CreateTagInput!) {
      createTag(input: $input) {
        id
        id_tag
        mac_address
        battery_level
        status
        current_location
        last_transmission
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

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Error al crear el tag')
  }

  return result.data.createTag
}

// Listar todos los tags
export async function listTags(): Promise<Tag[]> {
  const query = `
    query {
      tags {
        id
        id_tag
        mac_address
        battery_level
        status
        current_location
      }
    }
  `

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Error al obtener los tags')
  }

  return result.data.tags
}

// Obtener un tag por ID
export async function getTagById(id: number): Promise<Tag> {
  const query = `
    query($id: Int!) {
      tag(id: $id) {
        id
        id_tag
        mac_address
        battery_level
        status
        current_location
      }
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

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Error al obtener el tag')
  }

  return result.data.tag
}

// Actualizar un tag
export async function updateTag(id: number, input: UpdateTagInput): Promise<Tag> {
  const query = `
    mutation UpdateTag($id: Int!, $input: UpdateTagInput!) {
      updateTag(id: $id, input: $input) {
        id
        id_tag
        mac_address
        battery_level
        status
        current_location
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

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Error al actualizar el tag')
  }

  return result.data.updateTag
}

// Eliminar un tag
export async function deleteTag(id: number): Promise<boolean> {
  const query = `
    mutation DeleteTag($id: Int!) {
      deleteTag(id: $id)
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

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Error al eliminar el tag')
  }

  return result.data.deleteTag
}
