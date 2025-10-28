<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Beef } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'

const router = useRouter()

const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const handleSubmit = (e: Event) => {
  e.preventDefault()
  router.push('/dashboard')
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
          <form @submit="handleSubmit" class="space-y-4">
            <div class="space-y-2">
              <Label for="name" class="text-foreground">
                Nombre Completo
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                v-model="formData.name"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="email" class="text-foreground">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                v-model="formData.email"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="password" class="text-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                v-model="formData.password"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="confirmPassword" class="text-foreground">
                Confirmar Contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                v-model="formData.confirmPassword"
                required
              />
            </div>

            <Button type="submit" class="w-full" size="lg">
              Crear Cuenta
            </Button>
          </form>
        </CardContent>

        <CardFooter class="flex flex-col gap-4">
          <div class="relative w-full">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-border"></span>
            </div>
            <div class="relative  flex justify-center text-xs uppercase">
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