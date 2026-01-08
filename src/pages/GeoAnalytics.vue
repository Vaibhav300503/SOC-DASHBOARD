<template>
  <div class="h-[calc(100vh-theme('spacing.16'))] p-6">
    <div class="h-full flex flex-col space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black title-gradient tracking-tight">Geo Analytics</h1>
          <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Global Threat Intelligence Map</p>
        </div>
      </div>

      <!-- Map Container -->
      <div class="flex-1 rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl relative">
        <GeoMapEnhanced />
      </div>
    </div>
  </div>
</template>

<script setup>
import GeoMapEnhanced from '../components/soc/GeoMapEnhanced.vue'
</script>
