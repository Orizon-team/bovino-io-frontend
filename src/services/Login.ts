const API_URL = 'https://bovino-io-backend.onrender.com/graphql'

export type User = {
  id_user: string
  name: string
  email: string
}

export type LoginResponse = {
  data?: {
    login: User
  }
  errors?: Array<{ message: string }>
}

export async function login(email: string, password: string): Promise<User> {
  const query = `
    mutation Login($input: LoginUserInput!) {
      login(input: $input) {
        id_user
        name
        email
      }
    }
  `

  const variables = {
    input: { email, password }
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