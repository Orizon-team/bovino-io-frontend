  <script setup lang="ts">
  import AppHeader from '../../components/layouts/AppHeader.vue';
  import AppFooter from '../../components/layouts/AppFooter.vue';
  </script>

<template>
  <div>
    <AppHeader />
    <!-- Create a big card -->
    <Section class="my-8 p-60 bg-primary  rounded-lg">
      <h2 class="text-xl font-bold mb-4">Welcome to Bovino-io</h2>
      <p class="text-gray-600">Monitoreo inteligente de ganado mediante tecnología BLE.</p>
    </Section>

  </div>
  
</template>

<style scoped>
h1 {
  color: #42b883;
}
</style>