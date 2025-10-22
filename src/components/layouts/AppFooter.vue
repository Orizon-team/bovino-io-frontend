<script setup lang="ts">
import { computed } from 'vue';
import { Beef, Mail, MapPin, Phone } from 'lucide-vue-next';

/**
 * Propiedad computada para obtener el año actual.
 */
const currentYear = computed<number>(() => {
  return new Date().getFullYear();
});
</script>

<template>
  <footer class=" bg-white text-gray-500">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 justify-items-center ">
        <!-- Brand -->
        <div class="space-y-4 text-center ">
          <RouterLink to="/" class="flex items-center gap-2 group justify-center ">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 group-hover:bg-primary-dark transition-colors">
              <Beef class="h-6 w-6 text-white" />
            </div>
            <span class="text-xl font-bold text-gray-900">Bovino-io</span>
          </RouterLink>
          <p class="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto md:mx-0">
            Monitoreo inteligente de ganado mediante tecnología BLE. Mantén tu ganadería segura y controlada.
          </p>
        </div>

        <!-- Producto -->
        <div class="text-center md:text-left">
          <h3 class="mb-4 text-sm font-semibold text-gray-900">Producto</h3>
          <ul class="space-y-3">
            <li>
              <RouterLink to="#features" class="text-sm text-gray-600 hover:text-primary transition-colors">
                Características
              </RouterLink>
            </li>
            <li>
              <RouterLink to="#how-it-works" class="text-sm text-gray-600 hover:text-primary transition-colors">
                Cómo Funciona
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/dashboard" class="text-sm text-gray-600 hover:text-primary transition-colors">
                Dashboard
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Empresa -->
        <div class="text-center md:text-left">
          <h3 class="mb-4 text-sm font-semibold text-gray-900">Empresa</h3>
          <ul class="space-y-3">
            <li>
              <RouterLink to="#about" class="text-sm text-gray-600 hover:text-primary transition-colors">
                Sobre Nosotros
              </RouterLink>
            </li>
            <li>
              <RouterLink to="#contact" class="text-sm text-gray-600 hover:text-primary transition-colors">
                Contacto
              </RouterLink>
            </li>
            <li>
              <RouterLink to="#support" class="text-sm text-gray-600 hover:text-primary transition-colors">
                Soporte
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Contacto -->
        <div class="text-center md:text-left">
          <h3 class="mb-4 text-sm font-semibold text-gray-900">Contacto</h3>
          <ul class="space-y-3">
            <li class="flex items-center gap-2 text-sm text-gray-600 justify-center md:justify-start">
              <Mail class="h-4 w-4 flex-shrink-0" />
              <a href="mailto:info@bovino-io.com" class="hover:text-primary transition-colors">
                info@bovino-io.com
              </a>
            </li>
            <li class="flex items-center gap-2 text-sm text-gray-600 justify-center md:justify-start">
              <Phone class="h-4 w-4 flex-shrink-0" />
              <a href="tel:+15551234567" class="hover:text-primary transition-colors">
                +1 (555) 123-4567
              </a>
            </li>
            <li class="flex items-center gap-2 text-sm text-gray-600 justify-center md:justify-start">
              <MapPin class="h-4 w-4 flex-shrink-0" />
              <span>Ciudad, País</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright -->
      <div class="mt-12 pt-8 border-t">
        <p class="text-center text-sm text-gray-600">
          © {{ currentYear }} Bovino-io. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
</template>