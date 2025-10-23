<script setup lang="ts">
    import { RouterLink } from "vue-router";
    import { Beef } from "lucide-vue-next";
    import Button from "../ui/Button.vue";
</script>

<template>
    <header class="sticky top-0 z-50 w-full border-b border-gray-300/40 bg-transparent backdrop-blur">    
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B7E47]">
          <Beef class="h-6 w-6 text-white" />
        </div>
        <span class="text-xl font-bold text-foreground">Bovino-io</span>
      </RouterLink>

      <nav class="hidden md:flex items-center gap-6">
        <RouterLink to="#" class="text-sm font-medium text-gray-500 transition-colors hover:text-gray-800">
          Características
        </RouterLink>
        <RouterLink to="#" class="text-sm font-medium text-gray-500 transition-colors hover:text-gray-800">
          Cómo funciona
        </RouterLink>
        <RouterLink to="#" class="text-sm font-medium text-gray-500 transition-colors hover:text-gray-800">
          Contacto
        </RouterLink>
      </nav>

      <div class="flex items-center gap-3">
        <RouterLink to="/login" custom v-slot="{ navigate }">
          <Button variant="ghost" @click="navigate">Iniciar Sesión</Button>
        </RouterLink>
        <RouterLink to="/register" custom v-slot="{ navigate }">
          <Button @click="navigate">Registrarse</Button>
        </RouterLink>
      </div>
    </div>
  </header>
</template>