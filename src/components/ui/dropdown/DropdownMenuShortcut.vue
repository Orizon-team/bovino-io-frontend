<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const shortcutClass = computed(() => [
  'ml-auto text-xs tracking-widest text-muted-foreground',
  props.class ?? ''
])
</script>

<template>
  <span
    data-slot="dropdown-menu-shortcut"
    :class="shortcutClass"
  >
    <slot />
  </span>
</template>