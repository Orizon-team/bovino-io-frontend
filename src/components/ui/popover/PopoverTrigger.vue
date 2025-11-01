<script setup lang="ts">
import { inject } from 'vue'
import { PopoverSymbol, type PopoverContext } from './symbols'

const context = inject<PopoverContext>(PopoverSymbol)

const handleClick = (e: Event) => {
  e.stopPropagation()
  if (context) {
    context.setOpen(!context.open.value)
  }
}
</script>

<template>
  <div 
    data-slot="popover-trigger"
    @click="handleClick"
    class="inline-block cursor-pointer"
  >
    <slot />
  </div>
</template>