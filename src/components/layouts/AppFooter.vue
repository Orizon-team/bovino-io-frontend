<script setup lang="ts">
import { computed } from 'vue';
import { Mail, MapPin, Phone } from 'lucide-vue-next';

/**
 * Propiedad computada para obtener el año actual.
 */
const currentYear = computed<number>(() => {
  return new Date().getFullYear();
});
</script>

<template>
  <footer id="footer" class=" bg-white text-gray-500">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12"> 
      <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
        <div class="space-y-4 ">
          <RouterLink to="/" class="flex items-center gap-2">
            <div class="flex h-14 items-center justify-center">
              <img
                src='/logo.svg?url'
                alt="Logotipo de Bovino-io"
                class="h-full w-auto object-contain"
              />
            </div>
          </RouterLink>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Monitoreo inteligente de ganado mediante tecnología BLE. Mantén tu ganadería segura y controlada.
          </p>
        </div>

        <div class="text-center md:text-left">
          <h3 class="mb-4 text-sm font-semibold text-foreground">Producto</h3>
          <ul class="space-y-3">
            <li>
              <RouterLink to="#features" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Características
              </RouterLink>
            </li>
            <li>
              <RouterLink to="#how-it-works" class="text-sm text-gray-600 hover:text-foreground transition-colors">
                Cómo funciona
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/dashboard" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </RouterLink>
            </li>
          </ul>
        </div>

        <div class="text-center md:text-left">
          <h3 class="mb-4 text-sm font-semibold text-foreground">Empresa</h3>
          <ul class="space-y-3">
            <li>
              <RouterLink to="#about" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sobre Nosotros
              </RouterLink>
            </li>
            <li>
              <RouterLink to="#contact" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contacto
              </RouterLink>
            </li>
            <li>
              <RouterLink to="#support" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Soporte
              </RouterLink>
            </li>
          </ul>
        </div>

        <div class="text-center md:text-left">
          <h3 class="mb-4 text-sm font-semibold text-foreground">Contacto</h3>
          <ul class="space-y-3">
            <li class="flex items-center gap-2 text-sm text-muted-foreground justify-center md:justify-start">
              <Mail class="h-4 w-4 shrink-0" />
              <span> info@bovino-io.com</span>
            </li>
            <li class="flex items-center gap-2 text-sm text-muted-foreground justify-center md:justify-start">
              <Phone class="h-4 w-4 shrink-0" />
              <span> +1 (555) 123-4567</span>
            </li>
            <li class="flex items-center gap-2 text-sm text-muted-foreground justify-center md:justify-start">
              <MapPin class="h-4 w-4 shrink-0" />
              <span>Mérida, Yucatán</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t border-border/40">
        <p class="text-center text-sm text-muted-foreground">
          © {{ currentYear }} Bovino-io. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
</template>