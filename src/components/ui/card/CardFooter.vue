<script setup lang="ts">
import { computed } from 'vue';

const footerProps = defineProps<{ class?: string }>();

const footerClass = computed(() => 
  `flex items-center px-6 [.border-t]:pt-6 ${footerProps.class ?? ''}`
);
</script>

<template>
  <div
    data-slot="card-footer"
    :class="footerClass"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>