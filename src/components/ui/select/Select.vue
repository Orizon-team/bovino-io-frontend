<script setup lang="ts">
import { ref, provide, computed } from 'vue'

interface Props {
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isOpen = ref(false)
const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (value !== undefined) {
      emit('update:modelValue', value)
    }
  }
})

provide('select', {
  isOpen,
  selectedValue,
  placeholder: props.placeholder,
  disabled: props.disabled,
  updateValue: (value: string | number) => {
    selectedValue.value = value
    isOpen.value = false
  }
})
</script>

<template>
  <div data-slot="select" class="relative inline-block">
    <slot />
  </div>
</template>