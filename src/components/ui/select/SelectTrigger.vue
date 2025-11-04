<script setup lang="ts">
import { inject, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
  disabled?: boolean
}>()

const select = inject<any>('select')

const toggleOpen = () => {
  if (!props.disabled && !select.disabled) {
    select.isOpen.value = !select.isOpen.value
  }
}

const triggerClass = computed(() => {
  return cn(
    'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
    'focus:outline-none focus:ring-1 focus:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
    '[&>span]:line-clamp-1',
    props.class
  )
})
</script>

<template>
  <button
    type="button"
    data-slot="select-trigger"
    :class="triggerClass"
    :disabled="disabled || select.disabled"
    @click="toggleOpen"
  >
    <slot />
    <ChevronDown class="h-4 w-4 opacity-50 shrink-0" />
  </button>
</template>