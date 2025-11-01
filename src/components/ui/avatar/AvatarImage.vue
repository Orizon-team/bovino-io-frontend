<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'

interface Props {
  src: string
  alt?: string
  class?: string
}

const props = defineProps<Props>()

const context = inject<{
  setImageLoaded: (loaded: boolean) => void
  setImageFailed: (failed: boolean) => void
}>('avatarContext')

const imgRef = ref<HTMLImageElement>()
const isLoaded = ref(false)
const hasFailed = ref(false)

const handleLoad = () => {
  isLoaded.value = true
  context?.setImageLoaded(true)
  context?.setImageFailed(false)
}

const handleError = () => {
  hasFailed.value = true
  context?.setImageLoaded(false)
  context?.setImageFailed(true)
}

const imageClass = computed(() => [
  'aspect-square size-full object-cover',
  props.class ?? ''
])

watch(() => props.src, () => {
  isLoaded.value = false
  hasFailed.value = false
})
</script>

<template>
  <img
    v-if="!hasFailed"
    ref="imgRef"
    data-slot="avatar-image"
    :src="src"
    :alt="alt"
    :class="imageClass"
    @load="handleLoad"
    @error="handleError"
  />
</template>