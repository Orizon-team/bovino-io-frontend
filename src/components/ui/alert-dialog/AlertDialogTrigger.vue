<script setup lang="ts">
import { inject } from 'vue'
import { AlertDialogSymbol, type AlertDialogContext } from './symbols'

interface Props {
  asChild?: boolean
  class?: string
}

defineProps<Props>()

const context = inject<AlertDialogContext>(AlertDialogSymbol)

const handleClick = () => {
  context?.setOpen(true)
}
</script>

<template>
  <div
    v-if="!asChild"
    data-slot="alert-dialog-trigger"
    :class="class"
    @click="handleClick"
  >
    <slot />
  </div>
  <slot v-else @click="handleClick" />
</template>