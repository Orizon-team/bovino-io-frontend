<script setup lang="ts">
import { inject, computed, onMounted, onUnmounted } from 'vue'
import { AlertDialogSymbol, type AlertDialogContext } from './symbols'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const context = inject<AlertDialogContext>(AlertDialogSymbol)

const contentClass = computed(() => {
  const classes = [
    'bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]',
    'translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg',
    'sm:max-w-lg',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})


onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
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
        data-slot="alert-dialog-overlay"
        class="fixed inset-0 z-50 bg-black/50"
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
        data-slot="alert-dialog-content"
        :class="contentClass"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>