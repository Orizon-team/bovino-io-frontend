<script setup lang="ts">
import { inject, computed, onMounted, onUnmounted } from 'vue'
import { DialogSymbol, type DialogContext } from './symbols'
import { X } from 'lucide-vue-next'

interface Props {
  showCloseButton?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  showCloseButton: true
})

const context = inject<DialogContext>(DialogSymbol)

const contentClass = computed(() => {
  const classes = [
    'bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]',
    'translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg',
    'sm:max-w-lg',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})

const handleClose = () => {
  context?.setOpen(false)
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="context?.open.value"
        data-slot="dialog-overlay"
        class="fixed inset-0 z-50 bg-black/50"
        @click="handleClose"
      />
    </Transition>

    <Transition
      enter-active-class="duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="context?.open.value"
        data-slot="dialog-content"
        :class="contentClass"
        @click.stop
      >
        <slot />
        
        <button
          v-if="showCloseButton"
          data-slot="dialog-close"
          class="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
          @click="handleClose"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Cerrar</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>