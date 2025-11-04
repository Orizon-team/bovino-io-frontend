<script setup lang="ts">
import { inject, computed } from 'vue'

defineProps<{
  placeholder?: string
  class?: string
}>()

const select = inject<any>('select')

const displayValue = computed(() => {
  return select.selectedValue.value || ''
})
</script>

<template>
  <span data-slot="select-value" :class="class">
    <slot>{{ displayValue || placeholder }}</slot>
  </span>
</template>