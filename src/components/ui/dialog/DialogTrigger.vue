<script setup lang="ts">
import { inject } from 'vue'
import { DialogSymbol, type DialogContext } from './symbols'

interface Props {
  asChild?: boolean
  class?: string
}

defineProps<Props>()

const context = inject<DialogContext>(DialogSymbol)

const handleClick = () => {
  context?.setOpen(true)
}
</script>

<template>
  <div
    v-if="!asChild"
    data-slot="dialog-trigger"
    :class="class"
    @click="handleClick"
  >
    <slot />
  </div>
  <slot v-else @click="handleClick" />
</template>