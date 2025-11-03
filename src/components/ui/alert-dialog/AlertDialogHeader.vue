<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const headerClass = computed(() => {
  const classes = [
    'flex flex-col gap-2 text-center sm:text-left',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})
</script>

<template>
  <div
    data-slot="alert-dialog-header"
    :class="headerClass"
  >
    <slot />
  </div>
</template>