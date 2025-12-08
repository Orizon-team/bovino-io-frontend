<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  mensaje?: string
  tagId?: string | number
  nivel?: 'info' | 'success' | 'warning' | 'error'
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mensaje: 'Tag detectada',
  nivel: 'info',
  closable: true,
})

const emit = defineEmits<{ (e: 'close'): void }>()

const colorClasses = computed(() => {
  switch (props.nivel) {
    case 'success':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600',
      }
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-600',
      }
    case 'error':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600',
      }
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600',
      }
  }
})
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-md border p-3 shadow-sm"
    :class="[colorClasses.bg, colorClasses.border]"
    role="status"
    aria-live="polite"
  >
    <!-- Icono -->
    <svg
      class="h-5 w-5 mt-0.5"
      :class="colorClasses.icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 11.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9 7.25a1 1 0 012 0v3a1 1 0 11-2 0v-3z"
      />
    </svg>

    <!-- Contenido -->
    <div class="flex-1">
      <div class="font-medium" :class="colorClasses.text">
        {{ mensaje }}
      </div>
      <div v-if="tagId" class="text-sm opacity-80" :class="colorClasses.text">
        Tag: <span class="font-mono">{{ tagId }}</span>
      </div>
    </div>

    <!-- Cerrar -->
    <button
      v-if="closable"
      type="button"
      class="ms-2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-sm hover:bg-black/5 focus:outline-none"
      :class="colorClasses.icon"
      aria-label="Cerrar"
      @click="emit('close')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Fallback simple styles if Tailwind no está disponible */
:root {
  --blue-50: #eff6ff;
  --blue-200: #bfdbfe;
  --blue-800: #1e40af;
  --green-50: #ecfdf5;
  --green-200: #a7f3d0;
  --green-800: #065f46;
  --yellow-50: #fffbeb;
  --yellow-200: #fde68a;
  --yellow-800: #92400e;
  --red-50: #fef2f2;
  --red-200: #fecaca;
  --red-800: #991b1b;
}

.bg-blue-50 { background-color: var(--blue-50); }
.border-blue-200 { border-color: var(--blue-200); }
.text-blue-800 { color: var(--blue-800); }
.text-blue-600 { color: #2563eb; }

.bg-green-50 { background-color: var(--green-50); }
.border-green-200 { border-color: var(--green-200); }
.text-green-800 { color: var(--green-800); }
.text-green-600 { color: #16a34a; }

.bg-yellow-50 { background-color: var(--yellow-50); }
.border-yellow-200 { border-color: var(--yellow-200); }
.text-yellow-800 { color: var(--yellow-800); }
.text-yellow-600 { color: #ca8a04; }

.bg-red-50 { background-color: var(--red-50); }
.border-red-200 { border-color: var(--red-200); }
.text-red-800 { color: var(--red-800); }
.text-red-600 { color: #dc2626; }

.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.rounded-md { border-radius: 0.375rem; }
.border { border-width: 1px; }
.p-3 { padding: 0.75rem; }
.flex { display: flex; }
.items-start { align-items: flex-start; }
.gap-3 { gap: 0.75rem; }
.font-medium { font-weight: 500; }
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.text-sm { font-size: 0.875rem; }
.opacity-80 { opacity: 0.8; }
.h-5 { height: 1.25rem; }
.w-5 { width: 1.25rem; }
.h-4 { height: 1rem; }
.w-4 { width: 1rem; }
.ms-2 { margin-left: 0.5rem; }
.inline-flex { display: inline-flex; }
.justify-center { justify-content: center; }
.items-center { align-items: center; }
.rounded-md { border-radius: 0.375rem; }
.hover\:bg-black\/5:hover { background-color: rgba(0,0,0,0.05); }
</style>
