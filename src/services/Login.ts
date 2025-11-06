const API_URL = 'https://bovino-io-backend.onrender.com/graphql'

export type User = {
  id_usuario: string
  nombre: string
  correo_electronico: string
}

export type LoginResponse = {
  data?: {
    login: User
  }
  errors?: Array<{ message: string }>
}

export async function login(correo_electronico: string, contrasena: string): Promise<User> {
  const query = `
    mutation Login($input: LoginUserInput!) {
      login(input: $input) {
        id_usuario
        nombre
        correo_electronico
      }
    }
  `

  const variables = {
    input: { correo_electronico, contrasena }
  }

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

  const result: LoginResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error en la autenticación')
  }
  
  if (!result.data?.login) {
    throw new Error('No se recibieron datos del usuario')
  }
  
  return result.data.login
}