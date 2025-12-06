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

type DeleteEventResponse = {
  data: {
    deleteEvento: boolean
  }
}

type DeleteEventsByTypeResponse = {
  data: {
    deleteEventosByUserAndType: boolean
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


export const deleteEvent = async (eventId: number): Promise<boolean> => {
  const query = `
    mutation DeleteEvento($id: Int!) {
      deleteEvento(id: $id)
    }
  `

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { id: eventId },
    }),
  })

  if (!response.ok) {
    throw new Error('Error al eliminar el evento')
  }

  const result: DeleteEventResponse = await response.json()
  
  if ('errors' in result) {
    throw new Error('Error en la mutación de eliminación')
  }

  return result.data.deleteEvento
}

export const deleteEventsByUserAndType = async (userId: number, eventType: string): Promise<boolean> => {
  const query = `
    mutation ($id_user: Int!, $type: String!) {
      deleteEventosByUserAndType(id_user: $id_user, event_type: $type)
    }
  `

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { 
        id_user: userId, 
        type: eventType 
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Error al eliminar eventos por tipo')
  }

  const result: DeleteEventsByTypeResponse = await response.json()
  
  if ('errors' in result) {
    throw new Error('Error en la mutación de eliminación por tipo')
  }

  return result.data.deleteEventosByUserAndType
}