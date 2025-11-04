<script setup lang="ts">
import { ref } from 'vue'
import DashboardSidebar from '@/components/ui/dashboard/DashboardSidebar.vue'
import DashboardHeader from '@/components/ui/dashboard/DashboardHeader.vue'

const addCattleOpen = ref(false)
const manageZonesOpen = ref(false)

const handleAddCattle = () => {
  addCattleOpen.value = true
}

const handleManageZones = () => {
  manageZonesOpen.value = true
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <DashboardSidebar 
      @add-cattle="handleAddCattle"
      @manage-zones="handleManageZones"
    />

    <!-- Main Content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader :offlineCattle="2" />
      
      <main class="flex-1 overflow-y-auto">
        <!-- Aquí se renderizan las vistas hijas (Dashboard, Cattle, Zones, etc.) -->
        <router-view />
      </main>
    </div>

    <!-- Global Dialogs (cuando los crees) -->
    <!-- 
    <AddCattleDialog 
      v-model:open="addCattleOpen" 
      @add-cattle="() => {}" 
    />
    <ZoneManagementDialog 
      v-model:open="manageZonesOpen"
      :zones="[]"
      :cattleData="[]"
    />
    -->
  </div>
</template>