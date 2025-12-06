<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { login } from '@/services/Login'

const router = useRouter()

const email = ref('')
const password = ref('')

const touched = ref({ email: false, password: false })

const loading = ref(false)
const serverError = ref<string | null>(null)
const hasError = ref(false)
const hasSuccess = ref(false)

const showPassword = ref(false)
function togglePassword() {
    showPassword.value = !showPassword.value
}

const isEmailValid = computed(() => {
    const value = email.value.trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
})

const isPasswordValid = computed(() => {
    return password.value.length >= 8
})

const handleSubmit = async (e: Event) => {
    e.preventDefault()
    touched.value.email = true
    touched.value.password = true

    if (!isEmailValid.value || !isPasswordValid.value) {
        return
    }

    serverError.value = null
    hasError.value = false
	hasSuccess.value = false
    loading.value = true

    try {
        const user = await login(email.value, password.value)
        
        localStorage.setItem('user', JSON.stringify(user))

		hasSuccess.value = true
        
        setTimeout(() => {
            router.push('/dashboard')
        }, 800)
    } catch (err) {
        console.error('Error al iniciar sesión:', err)
        serverError.value = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.'
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
                src="/images/Hacienda.jpeg"
                alt="Grupo de vacas blancas y negras"
                class="h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        </div>

        <div class="relative z-10 w-full max-w-md">
            <div class="mb-8 flex flex-col items-center gap-2">
                <RouterLink to="/" class="flex items-center gap-2">
                    <div class="flex h-12 items-center justify-center">
                    <img
                        src="/images/logo.png"
                        alt="Logo"
                        class="h-full w-auto rounded-lg object-contain"
                    />
                    </div>
                    <span className="text-2xl font-bold text-white">Bovino-io</span>
                </RouterLink>
                <p class="text-sm text-white/80">Monitoreo Inteligente de Animales</p>
            </div>

            <Card class="border-border backdrop-blur-sm">
                <CardHeader class="space-y-1">
                    <CardTitle class="text-2xl font-bold text-foreground">Iniciar Sesión</CardTitle>
                    <CardDescription class="text-muted-foreground">
                        Ingresa tus credenciales para acceder a tu cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form @submit.prevent="handleSubmit" class="space-y-4">
                        <div class="space-y-2">
                            <Label for="email" class="text-foreground">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                v-model="email"
                                @blur="touched.email = true"
                                :disabled="loading"
                                class="bg-background"
                                required
                            />
                            <p v-if="touched.email && !isEmailValid" class="text-destructive text-sm mt-1">Por favor, introduce un correo válido.</p>
                        </div>

                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <Label for="password" class="text-foreground">Contraseña</Label>
                                <RouterLink to="#" class="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</RouterLink>
                            </div>
                            <div class="relative">
                                <Input
                                    id="password"
                                    :type="showPassword ? 'text' : 'password'"
                                    placeholder="••••••••"
                                    v-model="password"
                                    @blur="touched.password = true"
                                    :disabled="loading"
                                    class="bg-background pr-10"
                                    required
                                />

                                <button
                                    type="button"
                                    @click="togglePassword"
                                    :aria-pressed="showPassword"
                                    class="absolute inset-y-0 right-2 flex items-center px-2 text-muted-foreground"
                                >
                                    <Eye v-if="!showPassword" class="h-5 w-5 transform transition-transform duration-200" :class="showPassword ? 'rotate-180 scale-110' : 'rotate-0'" />
                                    <EyeOff v-else class="h-5 w-5 transform transition-transform duration-200" :class="showPassword ? 'rotate-180 scale-110' : 'rotate-0'" />
                                </button>
                            </div>
                            <p v-if="touched.password && !isPasswordValid" class="text-destructive text-sm mt-1">La contraseña debe tener al menos 8 caracteres.</p>
                        </div>

                        <Button 
                            :disabled="loading || hasSuccess" 
                            :variant="hasSuccess ? 'default' : hasError ? 'destructive' : loading ? 'outline' : 'default'"
                            :class="hasSuccess ? 'bg-green-600 hover:bg-green-700' : ''"
                            class="w-full" 
                            type="submit" 
                            size="lg"
                        >
                            <span v-if="hasSuccess">¡Éxito!</span>
                            <span v-else-if="loading">Iniciando...</span>
                            <span v-else-if="hasError">Reintentar</span>
                            <span v-else>Iniciar Sesión</span>
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div class="mt-6 text-center">
                <RouterLink to="/" class="text-sm text-white/80 hover:text-white transition-colors">← Volver al inicio</RouterLink>
            </div>
        </div>
    </div>
</template>