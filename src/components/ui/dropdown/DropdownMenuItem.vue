<script setup lang="ts">
import { inject, computed } from 'vue'
import { DropdownMenuSymbol, type DropdownMenuContext } from './symbols'

interface Props {
  class?: string
  inset?: boolean
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  inset: false,
  disabled: false
})

const emit = defineEmits<{
  select: []
}>()

const context = inject<DropdownMenuContext>(DropdownMenuSymbol)

const handleClick = () => {
  if (!props.disabled) {
    emit('select')
    context?.setOpen(false)
  }
}

const itemClass = computed(() => [
  'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors',
  'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
  props.variant === 'destructive' && 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10 hover:text-destructive focus:text-destructive',
  props.inset && 'pl-8',
  props.disabled && 'pointer-events-none opacity-50',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4',
  props.class ?? ''
])
</script>

<template>
  <div
    data-slot="dropdown-menu-item"
    :data-variant="variant"
    :data-inset="inset"
    :class="itemClass"
    @click="handleClick"
  >
    <slot />
  </div>
</template>