  <script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import Button from '@/components/ui/Button.vue';
  </script>

<template>
  <div class="flex flex-col">
    <main class="">
      <section class="relative overflow-hidden bg-linear-to-b from-background to-muted/10">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
          <div class="mx-auto max-w-3xl text-center">
            <h1 class="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Monitoreo Inteligente de Ganado con Tecnología BLE
            </h1>
            <p class="mt-6 text-xl leading-relaxed text-muted-foreground">
              Mantén tu ganadería bajo control con nuestro sistema de monitoreo en tiempo real mediante beacons BLE.
              Localiza tus animales, recibe alertas y optimiza la gestión de tu rancho.
            </p>

            <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <RouterLink to="/register" custom v-slot="{ navigate }">
              <Button size="lg" @click="navigate">Comenzar Ahora</Button>
            </RouterLink>

            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>