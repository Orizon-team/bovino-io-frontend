<script setup lang="ts">
import { inject, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

interface Props {
  size?: 'sm' | 'default'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default'
})

const select = inject<any>('select')

const triggerClass = computed(() => {
  const classes = [
    'border-input data-[placeholder]:text-muted-foreground',
    'focus-visible:border-ring focus-visible:ring-ring/50',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
    'dark:bg-input/30 dark:hover:bg-input/50',
    'flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2',
    'text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none',
    'focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
    props.size === 'default' ? 'h-9' : 'h-8',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})

const toggleOpen = () => {
  if (!select.disabled) {
    select.isOpen.value = !select.isOpen.value
  }
}
</script>

<template>
  <button
    type="button"
    data-slot="select-trigger"
    :data-size="size"
    :class="triggerClass"
    :disabled="select.disabled"
    @click="toggleOpen"
  >
    <span class="flex-1 text-left">
      <slot>
        <span v-if="!select.selectedValue" class="text-muted-foreground">
          {{ select.placeholder || 'Seleccionar...' }}
        </span>
      </slot>
    </span>
    <ChevronDown class="h-4 w-4 opacity-50 shrink-0" />
  </button>
</template>