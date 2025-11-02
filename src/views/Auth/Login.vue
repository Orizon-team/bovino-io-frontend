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

			<!-- Content -->
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

			<Card class="border-border backdrop-blur-sm bg-card/95">
				<CardHeader class="space-y-1">
					<CardTitle class="text-2xl font-bold text-foreground">Iniciar Sesión</CardTitle>
					<CardDescription class="text-muted-foreground">
						Ingresa tus credenciales para acceder a tu cuenta
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form @submit.prevent="handleSubmit" class="space-y-4">
						<div v-if="serverError" class="text-destructive text-sm mb-2">{{ serverError }}</div>
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

								<!-- eye toggle -->
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

							<Button :disabled="loading" :class="(loading ? 'opacity-50 cursor-not-allowed ' : '') + 'w-full'" type="submit" size="lg">
								<span v-if="loading">Iniciando...</span>
								<span v-else>Iniciar Sesión</span>
							</Button>
					</form>
				</CardContent>
				<CardFooter class="flex flex-col gap-4">
					<div class="relative w-full">
						<div class="absolute inset-0 flex items-center">
							<span class="w-full border-t border-border" />
						</div>
						<div class="relative flex justify-center text-xs uppercase">
							<span class="bg-card px-2 text-muted-foreground">O</span>
						</div>
					</div>
							<p class="text-center text-sm text-muted-foreground">
								¿No tienes una cuenta?
								<RouterLink to="/register" class="font-medium text-primary hover:underline"> Regístrate aquí</RouterLink>
							</p>
				</CardFooter>
			</Card>

			<div class="mt-6 text-center">
						<RouterLink to="/" class="text-sm text-white/80 hover:text-white transition-colors">← Volver al inicio</RouterLink>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Beef, Eye, EyeOff } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'

const router = useRouter()

const email = ref('')
const password = ref('')

const touched = ref({ email: false, password: false })

const loading = ref(false)
const serverError = ref<string | null>(null)

const showPassword = ref(false)
function togglePassword() {
	showPassword.value = !showPassword.value
}

const isEmailValid = computed(() => {
	const value = email.value.trim()
	// simple email regex (not exhaustive)
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
})

const isPasswordValid = computed(() => {
	return password.value.length >= 8
})

// Nota: el flujo actual permite iniciar sesión con cualquier credencial (mock)

const handleSubmit = async (e: Event) => {
	e.preventDefault()
	// marcar como touched para mostrar errores si existen
	touched.value.email = true
	touched.value.password = true

	serverError.value = null
	loading.value = true

	try {
		// Simular petición asíncrona (acepta cualquier credencial)
		await new Promise((resolve) => setTimeout(resolve, 700))

		// Guardar token mock y redirigir
		localStorage.setItem('auth_token', 'mock-token')
		router.push('/dashboard')
	} catch (err) {
		serverError.value = 'Error al iniciar sesión. Intenta más tarde.'
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
</style>

