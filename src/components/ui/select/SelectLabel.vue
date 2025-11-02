<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const labelClass = computed(() => {
  const classes = [
    'text-muted-foreground px-2 py-1.5 text-xs font-medium',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})
</script>

<template>
  <div
    data-slot="select-label"
    :class="labelClass"
  >
    <slot />
  </div>
</template>