<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { DropdownMenuSymbol, type DropdownMenuContext } from './symbols'

interface Props {
  class?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
}

const props = withDefaults(defineProps<Props>(), {
  align: 'end',
  side: 'bottom',
  sideOffset: 4
})

const context = inject<DropdownMenuContext>(DropdownMenuSymbol)
const contentRef = ref<HTMLElement>()
const triggerRect = ref<DOMRect | null>(null)

watch(() => context?.open.value, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      const trigger = document.querySelector('[data-slot="dropdown-menu-trigger"]')
      if (trigger) {
        triggerRect.value = trigger.getBoundingClientRect()
      }
    }, 10)
  }
})

const handleClickOutside = (event: MouseEvent) => {
  if (!context?.open.value) return
  
  const target = event.target as Node
  const trigger = document.querySelector('[data-slot="dropdown-menu-trigger"]')
  
  if (
    contentRef.value &&
    !contentRef.value.contains(target) &&
    trigger &&
    !trigger.contains(target)
  ) {
    context.setOpen(false)
  }
}

const contentStyle = computed(() => {
  if (!triggerRect.value) return { display: 'none' }
  
  const rect = triggerRect.value
  const offset = props.sideOffset
  
  let top = 0
  let left = 0
  let transform = ''
  
  if (props.side === 'bottom') {
    top = rect.bottom + offset
  } else if (props.side === 'top') {
    top = rect.top - offset
    transform = 'translateY(-100%)'
  } else if (props.side === 'right') {
    top = rect.top
    left = rect.right + offset
  } else if (props.side === 'left') {
    top = rect.top
    left = rect.left - offset
    transform = 'translateX(-100%)'
  }
  
  if (props.side === 'top' || props.side === 'bottom') {
    if (props.align === 'end') {
      left = rect.right
      transform = transform ? `${transform} translateX(-100%)` : 'translateX(-100%)'
    } else if (props.align === 'start') {
      left = rect.left
    } else {
      left = rect.left + (rect.width / 2)
      transform = transform ? `${transform} translateX(-50%)` : 'translateX(-50%)'
    }
  }
  
  return {
    top: `${top}px`,
    left: `${left}px`,
    transform: transform || 'none'
  }
})

const contentClass = computed(() => {
  const classes = [
    'fixed z-50 min-w-[12rem] max-h-96',
    'overflow-y-auto rounded-md border shadow-lg p-1',
    'bg-popover text-popover-foreground',
    props.class ?? ''
  ]
  
  return classes.filter(Boolean).join(' ')
})

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside, true)
  }, 0)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="context?.open.value"
        ref="contentRef"
        data-slot="dropdown-menu-content"
        :class="contentClass"
        :style="contentStyle"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>