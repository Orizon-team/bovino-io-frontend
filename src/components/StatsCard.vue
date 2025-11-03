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
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium">{{ title }}</CardTitle>
      <div :class="'flex h-8 w-8 items-center justify-center rounded-lg ' + iconClasses">
        <component :is="icon" class="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold">{{ value }}</div>
      <p class="text-xs text-muted-foreground mt-1">{{ description }}</p>
    </CardContent>
  </Card>
</template>
