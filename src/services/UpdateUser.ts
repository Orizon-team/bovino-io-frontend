const API_URL = 'https://bovino-io-backend.onrender.com/graphql'

export type UpdateUserInput = {
  name?: string
  email?: string
}

export type UpdatedUser = {
  id_user: number
  name: string
  email: string
}

export type UpdateUserResponse = {
  data?: {
    updateUser: UpdatedUser
  }
  errors?: Array<{ message: string }>
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<UpdatedUser> {
  const query = `
    mutation UpdateUser($id: Int!, $input: UpdateUserInput!) {
      updateUser(id: $id, input: $input) {
        id_user
        name
        email
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

  const result: UpdateUserResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error al actualizar usuario')
  }
  
  if (!result.data?.updateUser) {
    throw new Error('No se recibieron datos del usuario actualizado')
  }
  
  return result.data.updateUser
}