<script setup lang="ts">
    import { RouterLink } from "vue-router";
    import { Button } from '@/components/ui/button'

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-transparent backdrop-blur">    
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-3 items-center">
        <RouterLink to="/" class="flex items-center gap-2 justify-start">
          <div class="flex h-14 items-center justify-center">
            <img
              src="/public/logo.svg"
              alt="Logotipo de Bovino-io"
              class="h-full w-auto object-contain"
            />
          </div>
        </RouterLink>

        <nav class="hidden md:flex items-center gap-6 justify-center">
          <button @click="scrollToSection('features')" class="text-sm font-medium text-foreground transition-colors hover:text-primary cursor-pointer">
            Características
          </button>
          <button @click="scrollToSection('how-it-works')" class="text-sm font-medium text-foreground transition-colors hover:text-primary cursor-pointer">
            Cómo funciona
          </button>
          <button @click="scrollToSection('footer')" class="text-sm font-medium text-foreground transition-colors hover:text-primary cursor-pointer">
            Contacto
          </button>
        </nav>

        <div class="flex items-center gap-3 justify-end">
          <RouterLink to="/login" custom v-slot="{ navigate }">
            <Button variant="ghost" @click="navigate">Iniciar Sesión</Button>
          </RouterLink>
        </div>
      </div>
  </header>
</template>