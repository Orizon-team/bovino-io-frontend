<script setup lang="ts">
import { inject } from 'vue'
import { DropdownMenuSymbol, type DropdownMenuContext } from './symbols'

const context = inject<DropdownMenuContext>(DropdownMenuSymbol)

const handleClick = (e: Event) => {
  e.stopPropagation()
  if (context) {
    context.setOpen(!context.open.value)
  }
}
</script>

<template>
  <div 
    data-slot="dropdown-menu-trigger"
    @click="handleClick"
    class="cursor-pointer"
  >
    <slot />
  </div>
</template>