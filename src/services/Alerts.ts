const API_URL = 'https://bovino-io-backend.onrender.com/graphql'


export type EventFromAPI = {
  id_event: number
  Event_Type: string
  Event_Code: string
  Event_Description: string
  fecha: string
  hora: string
  vaca: {
    id: number
    nombre: string
  } | null
  dispositivo: {
    id: number
    name: string
  } | null
  usuario: {
    id_user: number
    name: string
  }
}

type EventsResponse = {
  data: {
    eventosByUser: EventFromAPI[]
  }
}

export const getEventsByUser = async (userId: number): Promise<EventFromAPI[]> => {
  const query = `
    query ($id: Int!) {
      eventosByUser(id_user: $id) {
        id_event
        Event_Type
        Event_Code
        Event_Description
        fecha
        hora
        vaca {
          id
          nombre
        }
        dispositivo {
          id
          name
        }
        usuario {
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
    body: JSON.stringify({
      query,
      variables: { id: userId },
    }),
  })

  if (!response.ok) {
    throw new Error('Error al obtener eventos del usuario')
  }

  const result: EventsResponse = await response.json()
  return result.data.eventosByUser
}