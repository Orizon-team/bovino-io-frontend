<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import AppHeader from './components/layouts/AppHeader.vue'
import AppFooter from './components/layouts/AppFooter.vue'

const route = useRoute()

const showLayout = computed(() => !route.meta.hideLayout)
</script>

<template>
  <div id="app">
    <AppHeader v-if="showLayout" />
    <router-view />
    <AppFooter v-if="showLayout" />
  </div>
</template>