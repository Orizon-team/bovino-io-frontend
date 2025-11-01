<script setup lang="ts">
import { computed, inject } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const context = inject<{
  imageLoaded: import('vue').Ref<boolean>
  imageFailed: import('vue').Ref<boolean>
}>('avatarContext')

const shouldShow = computed(() => {
  return !context?.imageLoaded.value || context?.imageFailed.value
})

const fallbackClass = computed(() => [
  'bg-muted flex size-full items-center justify-center rounded-full text-sm font-medium',
  props.class ?? ''
])
</script>

<template>
  <div
    v-if="shouldShow"
    data-slot="avatar-fallback"
    :class="fallbackClass"
  >
    <slot />
  </div>
</template>