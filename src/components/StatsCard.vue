<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Props {
  title: string
  value: string | number
  description: string
  icon: Component
  variant?: 'default' | 'success' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const emit = defineEmits<{
  click: []
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10'
    case 'danger':
      return 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
    default:
      return 'border-border bg-card hover:bg-accent'
  }
})

const iconClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-green-500/10 text-green-500'
    case 'danger':
      return 'bg-red-500/10 text-red-500'
    default:
      return 'bg-primary/10 text-primary'
  }
})
</script>

<template>
  <Card
    :class="variantClasses + ' cursor-pointer transition-colors duration-200'"
    @click="emit('click')"
  >
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
      <CardTitle class="text-xs sm:text-sm font-medium">{{ title }}</CardTitle>
      <div :class="'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0 ' + iconClasses">
        <component :is="icon" class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div class="text-xl sm:text-2xl font-bold">{{ value }}</div>
      <p class="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{{ description }}</p>
    </CardContent>
  </Card>
</template>
