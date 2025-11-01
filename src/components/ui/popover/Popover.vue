<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { PopoverSymbol, type PopoverContext } from './symbols'

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

provide<PopoverContext>(PopoverSymbol, {
  open: computed(() => isOpen.value),
  setOpen
})
</script>

<template>
  <div data-slot="popover" class="relative inline-block">
    <slot />
  </div>
</template>