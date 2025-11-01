<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const separatorClass = computed(() => [
  'bg-border -mx-1 my-1 h-px',
  props.class ?? ''
])
</script>

<template>
  <div
    data-slot="dropdown-menu-separator"
    :class="separatorClass"
  />
</template>