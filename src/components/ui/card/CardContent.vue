<script setup lang="ts">
import { computed } from 'vue';

const contentProps = defineProps<{ class?: string }>();

const contentClass = computed(() => 
  `px-6 ${contentProps.class ?? ''}`
);
</script>

<template>
  <div
    data-slot="card-content"
    :class="contentClass"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>