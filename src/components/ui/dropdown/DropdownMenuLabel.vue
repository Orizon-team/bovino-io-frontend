<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  class?: string
  inset?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  inset: false
})

const labelClass = computed(() => [
  'px-2 py-1.5 text-sm font-medium text-muted-foreground',
  props.inset && 'pl-8',
  props.class ?? ''
])
</script>

<template>
  <div
    data-slot="dropdown-menu-label"
    :data-inset="inset"
    :class="labelClass"
  >
    <slot />
  </div>
</template>