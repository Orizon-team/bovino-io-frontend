<script setup lang="ts">
import { computed } from 'vue';

const cardProps = defineProps<{ class?: string }>();

const cardClass = computed(() => 
  `bg-card text-card-foreground flex flex-col gap-4 rounded-lg border py-4 shadow ${cardProps.class ?? ''}`
);
</script>

<template>
  <div
    data-slot="card"
    :class="cardClass"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>