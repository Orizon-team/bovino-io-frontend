<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail } from 'lucide-vue-next'
import { updateUser as updateUserService } from '@/services/UpdateUser'
import { useUser } from '@/composables/useUser'

const { userName, userEmail, userId, userInitials, loadUser, updateUser } = useUser()

const editName = ref('')
const editEmail = ref('')

const loading = ref(false)
const serverError = ref<string | null>(null)
const hasError = ref(false)
const hasSuccess = ref(false)

const touched = ref({
  name: false,
  email: false
})

const isNameValid = computed(() => {
  return editName.value.trim().length >= 3
})

const isEmailValid = computed(() => {
  const value = editEmail.value.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
})

const isFormValid = computed(() => {
  return isNameValid.value && isEmailValid.value
})

onMounted(() => {
  loadUser()
  editName.value = userName.value
  editEmail.value = userEmail.value
})

const handleSaveChanges = async () => {
  touched.value.name = true
  touched.value.email = true

  if (!isFormValid.value) {
    return
  }

  serverError.value = null
  hasError.value = false
  hasSuccess.value = false
  loading.value = true

  try {
    const updatedUser = await updateUserService(userId.value, {
      name: editName.value,
      email: editEmail.value,
    })
    
    localStorage.removeItem('user')
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    updateUser(updatedUser)
    
    editName.value = updatedUser.name
    editEmail.value = updatedUser.email
    
    hasSuccess.value = true
    
    setTimeout(() => {
      hasSuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('Error al actualizar usuario:', err)
    serverError.value = err instanceof Error ? err.message : 'Error al guardar los cambios'
    hasError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Mi Perfil</h1>
      <p class="text-muted-foreground mt-1">Visualiza y gestiona tu información personal</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 font-semibold">
          <User class="h-5 w-5 text-primary" />
          Información Personal
        </CardTitle>
        <CardDescription>Tu perfil de usuario en Bovino-io</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="flex items-center gap-6">
          <Avatar class="h-20 w-20">
            <AvatarFallback class="bg-primary text-primary-foreground text-xl">
              {{ userInitials }}
            </AvatarFallback>
          </Avatar>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-6">
          <div class="space-y-2">
            <Label for="name">Nombre completo</Label>
            <div class="flex items-center gap-2 p-2 border rounded-md">
              <User class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium">{{ userName }}</span>
            </div>
          </div>
          <div class="space-y-2">
            <Label for="email">Correo electrónico</Label>
            <div class="flex items-center gap-2 p-2 border rounded-md">
              <Mail class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium">{{ userEmail }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="font-semibold">Editar Información</CardTitle>
        <CardDescription>Actualiza tus datos personales</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="serverError" class="text-destructive text-sm mb-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          {{ serverError }}
        </div>

        <div v-if="hasSuccess" class="text-green-700 text-sm mb-2 p-3 rounded-md bg-green-50 border border-green-200">
          ¡Cambios guardados exitosamente!
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="edit-name">Nombre completo</Label>
            <Input 
              id="edit-name" 
              v-model="editName" 
              @blur="touched.name = true"
              :disabled="loading || hasSuccess"
            />
            <p v-if="touched.name && !isNameValid" class="text-destructive text-sm mt-1">
              El nombre debe tener al menos 3 caracteres.
            </p>
          </div>
          <div class="space-y-2">
            <Label for="edit-email">Correo electrónico</Label>
            <Input 
              id="edit-email" 
              type="email" 
              v-model="editEmail"
              @blur="touched.email = true"
              :disabled="loading || hasSuccess"
            />
            <p v-if="touched.email && !isEmailValid" class="text-destructive text-sm mt-1">
              Por favor, introduce un correo válido.
            </p>
          </div>
        </div>

        <Button 
          @click="handleSaveChanges"
          :disabled="loading || hasSuccess || !isFormValid"
          :variant="hasSuccess ? 'default' : hasError ? 'destructive' : loading ? 'outline' : 'default'"
          :class="hasSuccess ? 'bg-green-600 hover:bg-green-700' : ''"
        >
          <span v-if="hasSuccess">¡Guardado!</span>
          <span v-else-if="loading">Guardando...</span>
          <span v-else-if="hasError">Reintentar</span>
          <span v-else>Guardar cambios</span>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>