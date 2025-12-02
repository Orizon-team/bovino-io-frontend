const API_URL = 'https://bovino-io-backend.onrender.com/graphql'
const REST_API_URL = 'https://bovino-io-backend.onrender.com/cows'

export type Cow = {
  id: number
  name: string
  image?: string
  favorite_food?: string
  ear_tag?: string
  tag?: {
    id: number
    id_tag: string
    current_location?: string
  }
  user?: {
    id_user: number
    name: string
    email?: string
  }
}

export type CreateVacaInput = {
  id?: number
  nombre: string
  comida_preferida: string
  id_usuario: number
  tag_id: number
  ear_tag?: number
}

export type UpdateVacaInput = {
  nombre?: string
  comida_preferida?: string
  tag_id?: number
}

// Crear una vaca usando GraphQL
export async function createVaca(input: CreateVacaInput): Promise<Cow> {
  const query = `
    mutation CreateVaca($input: CreateVacaInput!) {
      createVaca(input: $input) {
        id
        name
        image
        favorite_food
        ear_tag
        tag {
          id
          id_tag
          current_location
        }
        user {
          id_user
          name
          email
        }
      }
    }
  `

  const variables = { input }

  console.log('%c📤 CREATEVACA - Enviando al backend:', 'background: #9C27B0; color: white; font-weight: bold; padding: 4px;')
  console.log('Input completo:', JSON.stringify(input, null, 2))
  if (input.id) {
    console.log('🆔 ID PERSONALIZADO incluido:', input.id)
  } else {
    console.log('⚠️ Sin ID personalizado - el backend asignará uno automático')
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Error al crear la vaca')
  }

  console.log('%c📥 CREATEVACA - Respuesta del backend:', 'background: #4CAF50; color: white; font-weight: bold; padding: 4px;')
  console.log('ID asignado por el backend:', result.data.createVaca.id)
  console.log('Vaca creada:', result.data.createVaca)

  return result.data.createVaca
}

// Crear una vaca usando REST con imagen
export async function createCowWithImage(
  tag_id: number,
  name: string,
  id_user: number,
  favorite_food: string,
  imagen: File,
  earTag?: string
): Promise<Cow> {
  const formData = new FormData()
  formData.append('tag_id', tag_id.toString())
  formData.append('name', name)
  formData.append('id_user', id_user.toString())
  formData.append('favorite_food', favorite_food)
  formData.append('imagen', imagen)
  
  console.log('%c📤 CREATECOWWITHIMAGE - Enviando al backend:', 'background: #9C27B0; color: white; font-weight: bold; padding: 4px;')
  console.log('Datos básicos:', { tag_id, name, id_user, favorite_food })
  
  if (earTag !== undefined && earTag !== null && String(earTag).trim() !== '') {
    formData.append('ear_tag', String(earTag))
    console.log('🆔 ear_tag incluido en FormData:', earTag)
  } else {
    console.log('⚠️ Sin ID personalizado - el backend asignará uno automático')
  }

  const response = await fetch(REST_API_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Error al crear la vaca con imagen')
  }

  const createdCow = await response.json()
  
  console.log('%c📥 CREATECOWWITHIMAGE - Respuesta del backend:', 'background: #4CAF50; color: white; font-weight: bold; padding: 4px;')
  console.log('ID asignado por el backend:', createdCow.id)
  console.log('Vaca creada:', createdCow)

  return createdCow
}

// Listar todas las vacas
export async function listVacas(): Promise<Cow[]> {
  const query = `
    query {
      vacas {
        id
        name
        image
        ear_tag
        tag {
          id
          id_tag
          current_location
        }
        user {
          id_user
          name
        }
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
    throw new Error(result.errors[0]?.message || 'Error al obtener las vacas')
  }

  return result.data.vacas
}

// Obtener una vaca por ID
export async function getVacaById(id: number): Promise<Cow> {
  const query = `
    query($id: Int!) {
      vaca(id: $id) {
        id
        name
        image
        favorite_food
        ear_tag
        tag {
          id
          id_tag
          current_location
        }
        user {
          id_user
          name
        }
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
    throw new Error(result.errors[0]?.message || 'Error al obtener la vaca')
  }

  return result.data.vaca
}

// Actualizar una vaca
export async function updateVaca(id: number, input: UpdateVacaInput): Promise<Cow> {
  const query = `
    mutation UpdateVaca($id: Int!, $input: UpdateVacaInput!) {
      updateVaca(id: $id, input: $input) {
        id
        name
        image
        favorite_food
        ear_tag
        tag {
          id
          id_tag
          current_location
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

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Error al actualizar la vaca')
  }

  return result.data.updateVaca
}

// Obtener vacas por ID de usuario
export async function getVacasByUser(userId: number): Promise<Cow[]> {
  const query = `
    query($userId: Int!) {
      vacasByUser(userId: $userId) {
        id
        name
        image
        ear_tag
        tag {
          id
          id_tag
          current_location
        }
        user {
          id_user
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

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Error al obtener las vacas del usuario')
  }

  return result.data.vacasByUser
}

// Eliminar una vaca
export async function deleteVaca(id: number): Promise<boolean> {
  const query = `
    mutation DeleteVaca($id: Int!) {
      deleteVaca(id: $id)
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
    throw new Error(result.errors[0]?.message || 'Error al eliminar la vaca')
  }

  return result.data.deleteVaca
}
