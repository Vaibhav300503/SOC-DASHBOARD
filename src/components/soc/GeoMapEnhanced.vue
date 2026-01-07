<template>
  <div class="space-y-4">
    <!-- Map Container -->
    <DashboardCard title="Geographic Threat Map - Location-based Analysis" subtitle="Real-time threat visualization by location with live updates" size="full">
      <template #header-action>
        <div class="flex gap-2">
          <button
            @click="resetMap"
            class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
            title="Reset map view"
          >
            <i class="fas fa-redo mr-1"></i>Reset
          </button>
          <button
            @click="toggleHeatmap"
            class="px-3 py-1 text-xs rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
            :title="showHeatmap ? 'Show markers' : 'Show heatmap'"
          >
            <i :class="showHeatmap ? 'fas fa-map-marker-alt' : 'fas fa-fire'" class="mr-1"></i>
            {{ showHeatmap ? 'Markers' : 'Heatmap' }}
          </button>
          <button
            @click="toggleFullscreen"
            class="px-3 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            :title="isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'"
          >
            <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'" class="mr-1"></i>
            {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
          </button>
        </div>
      </template>

      <!-- Map -->
      <div class="relative">
        <button
          v-if="isFullscreen"
          @click="exitFullscreen"
          class="fixed top-6 right-6 z-[75] px-4 py-2 text-xs font-semibold rounded-md bg-slate-900/90 text-slate-200 border border-emerald-400/40 hover:bg-slate-800 transition-colors shadow-lg"
        >
          <i class="fas fa-compress mr-2"></i>
          Exit Fullscreen
        </button>
        <div
          ref="mapContainer"
          :class="[
            'w-full h-96 rounded-lg border border-slate-700/30 overflow-hidden transition-all duration-500 ease-out',
            { 'fullscreen-map': isFullscreen }
          ]"
        ></div>
      </div>

      <!-- Map Stats -->
      <template #footer>
        <div class="grid grid-cols-4 gap-3">
          <div class="text-center">
            <div class="text-lg font-bold text-cyan-400">{{ totalMarkers }}</div>
            <div class="text-xs text-slate-500">Total Markers</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-purple-400">{{ uniqueCountries }}</div>
            <div class="text-xs text-slate-500">Countries</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-red-400">{{ criticalCount }}</div>
            <div class="text-xs text-slate-500">Critical Events</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-orange-400">{{ highCount }}</div>
            <div class="text-xs text-slate-500">High Events</div>
          </div>
        </div>
      </template>
    </DashboardCard>

    <!-- Geolocation Data Table -->
    <DashboardCard title="Geolocation Data" subtitle="Detailed threat information by location" size="full">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-700/30 bg-slate-800/30">
              <th class="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">IP Address</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Country</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">City</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Severity</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Log Type</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Timestamp</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">ISP</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(feature, idx) in displayedFeatures"
              :key="idx"
              class="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors"
            >
              <td class="px-4 py-3">
                <code class="text-cyan-400 font-mono text-xs">{{ feature.properties.ip }}</code>
              </td>
              <td class="px-4 py-3 text-slate-300">{{ feature.properties.country }}</td>
              <td class="px-4 py-3 text-slate-300">{{ feature.properties.city }}</td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-1 rounded text-xs font-semibold', getSeverityBadgeClass(feature.properties.severity)]">
                  {{ feature.properties.severity }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-400 text-xs">{{ feature.properties.logType }}</td>
              <td class="px-4 py-3 text-slate-400 text-xs">{{ formatTime(feature.properties.timestamp) }}</td>
              <td class="px-4 py-3 text-slate-400 text-xs">{{ feature.properties.isp }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="displayedFeatures.length === 0" class="text-center py-8 text-slate-400">
          <i class="fas fa-map-marker-alt text-3xl mb-2 block opacity-50"></i>
          <p>No geolocation data available</p>
        </div>
      </div>
    </DashboardCard>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import DashboardCard from '../common/DashboardCard.vue'
import { useAPIStore } from '../../stores/apiStore'
import {
  getLocationFeatureCollection,
  getAttackFlowCollection,
  subscribeToLocationThread,
  FLOW_TTL
} from '../../utils/locationMapData'

const apiStore = useAPIStore()
const mapContainer = ref(null)
let map = null
let markerClusterGroup = null
let flowsLayer = null
let unsubscribeLocationThread = null
let flowFadeInterval = null

const features = ref([])
const flows = ref([])
const showHeatmap = ref(false)
const timeRange = ref('24h')
const isFullscreen = ref(false)

const flowGraphics = new Map()

const totalMarkers = computed(() => features.value.length)

const uniqueCountries = computed(() => {
  const countries = new Set(features.value.map(f => f.properties.country))
  return countries.size
})

const criticalCount = computed(() => {
  return features.value.filter(f => f.properties.severity === 'Critical').length
})

const highCount = computed(() => {
  return features.value.filter(f => f.properties.severity === 'High').length
})

const displayedFeatures = computed(() => {
  return features.value.slice(0, 20)
})

function initMap() {
  if (map) return

  map = L.map(mapContainer.value).setView([20.5937, 78.9629], 4)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: ' OpenStreetMap contributors, CartoDB',
    maxZoom: 19,
    className: 'map-tiles'
  }).addTo(map)

  markerClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 80,
    disableClusteringAtZoom: 15
  })

  map.addLayer(markerClusterGroup)

  if (!map.getPane('flows')) {
    map.createPane('flows')
    const pane = map.getPane('flows')
    if (pane) {
      pane.style.zIndex = '650'
      pane.style.pointerEvents = 'none'
    }
  }
  flowsLayer = L.layerGroup([], { pane: 'flows' }).addTo(map)
}

async function fetchAndDisplayGeoData() {
  try {
    const data = getLocationFeatureCollection()

    if (data.success && Array.isArray(data.features)) {
      features.value = data.features
      updateMapMarkers()
    }
  } catch (error) {
    console.error('Error fetching geo data:', error)
  }
}

function updateMapMarkers() {
  if (!map) return

  markerClusterGroup.clearLayers()

  features.value.forEach(feature => {
    const { coordinates } = feature.geometry
    const { severity, ip, country, city, logType } = feature.properties

    const color = getSeverityColor(severity)

    const marker = L.circleMarker([coordinates[1], coordinates[0]], {
      radius: 6,
      fillColor: color,
      color: color,
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.7
    })

    const popupContent = `
      <div class="text-sm">
        <div class="font-semibold text-slate-50">${ip}</div>
        <div class="text-slate-400">${city}, ${country}</div>
        <div class="text-xs text-slate-500 mt-1">
          <div>Type: ${logType}</div>
          <div>Severity: <span class="font-semibold">${severity}</span></div>
          <div>Time: ${formatTime(feature.properties.timestamp)}</div>
        </div>
      </div>
    `

    marker.bindPopup(popupContent)
    markerClusterGroup.addLayer(marker)
  })
}

function getSeverityColor(severity) {
  const colors = {
    'Critical': '#FF2D78',
    'High': '#FF8B5E',
    'Medium': '#FFD700',
    'Low': '#05FFA1'
  }
  return colors[severity] || '#5b6dff'
}

function getSeverityBadgeClass(severity) {
  const classes = {
    'Critical': 'bg-red-500/20 text-red-400 border border-red-500/30',
    'High': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'Medium': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Low': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  }
  return classes[severity] || 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
}

function formatTime(timestamp) {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  })
}

function resetMap() {
  if (map) {
    map.setView([20.5937, 78.9629], 4)
  }
}

function toggleHeatmap() {
  showHeatmap.value = !showHeatmap.value
}

async function fetchAttackFlows() {
  try {
    const list = getAttackFlowCollection()
    flows.value = Array.isArray(list) ? list : []
    renderAttackFlows()
  } catch (error) {
    console.error('Error building attack flows:', error)
  }
}

function ensureFlowsLayer() {
  if (!map) return
  if (!flowsLayer) {
    flowsLayer = L.layerGroup([], { pane: 'flows' }).addTo(map)
  }
}

function removeFlowGraphics(flowId) {
  const elements = flowGraphics.get(flowId)
  if (!elements || !flowsLayer) return
  flowsLayer.removeLayer(elements.polyline)
  flowsLayer.removeLayer(elements.sourceMarker)
  flowsLayer.removeLayer(elements.destMarker)
  flowGraphics.delete(flowId)
}

function createArcLatLngs(src, dst) {
  if (!src || !dst) return []
  const midLat = (src.lat + dst.lat) / 2 + ((dst.lon - src.lon) * 0.08)
  const midLon = (src.lon + dst.lon) / 2 + ((src.lat - dst.lat) * 0.08)
  return [
    [src.lat, src.lon],
    [midLat, midLon],
    [dst.lat, dst.lon]
  ]
}

function createFlowGraphics(flow) {
  if (!map || !flow) return null
  const { src, dst, color } = flow
  if (!src || !dst) return null
  if (![src.lat, src.lon, dst.lat, dst.lon].every(value => typeof value === 'number' && Number.isFinite(value))) {
    return null
  }

  ensureFlowsLayer()

  const latLngs = createArcLatLngs(src, dst)
  if (!latLngs.length) return null

  const polyline = L.polyline(latLngs, {
    color: color || getSeverityColor(flow.severity),
    weight: 2,
    opacity: 0.85,
    smoothFactor: 1.2,
    className: 'attack-flow'
  })

  const sourceMarker = L.circleMarker([src.lat, src.lon], {
    radius: 5,
    weight: 1,
    color: color || '#38bdf8',
    fillColor: color || '#38bdf8',
    opacity: 1,
    fillOpacity: 0.9,
    className: 'attack-node attack-node--source'
  })

  const destMarker = L.circleMarker([dst.lat, dst.lon], {
    radius: 6,
    weight: 2,
    color: color || '#38bdf8',
    fillColor: '#1e293b',
    opacity: 1,
    fillOpacity: 0.9,
    className: 'attack-node attack-node--destination'
  })

  polyline.addTo(flowsLayer)
  sourceMarker.addTo(flowsLayer)
  destMarker.addTo(flowsLayer)

  return { polyline, sourceMarker, destMarker }
}

function renderAttackFlows() {
  if (!map) return
  ensureFlowsLayer()

  const activeIds = new Set(flows.value.map(flow => flow.id))

  Array.from(flowGraphics.keys()).forEach(id => {
    if (!activeIds.has(id)) {
      removeFlowGraphics(id)
    }
  })

  flows.value.forEach(flow => {
    if (!flowGraphics.has(flow.id)) {
      const graphics = createFlowGraphics(flow)
      if (graphics) {
        flowGraphics.set(flow.id, graphics)
      }
    }
  })
}

function updateFlowVisualStyles() {
  if (!flowGraphics.size) return
  const now = Date.now()
  flowGraphics.forEach((elements, id) => {
    const flow = flows.value.find(item => item.id === id)
    if (!flow) {
      removeFlowGraphics(id)
      return
    }
    const remaining = Math.max(0, flow.expiresAt - now)
    const ratio = Math.min(1, Math.max(0, remaining / FLOW_TTL))
    const baseOpacity = 0.2 + (ratio * 0.8)
    elements.polyline.setStyle({ opacity: baseOpacity, weight: 2 + (ratio * 1.2) })
    elements.sourceMarker.setStyle({
      opacity: baseOpacity,
      fillOpacity: Math.min(0.95, 0.3 + (ratio * 0.6))
    })
    elements.destMarker.setStyle({
      opacity: baseOpacity,
      fillOpacity: Math.min(0.95, 0.35 + (ratio * 0.55))
    })
  })
}

function syncThreadState() {
  fetchAndDisplayGeoData()
  fetchAttackFlows()
}

function handleThreadEvent() {
  syncThreadState()
}

function handleResize() {
  if (map) {
    map.invalidateSize()
  }
}

async function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  await nextTick()
  handleResize()
}

async function exitFullscreen() {
  if (!isFullscreen.value) return
  isFullscreen.value = false
  await nextTick()
  handleResize()
}

watch(isFullscreen, () => {
  handleResize()
})

watch(timeRange, () => {
  fetchAndDisplayGeoData()
  fetchAttackFlows()
})

watch(flows, () => {
  renderAttackFlows()
}, { deep: true })

onMounted(async () => {
  initMap()
  await fetchAndDisplayGeoData()
  await fetchAttackFlows()

  unsubscribeLocationThread = subscribeToLocationThread(handleThreadEvent)

  flowFadeInterval = setInterval(() => {
    updateFlowVisualStyles()
    fetchAttackFlows()
  }, 1200)

  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (unsubscribeLocationThread) {
    unsubscribeLocationThread()
  }
  if (flowFadeInterval) {
    clearInterval(flowFadeInterval)
    flowFadeInterval = null
  }
  window.removeEventListener('resize', handleResize)
  flowGraphics.forEach((_, id) => removeFlowGraphics(id))
})
</script>

<style scoped>
:deep(.leaflet-container) {
  background-color: #0f172a;
  border-radius: 0.5rem;
}

.fullscreen-map {
  position: fixed !important;
  inset: 0 !important;
  z-index: 70 !important;
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0 !important;
  border: none !important;
}

:deep(.attack-flow) {
  filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.35));
}

:deep(.attack-node) {
  filter: drop-shadow(0 0 4px rgba(34, 211, 238, 0.4));
}

:deep(.leaflet-control-attribution) {
  background-color: rgba(15, 23, 42, 0.8) !important;
  color: #94a3b8 !important;
}

:deep(.leaflet-popup-content-wrapper) {
  background-color: #1e293b;
  border-radius: 0.5rem;
  border: 1px solid #334155;
}

:deep(.leaflet-popup-tip) {
  background-color: #1e293b;
}

:deep(.marker-cluster) {
  background-color: rgba(0, 225, 255, 0.8) !important;
  border: 2px solid #00e1ff !important;
}

:deep(.marker-cluster-small) {
  background-color: rgba(0, 225, 255, 0.6) !important;
}

:deep(.marker-cluster-medium) {
  background-color: rgba(168, 85, 247, 0.7) !important;
}

:deep(.marker-cluster-large) {
  background-color: rgba(255, 45, 120, 0.8) !important;
}

:deep(.marker-cluster div) {
  background-color: rgba(0, 0, 0, 0.3) !important;
  color: #fff !important;
}
</style>
