<script setup lang="ts">
import { inject, computed, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  position?: 'popper' | 'item-aligned'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  position: 'popper'
})

const select = inject<any>('select')
const contentRef = ref<HTMLElement>()

const contentClass = computed(() => {
  const classes = [
    'bg-popover text-popover-foreground',
    'absolute z-50 max-h-96 min-w-[8rem] mt-1',
    'overflow-x-hidden overflow-y-auto rounded-md border shadow-md',
    'animate-in fade-in-0 zoom-in-95',
    props.class
  ]
  return classes.filter(Boolean).join(' ')
})

const handleClickOutside = (event: MouseEvent) => {
  if (!select.isOpen.value) return
  
  const target = event.target as Node
  if (contentRef.value && !contentRef.value.contains(target)) {
    const trigger = document.querySelector('[data-slot="select-trigger"]')
    if (trigger && !trigger.contains(target)) {
      select.isOpen.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="select.isOpen.value"
      ref="contentRef"
      data-slot="select-content"
      :class="contentClass"
      style="position: fixed; top: var(--trigger-top, 0); left: var(--trigger-left, 0); width: var(--trigger-width, auto);"
    >
      <div class="p-1">
        <slot />
      </div>
    </div>
  </Teleport>
</template>