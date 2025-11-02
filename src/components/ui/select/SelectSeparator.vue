<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const separatorClass = computed(() => {
  const classes = [
    'bg-border pointer-events-none -mx-1 my-1 h-px',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})
</script>

<template>
  <div
    data-slot="select-separator"
    :class="separatorClass"
  />
</template>