<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const footerClass = computed(() => {
  const classes = [
    'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})
</script>

<template>
  <div
    data-slot="dialog-footer"
    :class="footerClass"
  >
    <slot />
  </div>
</template>