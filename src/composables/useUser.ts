import { ref, computed } from 'vue'

const userName = ref('Usuario')
const userEmail = ref('usuario@bovino.io')
const userId = ref(0)

export function useUser() {
  const userInitials = computed(() => {
    if (!userName.value) return 'U'
    
    const nameParts = userName.value.trim().split(' ').filter(part => part.length > 0)
    
    if (nameParts.length === 0) return 'U'
    
    if (nameParts.length === 1) {
      return nameParts[0]?.substring(0, 2).toUpperCase() || 'U'
    }
    
    return nameParts
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase()
  })

  const loadUser = () => {
    const userString = localStorage.getItem('user')
    if (userString) {
      try {
        const user = JSON.parse(userString)
        userId.value = user.id_user || 0
        userName.value = user.name || 'Usuario'
        userEmail.value = user.email || 'usuario@bovino.io'
      } catch (error) {
        console.error('Error al parsear datos del usuario:', error)
      }
    }
  }

  const updateUser = (user: { id_user: number; name: string; email: string }) => {
    userId.value = user.id_user
    userName.value = user.name
    userEmail.value = user.email
  }

  const clearUser = () => {
    userId.value = 0
    userName.value = 'Usuario'
    userEmail.value = 'usuario@bovino.io'
  }

  return {
    userId,
    userName,
    userEmail,
    userInitials,
    loadUser,
    updateUser,
    clearUser,
  }
}