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
  context?.setOpen(false)
}
</script>

<template>
  <div
    v-if="!asChild"
    data-slot="dialog-close"
    :class="class"
    @click="handleClick"
  >
    <slot />
  </div>
  <slot v-else @click="handleClick" />
</template>