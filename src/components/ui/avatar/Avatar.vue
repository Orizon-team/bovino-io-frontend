<script setup lang="ts">
import { computed, provide, ref } from 'vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const imageLoaded = ref(false)
const imageFailed = ref(false)

const setImageLoaded = (loaded: boolean) => {
  imageLoaded.value = loaded
}

const setImageFailed = (failed: boolean) => {
  imageFailed.value = failed
}

provide('avatarContext', {
  imageLoaded,
  imageFailed,
  setImageLoaded,
  setImageFailed
})

const avatarClass = computed(() => [
  'relative flex size-8 shrink-0 overflow-hidden rounded-full',
  props.class ?? ''
])
</script>

<template>
  <div
    data-slot="avatar"
    :class="avatarClass"
  >
    <slot />
  </div>
</template>