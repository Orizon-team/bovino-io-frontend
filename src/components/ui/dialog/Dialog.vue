<script setup lang="ts">
import { ref, provide, watch } from 'vue'
import { DialogSymbol, type DialogContext } from './symbols'

interface Props {
  open?: boolean
  defaultOpen?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = ref(props.defaultOpen ?? false)

watch(() => props.open, (newValue) => {
  if (newValue !== undefined) {
    isOpen.value = newValue
  }
})

const setOpen = (value: boolean) => {
  isOpen.value = value
  emit('update:open', value)
}

provide<DialogContext>(DialogSymbol, {
  open: isOpen,
  setOpen
})
</script>

<template>
  <div data-slot="dialog">
    <slot />
  </div>
</template>