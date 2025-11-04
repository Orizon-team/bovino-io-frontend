<script setup lang="ts">
import { inject, computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  value: string
  disabled?: boolean
  class?: string
}>()

const select = inject<any>('select')

const isSelected = computed(() => select.selectedValue.value === props.value)

const handleClick = () => {
  if (!props.disabled) {
    select.selectValue(props.value)
  }
}

const itemClass = computed(() => {
  return cn(
    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none',
    'hover:bg-accent hover:text-accent-foreground',
    'focus:bg-accent focus:text-accent-foreground',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    isSelected.value && 'bg-accent',
    props.class
  )
})
</script>

<template>
  <div
    :class="itemClass"
    :data-disabled="disabled || undefined"
    @click="handleClick"
  >
    <span class="flex-1">
      <slot />
    </span>
    <span v-if="isSelected" class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <Check class="h-4 w-4" />
    </span>
  </div>
</template>