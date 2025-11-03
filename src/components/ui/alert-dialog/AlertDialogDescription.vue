<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const descriptionClass = computed(() => {
  const classes = [
    'text-muted-foreground text-sm',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})
</script>

<template>
  <p
    data-slot="alert-dialog-description"
    :class="descriptionClass"
  >
    <slot />
  </p>
</template>