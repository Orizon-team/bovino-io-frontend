<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const titleClass = computed(() => {
  const classes = [
    'text-lg leading-none font-semibold',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})
</script>

<template>
  <h2
    data-slot="dialog-title"
    :class="titleClass"
  >
    <slot />
  </h2>
</template>