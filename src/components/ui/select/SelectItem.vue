<script setup lang="ts">
import { inject, computed } from 'vue'
import { Check } from 'lucide-vue-next'

interface Props {
  value: string | number
  disabled?: boolean
  class?: string
}

const props = defineProps<Props>()

const select = inject<any>('select')

const isSelected = computed(() => select.selectedValue.value === props.value)

const itemClass = computed(() => {
  const classes = [
    'focus:bg-accent focus:text-accent-foreground',
    'relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2',
    'text-sm outline-none select-none transition-colors',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    'hover:bg-accent hover:text-accent-foreground',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})

const handleClick = () => {
  if (!props.disabled) {
    select.updateValue(props.value)
  }
}
</script>

<template>
  <div
    data-slot="select-item"
    :class="itemClass"
    :data-disabled="disabled"
    @click="handleClick"
  >
    <slot />
    <span v-if="isSelected" class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <Check class="h-4 w-4" />
    </span>
  </div>
</template>