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
        </div>
      </template>

      <!-- Map -->
      <div ref="mapContainer" class="w-full h-96 rounded-lg border border-slate-700/30 overflow-hidden"></div>

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
import { ref, onMounted, computed, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import DashboardCard from '../common/DashboardCard.vue'
import { useAPIStore } from '../../stores/apiStore'

const apiStore = useAPIStore()
const mapContainer = ref(null)
let map = null
let markerClusterGroup = null
let flowsLayer = null

const features = ref([])
const flows = ref([])
const showHeatmap = ref(false)
const timeRange = ref('24h')

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
    attribution: '© OpenStreetMap contributors, © CartoDB',
    maxZoom: 19,
    className: 'map-tiles'
  }).addTo(map)

  markerClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 80,
    disableClusteringAtZoom: 15
  })

  map.addLayer(markerClusterGroup)
}

async function fetchAndDisplayGeoData() {
  try {
    const response = await fetch(`/api/geo/logs?timeRange=${timeRange.value}&limit=1000`)
    const data = await response.json()

    if (data.success && data.features) {
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
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
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
    const res = await fetch('/api/logs/recent?limit=200')
    const json = await res.json()
    const logs = Array.isArray(json.data) ? json.data : []

    const ipSet = new Set()
    logs.forEach(log => {
      if (log.source_ip) ipSet.add(log.source_ip)
      if (log.dest_ip) ipSet.add(log.dest_ip)
    })

    const ipList = Array.from(ipSet).slice(0, 60)
    const geoMap = new Map()

    await Promise.all(ipList.map(async ip => {
      try {
        const r = await fetch(`/api/geo/ip/${encodeURIComponent(ip)}`)
        const j = await r.json()
        if (j.success && j.data) {
          const g = j.data
          const lat = g.latitude ?? g.lat
          const lon = g.longitude ?? g.lon
          if (lat !== undefined && lon !== undefined) {
            geoMap.set(ip, {
              lat,
              lon,
              country: g.country || g.country_name || '',
              city: g.city || g.city_name || ''
            })
          }
        }
      } catch (e) {
        console.error('Error fetching geo for ip', ip, e)
      }
    }))

    const list = []
    logs.slice(0, 100).forEach(log => {
      const src = geoMap.get(log.source_ip)
      const dst = geoMap.get(log.dest_ip)
      if (!src || !dst) return
      const severity = log.severity || 'Low'
      const color = getSeverityColor(severity)
      list.push({
        src,
        dst,
        severity,
        color,
        srcIp: log.source_ip,
        dstIp: log.dest_ip,
        logType: log.log_type,
        timestamp: log.timestamp
      })
    })

    flows.value = list
  } catch (error) {
    console.error('Error building attack flows:', error)
  }
}

watch(timeRange, () => {
  fetchAndDisplayGeoData()
  fetchAttackFlows()
})

onMounted(async () => {
  initMap()
  await fetchAndDisplayGeoData()
  await fetchAttackFlows()
})
</script>

<style scoped>
:deep(.leaflet-container) {
  background-color: #0f172a;
  border-radius: 0.5rem;
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
