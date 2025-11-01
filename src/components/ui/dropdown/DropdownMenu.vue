<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { DropdownMenuSymbol, type DropdownMenuContext } from './symbols'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = ref(props.open ?? false)

watch(() => props.open, (newValue) => {
  if (newValue !== undefined) {
    isOpen.value = newValue
  }
})

const setOpen = (value: boolean) => {
  isOpen.value = value
  emit('update:open', value)
}

provide<DropdownMenuContext>(DropdownMenuSymbol, {
  open: computed(() => isOpen.value),
  setOpen
})
</script>

<template>
  <div data-slot="dropdown-menu" class="relative">
    <slot />
  </div>
</template>