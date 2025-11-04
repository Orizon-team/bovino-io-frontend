<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    class?: string
  }>(),
  {}
)

const select = inject<any>('select')
const contentRef = ref<HTMLElement>()
const contentStyle = ref<any>({})

const updatePosition = () => {
  if (!select.isOpen.value) return
  
  const trigger = document.querySelector('[data-slot="select-trigger"]') as HTMLElement
  if (!trigger) return

  const triggerRect = trigger.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - triggerRect.bottom
  const spaceAbove = triggerRect.top

  // Decidir si abrir arriba o abajo
  const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow

  contentStyle.value = {
    position: 'fixed',
    top: openUpward ? 'auto' : `${triggerRect.bottom + 4}px`,
    bottom: openUpward ? `${viewportHeight - triggerRect.top + 4}px` : 'auto',
    left: `${triggerRect.left}px`,
    minWidth: `${triggerRect.width}px`,
    zIndex: 50,
  }
}

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

watch(() => select.isOpen.value, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    updatePosition()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="select.isOpen.value"
      ref="contentRef"
      data-slot="select-content"
      :class="cn(
        'bg-popover text-popover-foreground',
        'max-h-96 overflow-y-auto rounded-md border shadow-md',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        'p-1',
        props.class
      )"
      :style="contentStyle"
    >
      <slot />
    </div>
  </Teleport>
</template>