<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Beef, Eye, EyeOff } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { register } from '@/services/Register'

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const touched = ref({
  name: false,
  email: false,
  password: false, 
  confirmPassword: false
})

const loading = ref(false)
const serverError = ref<string | null>(null)
const hasError = ref(false)
const hasSuccess = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

function togglePassword() {
  showPassword.value = !showPassword.value
}

function toggleConfirmPassword() {
  showConfirmPassword.value = !showConfirmPassword.value
}

const isNameValid = computed(() => {
  return name.value.trim().length >= 3
})

const isEmailValid = computed(() => {
  const value = email.value.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
})

const isPasswordValid = computed(() => {
  return password.value.length >= 8
})

const isConfirmPasswordValid = computed(() => {
  return confirmPassword.value === password.value && confirmPassword.value.length >= 8
})

const isFormValid = computed(() => {
  return isNameValid.value && isEmailValid.value && isPasswordValid.value && isConfirmPasswordValid.value
})

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  
  touched.value.name = true
  touched.value.email = true
  touched.value.password = true
  touched.value.confirmPassword = true

  if (!isFormValid.value) {
    return
  }

  serverError.value = null
  hasError.value = false
  hasSuccess.value = false
  loading.value = true

  try {
    const user = await register({
      name: name.value,
      email: email.value,
      password: password.value,
    })
    
    console.log('Usuario registrado:', user)
    
    hasSuccess.value = true
    
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (err) {
    console.error('Error al registrar:', err)
    serverError.value = err instanceof Error ? err.message : 'Error al crear la cuenta. Intenta nuevamente.'
    hasError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center p-4">
    <div class="absolute inset-0 z-0">
      <img
        src="/images/herdcow.jpg"
        alt="Grupo de vacas blancas y negras"
        class="h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
    </div>

    <div class="relative z-10 w-full max-w-md">
      <div class="mb-8 flex flex-col items-center gap-2">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Beef class="h-7 w-7 text-primary-foreground" />
          </div>
          <span class="text-2xl font-bold text-white">Bovino-io</span>
        </RouterLink>
        <p class="text-sm text-white/80">Monitoreo Inteligente de Ganado</p>
      </div>

      <Card class="border-border backdrop-blur-sm">
        <CardHeader class="space-y-1">
          <CardTitle class="text-2xl font-bold text-foreground">Crear Cuenta</CardTitle>
          <CardDescription>
            Completa el formulario para comenzar a monitorear tu ganado
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="space-y-2">
              <Label for="name" class="text-foreground">
                Nombre Completo
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                v-model="name"
                @blur="touched.name = true"
                :disabled="loading || hasSuccess"
                class="bg-background"
                required
              />
              <p v-if="touched.name && !isNameValid" class="text-destructive text-sm mt-1">
                El nombre debe tener al menos 3 caracteres.
              </p>
            </div>

            <div class="space-y-2">
              <Label for="email" class="text-foreground">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                v-model="email"
                @blur="touched.email = true"
                :disabled="loading || hasSuccess"
                class="bg-background"
                required
              />
              <p v-if="touched.email && !isEmailValid" class="text-destructive text-sm mt-1">
                Por favor, introduce un correo válido.
              </p>
            </div>

            <div class="space-y-2">
              <Label for="password" class="text-foreground">
                Contraseña
              </Label>
              <div class="relative">
                <Input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  v-model="password"
                  @blur="touched.password = true"
                  :disabled="loading || hasSuccess"
                  class="bg-background pr-10"
                  required
                />
                <button
                  type="button"
                  @click="togglePassword"
                  :aria-pressed="showPassword"
                  class="absolute inset-y-0 right-2 flex items-center px-2 text-muted-foreground"
                >
                  <Eye v-if="!showPassword" class="h-5 w-5 transform transition-transform duration-200" />
                  <EyeOff v-else class="h-5 w-5 transform transition-transform duration-200" />
                </button>
              </div>
              <p v-if="touched.password && !isPasswordValid" class="text-destructive text-sm mt-1">
                La contraseña debe tener al menos 8 caracteres.
              </p>
            </div>

            <div class="space-y-2">
              <Label for="confirmPassword" class="text-foreground">
                Confirmar Contraseña
              </Label>
              <div class="relative">
                <Input
                  id="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  v-model="confirmPassword"
                  @blur="touched.confirmPassword = true"
                  :disabled="loading || hasSuccess"
                  class="bg-background pr-10"
                  required
                />
                <button
                  type="button"
                  @click="toggleConfirmPassword"
                  :aria-pressed="showConfirmPassword"
                  class="absolute inset-y-0 right-2 flex items-center px-2 text-muted-foreground"
                >
                  <Eye v-if="!showConfirmPassword" class="h-5 w-5 transform transition-transform duration-200" />
                  <EyeOff v-else class="h-5 w-5 transform transition-transform duration-200" />
                </button>
              </div>
              <p v-if="touched.confirmPassword && !isConfirmPasswordValid" class="text-destructive text-sm mt-1">
                Las contraseñas no coinciden.
              </p>
            </div>

            <Button 
              :disabled="loading || hasSuccess || !isFormValid" 
              :variant="hasSuccess ? 'default' : hasError ? 'destructive' : loading ? 'outline' : 'default'"
              :class="hasSuccess ? 'bg-green-600 hover:bg-green-700' : ''"
              class="w-full" 
              type="submit" 
              size="lg"
            >
              <span v-if="hasSuccess">¡Cuenta Creada!</span>
              <span v-else-if="loading">Creando cuenta...</span>
              <span v-else-if="hasError">Reintentar</span>
              <span v-else>Crear Cuenta</span>
            </Button>
          </form>
        </CardContent>

        <CardFooter class="flex flex-col gap-4">
          <div class="relative w-full">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-border"></span>
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-card px-2 text-muted-foreground">O</span>
            </div>
          </div>

          <p class="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?
            <RouterLink to="/login" class="font-medium text-primary hover:underline">
              Inicia sesión aquí
            </RouterLink>
          </p>
        </CardFooter>
      </Card>

      <div class="mt-6 text-center">
        <RouterLink to="/" class="text-sm text-white/90 hover:text-white transition-colors">
          ← Volver al inicio
        </RouterLink>
      </div>
    </div>
  </div>
</template>