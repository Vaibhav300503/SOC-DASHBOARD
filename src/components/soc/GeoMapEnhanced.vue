<template>
  <div class="relative w-full h-full bg-slate-900 overflow-hidden rounded-xl border border-slate-700/50">
    <!-- Map Container -->
    <div ref="mapContainer" class="absolute inset-0 z-0"></div>

    <!-- Legend Panel (Bottom Right) -->
    <div class="absolute bottom-4 right-4 z-10 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-xl">
      <h3 class="text-xs font-bold text-slate-400 uppercase mb-3">Attack Flow Legend</h3>
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-xs">
          <span class="w-3 h-3 rounded-full" style="background-color: #ef4444;"></span>
          <span class="text-slate-300">Critical</span>
          <span class="text-slate-500 ml-auto font-mono">{{ severityCounts.Critical }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="w-3 h-3 rounded-full" style="background-color: #f97316;"></span>
          <span class="text-slate-300">High</span>
          <span class="text-slate-500 ml-auto font-mono">{{ severityCounts.High }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="w-3 h-3 rounded-full" style="background-color: #eab308;"></span>
          <span class="text-slate-300">Medium</span>
          <span class="text-slate-500 ml-auto font-mono">{{ severityCounts.Medium }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="w-3 h-3 rounded-full" style="background-color: #22c55e;"></span>
          <span class="text-slate-300">Low</span>
          <span class="text-slate-500 ml-auto font-mono">{{ severityCounts.Low }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="w-3 h-3 rounded-full" style="background-color: #3b82f6;"></span>
          <span class="text-slate-300">Info</span>
          <span class="text-slate-500 ml-auto font-mono">{{ severityCounts.Info }}</span>
        </div>
      </div>
      <div class="border-t border-slate-700 mt-3 pt-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">Total Flows</span>
          <span class="text-cyber-400 font-bold font-mono">{{ totalFlows }}</span>
        </div>
      </div>
      <!-- Marker Legend -->
      <div class="border-t border-slate-700 mt-3 pt-3 space-y-1">
        <div class="flex items-center gap-2 text-xs">
          <span class="w-2 h-2 rounded-full border-2 border-current text-cyan-400"></span>
          <span class="text-slate-400">Source (Attacker)</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span class="text-slate-400">Destination (Target)</span>
        </div>
      </div>
    </div>

    <!-- Threat Feed Overlay (Bottom Left) -->
    <div class="absolute bottom-4 left-4 z-10 w-72 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-slate-400 uppercase">Live Attack Feed</h3>
        <button @click="refreshFlows" class="text-xs text-cyan-400 hover:text-cyan-300" :disabled="isLoading">
          <i :class="['fas fa-sync-alt', isLoading ? 'fa-spin' : '']"></i>
        </button>
      </div>
      <div v-if="isLoading" class="py-4 text-center text-slate-500 text-xs">
        <i class="fas fa-spinner fa-spin mr-1"></i> Loading attack flows...
      </div>
      <div v-else class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
        <div v-for="flow in recentFlows" :key="flow.id" class="flex items-center gap-2 text-xs p-2 bg-slate-900/50 rounded hover:bg-slate-900/80 cursor-pointer" @click="focusFlow(flow)">
          <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: flow.color }"></span>
          <div class="flex-1 min-w-0">
            <div class="text-slate-300 truncate">{{ flow.srcIp }} → {{ flow.dstIp }}</div>
            <div class="text-slate-500 text-[10px]">{{ flow.logType || 'System' }}</div>
          </div>
          <span class="text-slate-500 text-[10px] flex-shrink-0">{{ formatTime(flow.timestamp) }}</span>
        </div>
        <div v-if="recentFlows.length === 0" class="py-4 text-center text-slate-500 text-xs">
          No attack flows detected
        </div>
      </div>
    </div>

    <!-- Stats Panel (Top Right) -->
    <div class="absolute top-4 right-4 z-10 flex gap-2">
      <div class="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
        <div class="text-[10px] text-slate-400 uppercase">Countries</div>
        <div class="text-lg font-bold text-purple-400 font-mono">{{ uniqueCountries }}</div>
      </div>
      <div class="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
        <div class="text-[10px] text-slate-400 uppercase">Active IPs</div>
        <div class="text-lg font-bold text-cyan-400 font-mono">{{ uniqueIPs }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const mapContainer = ref(null)
const map = ref(null)
const flowsLayer = ref(null)
const flows = ref([])
const isLoading = ref(false)
let refreshInterval = null

// Computed properties
const recentFlows = computed(() => flows.value.slice(0, 15))
const totalFlows = computed(() => flows.value.length)

const severityCounts = computed(() => {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 }
  flows.value.forEach(f => {
    const sev = f.severity || 'Info'
    if (counts[sev] !== undefined) counts[sev]++
  })
  return counts
})

const uniqueCountries = computed(() => {
  const countries = new Set()
  flows.value.forEach(f => {
    if (f.src?.country) countries.add(f.src.country)
    if (f.dst?.country) countries.add(f.dst.country)
  })
  return countries.size
})

const uniqueIPs = computed(() => {
  const ips = new Set()
  flows.value.forEach(f => {
    if (f.srcIp) ips.add(f.srcIp)
    if (f.dstIp) ips.add(f.dstIp)
  })
  return ips.size
})

const formatTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const getSeverityColor = (severity) => {
  const colors = {
    'Critical': '#ef4444',
    'High': '#f97316',
    'Medium': '#eab308',
    'Low': '#22c55e',
    'Info': '#3b82f6'
  }
  return colors[severity] || '#3b82f6'
}

const initMap = () => {
  if (!mapContainer.value) return

  map.value = L.map(mapContainer.value, {
    zoomControl: true,
    attributionControl: false,
    center: [20, 40],
    zoom: 2,
    minZoom: 2,
    maxZoom: 10
  })

  // Dark/Cyber themed tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map.value)

  // Initialize flows layer
  flowsLayer.value = L.layerGroup().addTo(map.value)
}

const fetchAttackFlows = async () => {
  isLoading.value = true
  try {
    // Fetch recent logs
    const res = await fetch(`${API_BASE}/logs/recent?limit=100`)
    const json = await res.json()
    const logs = Array.isArray(json.data) ? json.data : []

    // Collect unique IPs
    const ipSet = new Set()
    logs.forEach(log => {
      if (log.source_ip && log.source_ip !== 'N/A' && log.source_ip !== '0.0.0.0') ipSet.add(log.source_ip)
      if (log.dest_ip && log.dest_ip !== 'N/A' && log.dest_ip !== '0.0.0.0') ipSet.add(log.dest_ip)
    })

    const ipList = Array.from(ipSet).slice(0, 50)
    const geoMap = new Map()

    // Batch lookup geo for each IP
    await Promise.all(ipList.map(async ip => {
      try {
        const r = await fetch(`${API_BASE}/geo/ip/${encodeURIComponent(ip)}`)
        const j = await r.json()
        if (j.success && j.data) {
          const g = j.data
          const lat = g.latitude ?? g.lat
          const lon = g.longitude ?? g.lon ?? g.lng
          if (lat !== undefined && lon !== undefined && (lat !== 0 || lon !== 0)) {
            geoMap.set(ip, {
              lat,
              lon,
              country: g.country || g.country_name || 'Unknown',
              city: g.city || g.city_name || 'Unknown'
            })
          }
        }
      } catch (e) {
        console.error('Geo lookup failed for:', ip)
      }
    }))

    // Build flow objects
    const flowList = []
    logs.forEach(log => {
      const src = geoMap.get(log.source_ip)
      const dst = geoMap.get(log.dest_ip)
      
      // Skip if no geo data for either IP
      if (!src && !dst) return
      
      const severity = log.severity || 'Info'
      const color = getSeverityColor(severity)
      
      flowList.push({
        id: log._id || log.id || Math.random().toString(36),
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

    flows.value = flowList
    drawFlows()
  } catch (error) {
    console.error('Error fetching attack flows:', error)
  } finally {
    isLoading.value = false
  }
}

const drawFlows = () => {
  if (!map.value || !flowsLayer.value) return

  // Clear existing flows
  flowsLayer.value.clearLayers()

  flows.value.forEach(flow => {
    const src = flow.src
    const dst = flow.dst

    // Draw source marker if available
    if (src) {
      const srcMarker = L.circleMarker([src.lat, src.lon], {
        radius: 5,
        color: flow.color,
        fillColor: flow.color,
        fillOpacity: 0.3,
        weight: 2
      })
      
      srcMarker.bindPopup(`
        <div style="font-size: 12px;">
          <div style="font-weight: bold; color: ${flow.color};">Source (Attacker)</div>
          <div>IP: ${flow.srcIp}</div>
          <div>Location: ${src.city}, ${src.country}</div>
          <div>Severity: ${flow.severity}</div>
          <div>Type: ${flow.logType || 'System'}</div>
        </div>
      `)
      flowsLayer.value.addLayer(srcMarker)
    }

    // Draw destination marker if available
    if (dst) {
      const dstMarker = L.circleMarker([dst.lat, dst.lon], {
        radius: 6,
        color: '#22d3ee',
        fillColor: '#22d3ee',
        fillOpacity: 0.8,
        weight: 2
      })
      
      dstMarker.bindPopup(`
        <div style="font-size: 12px;">
          <div style="font-weight: bold; color: #22d3ee;">Destination (Target)</div>
          <div>IP: ${flow.dstIp}</div>
          <div>Location: ${dst.city}, ${dst.country}</div>
        </div>
      `)
      flowsLayer.value.addLayer(dstMarker)
    }

    // Draw attack flow line (curved arc)
    if (src && dst) {
      // Control point for curve (midpoint raised)
      const distance = Math.sqrt(Math.pow(dst.lat - src.lat, 2) + Math.pow(dst.lon - src.lon, 2))
      const curvature = Math.min(distance * 0.3, 20)
      
      // Create curved path using multiple points
      const points = []
      for (let i = 0; i <= 20; i++) {
        const t = i / 20
        const lat = src.lat + (dst.lat - src.lat) * t + Math.sin(t * Math.PI) * curvature
        const lon = src.lon + (dst.lon - src.lon) * t
        points.push([lat, lon])
      }
      
      const line = L.polyline(points, {
        color: flow.color,
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 5',
        className: 'attack-flow-animated'
      })

      line.bindPopup(`
        <div style="font-size: 12px;">
          <div style="font-weight: bold; color: ${flow.color};">Attack Flow</div>
          <div>${flow.srcIp} → ${flow.dstIp}</div>
          <div>From: ${src.city}, ${src.country}</div>
          <div>To: ${dst.city}, ${dst.country}</div>
          <div>Severity: ${flow.severity}</div>
          <div>Type: ${flow.logType || 'System'}</div>
          <div>Time: ${formatTime(flow.timestamp)}</div>
        </div>
      `)
      flowsLayer.value.addLayer(line)
    }
  })
}

const focusFlow = (flow) => {
  if (!map.value) return
  
  if (flow.src && flow.dst) {
    const bounds = L.latLngBounds([
      [flow.src.lat, flow.src.lon],
      [flow.dst.lat, flow.dst.lon]
    ])
    map.value.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 })
  } else if (flow.src) {
    map.value.setView([flow.src.lat, flow.src.lon], 4)
  } else if (flow.dst) {
    map.value.setView([flow.dst.lat, flow.dst.lon], 4)
  }
}

const refreshFlows = () => {
  fetchAttackFlows()
}

onMounted(() => {
  initMap()
  fetchAttackFlows()
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(fetchAttackFlows, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
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

:deep(.leaflet-popup-content-wrapper) {
  background-color: #1e293b;
  border-radius: 8px;
  border: 1px solid #334155;
  color: #e2e8f0;
}

:deep(.leaflet-popup-tip) {
  background-color: #1e293b;
}

:deep(.attack-flow-animated) {
  animation: flowPulse 2s infinite;
}

@keyframes flowPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
