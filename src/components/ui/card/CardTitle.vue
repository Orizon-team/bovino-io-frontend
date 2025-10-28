<script setup lang="ts">
import { computed } from 'vue';

const titleProps = defineProps<{ class?: string }>();

const titleClass = computed(() => 
  ` ${titleProps.class ?? ''}`
);
</script>

<template>
  <div
    data-slot="card-title"
    :class="titleClass"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>