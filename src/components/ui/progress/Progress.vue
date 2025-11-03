<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: number
  max?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  max: 100
})

const percentage = computed(() => {
  const value = Math.min(Math.max(props.modelValue, 0), props.max)
  return (value / props.max) * 100
})

const progressClass = computed(() => {
  const classes = [
    'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})

const indicatorStyle = computed(() => ({
  transform: `translateX(-${100 - percentage.value}%)`
}))
</script>

<template>
  <div
    data-slot="progress"
    :class="progressClass"
    role="progressbar"
    :aria-valuenow="modelValue"
    :aria-valuemin="0"
    :aria-valuemax="max"
  >
    <div
      data-slot="progress-indicator"
      class="bg-primary h-full w-full flex-1 transition-all"
      :style="indicatorStyle"
    />
  </div>
</template>