const API_URL = 'https://bovino-io-backend.onrender.com/graphql'

export type RegisterUser = {
  id_usuario: string
  nombre: string
  correo_electronico: string
}

export type RegisterResponse = {
  data?: {
    createUser: RegisterUser
  }
  errors?: Array<{ message: string }>
}

export type RegisterInput = {
  nombre: string
  correo_electronico: string
  contrasena: string
}

export async function register(input: RegisterInput): Promise<RegisterUser> {
  const query = `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id_usuario
        nombre
        correo_electronico
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

  const result: RegisterResponse = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? 'Error en el registro')
  }
  
  // ✅ EDITADO: Cambiar "register" a "createUser"
  if (!result.data?.createUser) {
    throw new Error('No se recibieron datos del usuario registrado')
  }
  
  return result.data.createUser
}