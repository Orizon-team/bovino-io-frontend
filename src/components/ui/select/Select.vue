<script setup lang="ts">
import { provide, ref, watch } from 'vue'

const props = defineProps<{
  modelValue?: string
  defaultValue?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const selectedValue = ref(props.modelValue || props.defaultValue || '')

watch(() => props.modelValue, (newVal) => {
  if (newVal !== undefined) {
    selectedValue.value = newVal
  }
})

const selectValue = (value: string) => {
  selectedValue.value = value
  emit('update:modelValue', value)
  isOpen.value = false
}

provide('select', {
  isOpen,
  selectedValue,
  selectValue,
  disabled: props.disabled
})
</script>

<template>
  <div class="relative">
    <slot />
  </div>
</template>