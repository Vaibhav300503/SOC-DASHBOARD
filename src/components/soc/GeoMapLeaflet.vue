<template>
  <div class="space-y-4">
    <!-- Map Container -->
    <div class="card-glass p-6 rounded-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-dark-50">Interactive Geo Map</h3>
        <div class="flex gap-2">
          <button @click="resetMap" class="btn-cyber-outline text-sm">
            <i class="fas fa-redo mr-1"></i>Reset
          </button>
          <button @click="toggleHeatmap" class="btn-cyber-outline text-sm">
            <i class="fas fa-fire mr-1"></i>{{ showHeatmap ? 'Markers' : 'Heatmap' }}
          </button>
        </div>
      </div>

      <!-- Map -->
      <div ref="mapContainer" class="w-full h-96 rounded-lg border border-slate-dark-700/50 overflow-hidden"></div>

      <!-- Map Stats -->
      <div class="grid grid-cols-4 gap-4 mt-4">
        <div class="bg-slate-dark-900/50 rounded-lg p-3 border border-slate-dark-700/50">
          <div class="text-xs text-slate-dark-400">Total Markers</div>
          <div class="text-lg font-bold text-cyber-400">{{ totalMarkers }}</div>
        </div>
        <div class="bg-slate-dark-900/50 rounded-lg p-3 border border-slate-dark-700/50">
          <div class="text-xs text-slate-dark-400">Countries</div>
          <div class="text-lg font-bold text-neon-purple">{{ uniqueCountries }}</div>
        </div>
        <div class="bg-slate-dark-900/50 rounded-lg p-3 border border-slate-dark-700/50">
          <div class="text-xs text-slate-dark-400">Critical Events</div>
          <div class="text-lg font-bold text-neon-red">{{ criticalCount }}</div>
        </div>
        <div class="bg-slate-dark-900/50 rounded-lg p-3 border border-slate-dark-700/50">
          <div class="text-xs text-slate-dark-400">High Events</div>
          <div class="text-lg font-bold text-neon-orange">{{ highCount }}</div>
        </div>
      </div>
    </div>

    <!-- Geo Data Table -->
    <div class="card-glass p-6 rounded-xl">
      <h3 class="text-lg font-semibold text-slate-dark-50 mb-4">Geolocation Data</h3>
      <div class="overflow-x-auto">
        <table class="table-cyber text-sm">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Country</th>
              <th>City</th>
              <th>Severity</th>
              <th>Log Type</th>
              <th>Timestamp</th>
              <th>ISP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(feature, idx) in displayedFeatures" :key="idx">
              <td>
                <code class="text-cyber-400 font-mono text-xs">{{ feature.properties.ip }}</code>
              </td>
              <td class="text-slate-dark-300">{{ feature.properties.country }}</td>
              <td class="text-slate-dark-300">{{ feature.properties.city }}</td>
              <td>
                <span :class="['badge-' + getSeverityClass(feature.properties.severity)]">
                  {{ feature.properties.severity }}
                </span>
              </td>
              <td class="text-slate-dark-400 text-xs">{{ feature.properties.logType }}</td>
              <td class="text-slate-dark-400 text-xs">{{ formatTime(feature.properties.timestamp) }}</td>
              <td class="text-slate-dark-400 text-xs">{{ feature.properties.isp }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="displayedFeatures.length === 0" class="text-center py-8 text-slate-dark-400">
          <i class="fas fa-map-marker-alt text-3xl mb-2 opacity-50"></i>
          <p>No geolocation data available</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import { useAPIStore } from '../../stores/apiStore'

const apiStore = useAPIStore()
const mapContainer = ref(null)
let map = null
let markerClusterGroup = null
let geoJsonLayer = null
let flowsLayer = null

const features = ref([])
const flows = ref([])
const showHeatmap = ref(false)
const timeRange = ref('24h')

// Computed properties
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
  return features.value.slice(0, 20) // Show first 20 in table
})

/**
 * Initialize Leaflet map
 */
function initMap() {
  if (map) return

  map = L.map(mapContainer.value).setView([20.5937, 78.9629], 4) // India center

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors, © CartoDB',
    maxZoom: 19,
    className: 'map-tiles'
  }).addTo(map)

  // Initialize marker cluster group
  markerClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 80,
    disableClusteringAtZoom: 15
  })

  map.addLayer(markerClusterGroup)
}

let curveLoaded = false

async function loadLeafletCurve() {
  if (curveLoaded) return
  if (typeof window !== 'undefined' && window.L && window.L.curve) {
    curveLoaded = true
    return
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/leaflet.curve/leaflet.curve.min.js'
    script.async = true
    script.onload = () => {
      curveLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load leaflet.curve'))
    document.head.appendChild(script)
  })
}

/**
 * Fetch and display geo data
 */
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

/**
 * Update map markers
 */
function updateMapMarkers() {
  if (!map) return

  // Clear existing markers
  markerClusterGroup.clearLayers()

  // Add markers for each feature
  features.value.forEach(feature => {
    const { coordinates } = feature.geometry
    const { severity, ip, country, city, logType } = feature.properties

    // Color by severity
    const color = getSeverityColor(severity)

    const marker = L.circleMarker([coordinates[1], coordinates[0]], {
      radius: 6,
      fillColor: color,
      color: color,
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.7
    })

    // Popup content
    const popupContent = `
      <div class="text-sm">
        <div class="font-semibold text-slate-dark-50">${ip}</div>
        <div class="text-slate-dark-400">${city}, ${country}</div>
        <div class="text-xs text-slate-dark-500 mt-1">
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

function clearFlowsLayer() {
  if (flowsLayer) {
    flowsLayer.clearLayers()
  }
}

function drawFlows() {
  if (!map) return
  if (!flowsLayer) {
    flowsLayer = L.layerGroup()
    map.addLayer(flowsLayer)
  }
  clearFlowsLayer()

  flows.value.forEach(flow => {
    const src = flow.src
    const dst = flow.dst
    if (!src || !dst) return

    const srcMarker = L.circleMarker([src.lat, src.lon], {
      radius: 5,
      color: flow.color,
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.9
    })

    const dstMarker = L.circleMarker([dst.lat, dst.lon], {
      radius: 5,
      color: '#4fc3f7',
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.9
    })

    const popup = `
      <div class="text-sm">
        <div class="font-semibold text-slate-dark-50">${flow.logType || ''}</div>
        <div class="text-slate-dark-400">${flow.srcIp} → ${flow.dstIp}</div>
        <div class="text-xs text-slate-dark-500 mt-1">
          <div>Severity: <span class="font-semibold">${flow.severity}</span></div>
          <div>Time: ${formatTime(flow.timestamp)}</div>
        </div>
      </div>
    `

    srcMarker.bindPopup(popup)
    dstMarker.bindPopup(popup)
    flowsLayer.addLayer(srcMarker)
    flowsLayer.addLayer(dstMarker)

    const controlLat = (src.lat + dst.lat) / 2 + 15
    const controlLon = (src.lon + dst.lon) / 2
    const path = [
      'M',
      [src.lat, src.lon],
      'Q',
      [controlLat, controlLon],
      [dst.lat, dst.lon]
    ]

    let shape
    if (L.curve) {
      shape = L.curve(path, {
        color: flow.color,
        weight: 2,
        opacity: 0.8
      })
    } else {
      shape = L.polyline([
        [src.lat, src.lon],
        [dst.lat, dst.lon]
      ], {
        color: flow.color,
        weight: 2,
        opacity: 0.8
      })
    }

    shape.bindPopup(popup)
    flowsLayer.addLayer(shape)
  })
}

/**
 * Get color by severity
 */
function getSeverityColor(severity) {
  const colors = {
    'Critical': '#ff0055',
    'High': '#ff6b35',
    'Medium': '#ffa500',
    'Low': '#00ff88'
  }
  return colors[severity] || '#5b6dff'
}

/**
 * Get severity class for badge
 */
function getSeverityClass(severity) {
  const map = {
    'Critical': 'critical',
    'High': 'high',
    'Medium': 'medium',
    'Low': 'low'
  }
  return map[severity] || 'low'
}

/**
 * Format timestamp
 */
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

/**
 * Reset map view
 */
function resetMap() {
  if (map) {
    map.setView([20.5937, 78.9629], 4)
  }
}

/**
 * Toggle heatmap view
 */
function toggleHeatmap() {
  showHeatmap.value = !showHeatmap.value
  // Heatmap would require additional library (Leaflet.heat)
  // For now, just toggle marker visibility
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
    drawFlows()
  } catch (error) {
    console.error('Error building attack flows:', error)
  }
}

/**
 * Watch time range changes
 */
watch(timeRange, () => {
  fetchAndDisplayGeoData()
  fetchAttackFlows()
})

/**
 * Initialize on mount
 */
onMounted(async () => {
  initMap()
  await loadLeafletCurve()
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
  background-color: rgba(91, 109, 255, 0.8) !important;
  border: 2px solid #5b6dff !important;
}

:deep(.marker-cluster-small) {
  background-color: rgba(91, 109, 255, 0.6) !important;
}

:deep(.marker-cluster-medium) {
  background-color: rgba(176, 38, 255, 0.7) !important;
}

:deep(.marker-cluster-large) {
  background-color: rgba(255, 0, 85, 0.8) !important;
}

:deep(.marker-cluster div) {
  background-color: rgba(0, 0, 0, 0.3) !important;
  color: #fff !important;
}
</style>
