<template>
  <div class="relative w-full h-full bg-slate-900 overflow-hidden rounded-xl border border-slate-700/50">
    <!-- Map Container -->
    <div ref="mapContainer" class="absolute inset-0 z-0"></div>

    <!-- Threat Feed Overlay -->
    <div class="absolute bottom-4 left-4 z-10 w-64 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
      <h3 class="text-xs font-bold text-slate-400 uppercase mb-2">Live Threat Feed</h3>
      <div class="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
        <div v-for="threat in recentThreats" :key="threat.id" class="flex items-center gap-2 text-xs">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: threat.color }"></span>
          <span class="text-slate-300">{{ threat.type }}</span>
          <span class="text-slate-500 ml-auto">{{ formatTime(threat.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { subscribeToLocationThread, FLOW_TTL } from '../../utils/locationMapData'

const mapContainer = ref(null)
const map = ref(null)
const recentThreats = ref([])
let unsubscribe = null

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const initMap = () => {
  if (!mapContainer.value) return

  map.value = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 5
  })

  // Dark/Cyber themed tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map.value)
}

const handleThreat = (threat) => {
  // Add to feed list
  recentThreats.value.unshift(threat)
  if (recentThreats.value.length > 20) recentThreats.value.pop()

  if (!map.value) return

  // Visualize attack line
  const latlngs = [
    [threat.source.lat, threat.source.lng],
    [threat.destination.lat, threat.destination.lng]
  ]

  const polyline = L.polyline(latlngs, {
    color: threat.color,
    weight: 2,
    opacity: 0.8,
    className: 'threat-line'
  }).addTo(map.value)

  // Markers
  const srcMarker = L.circleMarker([threat.source.lat, threat.source.lng], {
    radius: 4,
    color: threat.color,
    fillColor: threat.color,
    fillOpacity: 0.5
  }).addTo(map.value)

  const dstMarker = L.circleMarker([threat.destination.lat, threat.destination.lng], {
    radius: 4,
    color: threat.color,
    fillColor: threat.color,
    fillOpacity: 1
  }).addTo(map.value)

  // Animate removal
  setTimeout(() => {
    map.value?.removeLayer(polyline)
    map.value?.removeLayer(srcMarker)
    map.value?.removeLayer(dstMarker)
  }, FLOW_TTL)
}

onMounted(() => {
  initMap()
  unsubscribe = subscribeToLocationThread(handleThreat)
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (map.value) map.value.remove()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}
</style>
