<script setup lang="ts">
import { computed } from 'vue';

const descriptionProps = defineProps<{ class?: string }>();

const descriptionClass = computed(() => 
  `text-muted-foreground text-sm ${descriptionProps.class ?? ''}`
);
</script>

<template>
  <div
    data-slot="card-description"
    :class="descriptionClass"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>