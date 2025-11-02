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
						<div class="space-y-2">
							<Label for="email" class="text-foreground">Correo Electrónico</Label>
							<Input
								id="email"
								type="email"
								placeholder="tu@email.com"
								v-model="email"
								class="bg-background"
								required
							/>
						</div>

						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Label for="password" class="text-foreground">Contraseña</Label>
												<RouterLink to="#" class="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</RouterLink>
							</div>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								v-model="password"
								class="bg-background"
								required
							/>
						</div>

						<Button type="submit" class="w-full" size="lg">Iniciar Sesión</Button>
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
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Beef } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'

const router = useRouter()

const email = ref('')
const password = ref('')

const handleSubmit = (e: Event) => {
	e.preventDefault()
	// Sin validación por ahora — navegar al dashboard
	router.push('/dashboard')
}
</script>

<style scoped>
/* No custom styles for now; Tailwind classes handle the layout */
</style>

