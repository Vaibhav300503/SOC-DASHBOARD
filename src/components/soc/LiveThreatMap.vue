<template>
  <DashboardCard title="Live Threat Map" subtitle="Global threat detection with live attack flows and real-time threat ticker" size="full">
    <template #header-action>
      <div class="flex gap-2 flex-wrap">
        <button
          @click="toggleFilters"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Toggle filters"
        >
          <i class="fas fa-filter mr-1"></i>Filter
        </button>
        <button
          @click="zoomIn"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Zoom in"
        >
          <i class="fas fa-search-plus mr-1"></i>Zoom In
        </button>
        <button
          @click="zoomOut"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Zoom out"
        >
          <i class="fas fa-search-minus mr-1"></i>Zoom Out
        </button>
        <button
          @click="toggleRealtime"
          :class="[
            'px-3 py-1 text-xs rounded-lg transition-colors',
            realtimeEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-700/50 text-slate-400'
          ]"
          title="Toggle real-time updates"
        >
          <i :class="realtimeEnabled ? 'fas fa-circle-notch fa-spin' : 'fas fa-pause'" class="mr-1"></i>
          {{ realtimeEnabled ? 'LIVE' : 'PAUSED' }}
        </button>
        <button
          @click="resetView"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Reset view"
        >
          <i class="fas fa-redo mr-1"></i>Reset
        </button>
      </div>
    </template>

    <!-- Filters Panel -->
    <div v-if="showFilters" class="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="filterCritical" type="checkbox" class="rounded" />
          <span>Critical</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="filterHigh" type="checkbox" class="rounded" />
          <span>High</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="filterMedium" type="checkbox" class="rounded" />
          <span>Medium</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="filterLow" type="checkbox" class="rounded" />
          <span>Low</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="filterShowFlows" type="checkbox" class="rounded" />
          <span>Show Flows</span>
        </label>
      </div>
    </div>

    <!-- Map Container with Overlays -->
    <div class="relative w-full h-[600px] bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/30">
      <!-- Raven iframe replacing the D3 map -->
      <iframe
        ref="iframeRef"
        :src="iframeSrc"
        frameborder="0"
        class="w-full h-full bg-slate-900"
      />

      <!-- Live Threat Ticker (Top Left) -->
      <div class="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 space-y-3 z-10 max-w-sm">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-200">LIVE THREATS</div>
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        
        <!-- Threat Ticker -->
        <div class="h-32 overflow-hidden">
          <div class="space-y-2 animate-scroll-up">
            <div 
              v-for="(threat, idx) in liveThreatTicker.slice(0, 8)" 
              :key="idx"
              :class="['text-xs px-2 py-1 rounded border-l-2 transition-all', getThreatTickerClass(threat.severity)]"
            >
              <div class="font-semibold">{{ threat.source }} → {{ threat.target }}</div>
              <div class="text-[10px] opacity-75">{{ threat.time }}</div>
            </div>
          </div>
        </div>

        <!-- Top Threat Stats -->
        <div class="border-t border-slate-700/30 pt-3 mt-3">
          <div class="text-xs text-slate-400 mb-2">THREAT LEVEL</div>
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-red-400">🔴 Critical</span>
              <span class="font-semibold">{{ threatStats.critical }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-orange-400">🟠 High</span>
              <span class="font-semibold">{{ threatStats.high }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend & Controls (Top Right) -->
      <div class="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 space-y-2 z-10">
        <div class="text-sm font-semibold text-slate-200 mb-3">THREAT LEGEND</div>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span class="text-xs text-slate-400">Critical - Immediate</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-orange-500"></div>
            <span class="text-xs text-slate-400">High - Urgent</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span class="text-xs text-slate-400">Medium - Monitor</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span class="text-xs text-slate-400">Low - Information</span>
          </div>
        </div>
        
        <div class="border-t border-slate-700/30 pt-3 mt-3">
          <div class="text-xs text-slate-400 mb-2">STATS</div>
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span>Total Threats:</span>
              <span class="font-semibold text-cyan-400">{{ threatStats.total }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Countries:</span>
              <span class="font-semibold text-cyan-400">{{ threatStats.countries }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Update Rate:</span>
              <span class="font-semibold text-green-400">{{ updateRate }}ms</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom: Recent Attack Details -->
      <div class="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 z-10 max-h-24 overflow-y-auto">
        <div class="text-xs font-semibold text-slate-200 mb-2">RECENT ATTACK FLOWS (Last 5)</div>
        <div class="space-y-1">
          <div v-for="(flow, idx) in recentFlows.slice(0, 5)" :key="idx" class="text-xs text-slate-400 flex justify-between items-center">
            <span class="flex-1">{{ flow.time }}</span>
            <span class="flex-1 text-slate-500 truncate mx-2">{{ flow.source }} → {{ flow.target }}</span>
            <span :class="['font-semibold whitespace-nowrap', getSeverityColor(flow.severity)]">{{ flow.severity }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <template #footer>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="text-center">
          <div class="text-lg font-bold text-red-400 animate-pulse">{{ threatStats.critical }}</div>
          <div class="text-xs text-slate-500">Critical</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-orange-400">{{ threatStats.high }}</div>
          <div class="text-xs text-slate-500">High</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-yellow-400">{{ threatStats.medium }}</div>
          <div class="text-xs text-slate-500">Medium</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-cyan-400">{{ threatStats.low }}</div>
          <div class="text-xs text-slate-500">Low</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-slate-300">{{ threatStats.total }}</div>
          <div class="text-xs text-slate-500">Total</div>
        </div>
      </div>
    </template>
  </DashboardCard>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import DashboardCard from '../common/DashboardCard.vue'
import * as d3 from 'd3'
import { connectThreatWS, disconnectThreatWS, subscribeTothreats } from '../../services/threatService'

const apiStore = useAPIStore()
const mapContainer = ref(null)
const iframeRef = ref(null)
const getRavenPageUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
  const url = new URL(apiBase)
  // Use localhost to avoid HTTPS upgrade issues
  return `http://localhost:3002/raven-main/src/raven.html`
}
const iframeSrc = getRavenPageUrl()
let iframeLoaded = false
let pendingPlots = []
let tailscaleWS = null
let tailscaleReconnectTimer = null
const getWSUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
  const url = new URL(apiBase)
  // Use localhost to avoid HTTPS upgrade issues
  return `ws://localhost:3002/ws/tailscale`
}
const getTargetOrigin = () => {
  try { return new URL(iframeSrc).origin } catch { return '*' }
}
const plotRaven = (fromVal, toVal, timeout = 1000) => {
  if (!fromVal) return
  // If destination is missing, render a point by using from as both ends
  if (!toVal) toVal = fromVal
  if (!iframeLoaded) {
    pendingPlots.push({ from: fromVal, to: toVal, timeout })
    return
  }
  const iframe = iframeRef.value
  if (!iframe) return
  try {
    iframe.contentWindow?.postMessage({ type: 'raven_plot', from: fromVal, to: toVal, timeout }, getTargetOrigin())
  } catch (_) {}
}
const seedFromRecentLogs = (items) => {
  if (!Array.isArray(items)) return
  let delay = 250
  items.slice(0, 50).reverse().forEach((log) => {
    const fromVal = log.src || log.source_ip || log?.source?.ip || log?.raw_data?.src_ip || null
    const toVal = log.dst || log.dest_ip || log?.destination?.ip || log?.raw_data?.dst_ip || null
    setTimeout(() => plotRaven(fromVal, toVal, 900), delay)
    delay += 120
  })
}
const seedFromAPILogRecent = async () => {
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
    // Use localhost to avoid HTTPS upgrade issues
    const url = `http://localhost:3002/api/logs/recent?limit=50`
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json()
    const items = Array.isArray(data?.data) ? data.data : []
    if (items.length) {
      seedFromRecentLogs(items)
      // Also set the bottom recent flows panel from real data (last 5)
      recentFlows.value = items.slice(0, 5).map(log => ({
        time: new Date(log.timestamp || log.ingested_at || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: log.source_ip || log?.source?.ip || log?.raw_data?.src_ip || 'Unknown',
        target: log.dest_ip || log?.destination?.ip || log?.raw_data?.dst_ip || 'Unknown',
        severity: (log.severity || log?.event?.severity || 'Low')
      }))
      // Seed LIVE THREATS ticker from recent items (top 8)
      liveThreatTicker.value = items.slice(0, 8).map(log => ({
        time: new Date(log.timestamp || log.ingested_at || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: log.source_ip || log?.source?.ip || log?.raw_data?.src_ip || 'Unknown',
        target: log.dest_ip || log?.destination?.ip || log?.raw_data?.dst_ip || 'Unknown',
        severity: (log.severity || log?.event?.severity || 'Low')
      }))
    }
  } catch (_) {}
}
const connectTailscaleWS = () => {
  const url = getWSUrl()
  try {
    tailscaleWS = new WebSocket(url)
    tailscaleWS.onopen = () => {}
    tailscaleWS.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg?.type === 'tailscale_recent' && Array.isArray(msg.data)) {
          seedFromRecentLogs(msg.data)
        } else if (msg?.type === 'tailscale_log' && msg.data) {
          const log = msg.data
          const fromVal = log.src || log.source_ip || log?.source?.ip || log?.raw_data?.src_ip || null
          const toVal = log.dst || log.dest_ip || log?.destination?.ip || log?.raw_data?.dst_ip || null
          plotRaven(fromVal, toVal, 900)
          // update ticker and recent flows list
          liveThreatTicker.value.unshift({
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: fromVal || 'Unknown',
            target: toVal || 'Unknown',
            severity: log.severity || 'Low'
          })
          liveThreatTicker.value = liveThreatTicker.value.slice(0, 8)
          recentFlows.value = [{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), source: fromVal || 'Unknown', target: toVal || 'Unknown', severity: log.severity || 'Low' }, ...recentFlows.value].slice(0,5)
        }
      } catch (_) {}
    }
    tailscaleWS.onerror = () => {}
    tailscaleWS.onclose = () => {
      if (tailscaleReconnectTimer) clearTimeout(tailscaleReconnectTimer)
      tailscaleReconnectTimer = setTimeout(connectTailscaleWS, 2000)
    }
  } catch (_) {}
}

const showFilters = ref(false)
const realtimeEnabled = ref(true)
const filterCritical = ref(true)
const filterHigh = ref(true)
const filterMedium = ref(true)
const filterLow = ref(true)
const filterShowFlows = ref(true)

// Zoom functionality
const currentZoom = ref(1)
const minZoom = ref(0.5)
const maxZoom = ref(4)
const zoomStep = ref(0.5)

const threatData = ref([])
const attackFlows = ref([])
const recentFlows = ref([])
const liveThreatTicker = ref([])
const svg = ref(null)
const projection = ref(null)
const path = ref(null)
const updateRate = ref(5000)
const zoom = ref(null)

// World map with better country coverage
const worldData = {
  "type": "FeatureCollection",
  "features": [
    // North America
    { "type": "Feature", "properties": { "name": "Canada" }, "geometry": { "type": "Polygon", "coordinates": [[[-141, 70], [-52, 70], [-52, 41], [-95, 41], [-95, 49], [-141, 60], [-141, 70]]] } },
    { "type": "Feature", "properties": { "name": "USA" }, "geometry": { "type": "Polygon", "coordinates": [[[-125, 49], [-125, 25], [-66, 24], [-66, 49], [-125, 49]]] } },
    { "type": "Feature", "properties": { "name": "Mexico" }, "geometry": { "type": "Polygon", "coordinates": [[[-117, 32], [-86, 14], [-86, 32], [-117, 32]]] } },
    // South America
    { "type": "Feature", "properties": { "name": "Brazil" }, "geometry": { "type": "Polygon", "coordinates": [[[-74, 5], [-35, 5], [-35, -33], [-74, -33], [-74, 5]]] } },
    { "type": "Feature", "properties": { "name": "Argentina" }, "geometry": { "type": "Polygon", "coordinates": [[[-73, -22], [-54, -22], [-54, -56], [-73, -56], [-73, -22]]] } },
    // Europe
    { "type": "Feature", "properties": { "name": "Russia" }, "geometry": { "type": "Polygon", "coordinates": [[[14, 70], [169, 70], [169, 41], [14, 41], [14, 70]]] } },
    { "type": "Feature", "properties": { "name": "Europe" }, "geometry": { "type": "Polygon", "coordinates": [[[-10, 71], [40, 71], [40, 35], [-10, 35], [-10, 71]]] } },
    { "type": "Feature", "properties": { "name": "Germany" }, "geometry": { "type": "Polygon", "coordinates": [[[5, 56], [16, 56], [16, 47], [5, 47], [5, 56]]] } },
    { "type": "Feature", "properties": { "name": "UK" }, "geometry": { "type": "Polygon", "coordinates": [[[-8, 59], [2, 59], [2, 50], [-8, 50], [-8, 59]]] } },
    { "type": "Feature", "properties": { "name": "France" }, "geometry": { "type": "Polygon", "coordinates": [[[-5, 51], [8, 51], [8, 42], [-5, 42], [-5, 51]]] } },
    // Middle East & Asia
    { "type": "Feature", "properties": { "name": "Middle East" }, "geometry": { "type": "Polygon", "coordinates": [[[29, 37], [60, 37], [60, 12], [29, 12], [29, 37]]] } },
    { "type": "Feature", "properties": { "name": "China" }, "geometry": { "type": "Polygon", "coordinates": [[[73, 54], [135, 54], [135, 18], [73, 18], [73, 54]]] } },
    { "type": "Feature", "properties": { "name": "India" }, "geometry": { "type": "Polygon", "coordinates": [[[68, 36], [97, 36], [97, 8], [68, 8], [68, 36]]] } },
    { "type": "Feature", "properties": { "name": "Southeast Asia" }, "geometry": { "type": "Polygon", "coordinates": [[[92, 21], [141, 21], [141, -10], [92, -10], [92, 21]]] } },
    { "type": "Feature", "properties": { "name": "Japan" }, "geometry": { "type": "Polygon", "coordinates": [[[128, 46], [146, 46], [146, 30], [128, 30], [128, 46]]] } },
    // Africa
    { "type": "Feature", "properties": { "name": "Africa" }, "geometry": { "type": "Polygon", "coordinates": [[[-17, 38], [52, 38], [52, -35], [-17, -35], [-17, 38]]] } },
    { "type": "Feature", "properties": { "name": "South Africa" }, "geometry": { "type": "Polygon", "coordinates": [[[16, -22], [33, -22], [33, -47], [16, -47], [16, -22]]] } },
    // Oceania
    { "type": "Feature", "properties": { "name": "Australia" }, "geometry": { "type": "Polygon", "coordinates": [[[113, -10], [154, -10], [154, -44], [113, -44], [113, -10]]] } },
    { "type": "Feature", "properties": { "name": "New Zealand" }, "geometry": { "type": "Polygon", "coordinates": [[[166, -34], [179, -34], [179, -47], [166, -47], [166, -34]]] } }
  ]
}

// Country coordinates for threat markers
const countryCoordinates = {
  'India': { lat: 20.5937, lon: 78.9629 },
  'USA': { lat: 37.0902, lon: -95.7129 },
  'China': { lat: 35.8617, lon: 104.1954 },
  'Germany': { lat: 51.1657, lon: 10.4515 },
  'Japan': { lat: 36.2048, lon: 138.2529 },
  'UK': { lat: 55.3781, lon: -3.4360 },
  'Russia': { lat: 61.5240, lon: 105.3188 },
  'Brazil': { lat: -14.2350, lon: -51.9253 },
  'Australia': { lat: -25.2744, lon: 133.7751 },
  'Canada': { lat: 56.1304, lon: -106.3468 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Kolkata': { lat: 22.5726, lon: 88.3639 }
}

const threatStats = computed(() => {
  const filtered = threatData.value.filter(t => shouldShowThreat(t))
  const countries = new Set(filtered.map(t => t.country))
  
  return {
    critical: filtered.filter(t => t.severity === 'Critical').length,
    high: filtered.filter(t => t.severity === 'High').length,
    medium: filtered.filter(t => t.severity === 'Medium').length,
    low: filtered.filter(t => t.severity === 'Low').length,
    total: filtered.length,
    countries: countries.size
  }
})

const getSeverityColor = (severity) => {
  if (severity === 'Critical') return 'text-red-400'
  if (severity === 'High') return 'text-orange-400'
  if (severity === 'Medium') return 'text-yellow-400'
  return 'text-cyan-400'
}

const getThreatColor = (severity) => {
  if (severity === 'Critical') return '#ff2d78'
  if (severity === 'High') return '#ff8b5e'
  if (severity === 'Medium') return '#ffd700'
  return '#00e1ff'
}

const getThreatTickerClass = (severity) => {
  const baseClass = 'border-l-4'
  if (severity === 'Critical') return `${baseClass} bg-red-500/10 border-red-500 text-red-400`
  if (severity === 'High') return `${baseClass} bg-orange-500/10 border-orange-500 text-orange-400`
  if (severity === 'Medium') return `${baseClass} bg-yellow-500/10 border-yellow-500 text-yellow-400`
  return `${baseClass} bg-cyan-500/10 border-cyan-500 text-cyan-400`
}

const initD3Map = () => {
  const container = mapContainer.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight

  d3.select(container).selectAll("*").remove()

  svg.value = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%)")

  // Create zoom behavior
  zoom.value = d3.zoom()
    .scaleExtent([minZoom.value, maxZoom.value])
    .on("zoom", (event) => {
      currentZoom.value = event.transform.k
      svg.value.select(".map-group").attr("transform", event.transform)
    })

  // Apply zoom behavior to SVG with mouse wheel support
  svg.value.call(zoom.value)
  
  // Add mouse wheel zoom support
  svg.value.on("wheel", (event) => {
    event.preventDefault()
    const delta = event.deltaY
    const scaleFactor = delta > 0 ? 0.9 : 1.1
    
    if ((delta > 0 && currentZoom.value > minZoom.value) || 
        (delta < 0 && currentZoom.value < maxZoom.value)) {
      svg.value.transition().duration(100).call(
        zoom.value.scaleBy,
        scaleFactor
      )
    }
  })

  // Create a group for all map elements that will be zoomed
  const mapGroup = svg.value.append("g").attr("class", "map-group")

  projection.value = d3.geoNaturalEarth1()
    .scale(width / 6.5)
    .translate([width / 2, height / 2])

  path.value = d3.geoPath().projection(projection.value)

  // Add background ocean color
  mapGroup.insert("rect", ":first-child")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "url(#ocean-gradient)")

  // Add gradient definition for water
  const defs = svg.value.append("defs")
  const oceanGradient = defs.append("linearGradient")
    .attr("id", "ocean-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "100%")
  
  oceanGradient.append("stop")
    .attr("offset", "0%")
    .style("stop-color", "#0f172a")
    .style("stop-opacity", 1)
  
  oceanGradient.append("stop")
    .attr("offset", "100%")
    .style("stop-color", "#1a1f3a")
    .style("stop-opacity", 1)

  // Add graticule (grid lines)
  const graticule = d3.geoGraticule()
  mapGroup.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path.value)
    .style("fill", "none")
    .style("stroke", "#00e1ff")
    .style("stroke-width", 0.5)
    .style("opacity", 0.15)

  // Draw country borders with enhanced visibility
  mapGroup.selectAll(".country")
    .data(worldData.features)
    .enter().append("path")
    .attr("class", "country")
    .attr("d", path.value)
    .style("fill", "#1a5f4a")
    .style("stroke", "#00e1ff")
    .style("stroke-width", 1.5)
    .style("opacity", 0.7)
    .style("cursor", "pointer")
    .on("mouseover", function() {
      d3.select(this)
        .style("fill", "#2a8f7a")
        .style("stroke-width", 2)
        .style("opacity", 0.95)
        .style("filter", "drop-shadow(0 0 5px rgba(0, 225, 255, 0.5))")
    })
    .on("mouseout", function() {
      d3.select(this)
        .style("fill", "#1a5f4a")
        .style("stroke-width", 1.5)
        .style("opacity", 0.7)
        .style("filter", "none")
    })

  // Add Mumbai-Kolkata critical threat flow
  addMumbaiKolkataThreatFlow()

  drawThreats()
}

const drawThreats = () => {
  if (!svg.value || !projection.value) return

  const mapGroup = svg.value.select(".map-group")
  mapGroup.selectAll(".threat-marker").remove()
  mapGroup.selectAll(".attack-flow").remove()

  // Draw attack flows
  if (filterShowFlows.value) {
    attackFlows.value.forEach((flow) => {
      const source = projection.value([flow.fromLon, flow.fromLat])
      const target = projection.value([flow.toLon, flow.toLat])

      if (source && target) {
        const dx = target[0] - source[0]
        const dy = target[1] - source[1]
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.3

        const pathData = `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]}`

        mapGroup.append("path")
          .attr("class", "attack-flow")
          .attr("d", pathData)
          .style("fill", "none")
          .style("stroke", getThreatColor(flow.severity))
          .style("stroke-width", 2)
          .style("opacity", 0.6)
          .style("animation", `attackPulse 2s infinite`)

        // Add arrow marker definition
        if (svg.value.selectAll("defs").empty()) {
          const defs = svg.value.append("defs")
          defs.append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 8)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .style("fill", getThreatColor(flow.severity))
        }
      }
    })
  }

  // Draw threat markers
  threatData.value.forEach(threat => {
    if (!shouldShowThreat(threat)) return

    const coords = projection.value([threat.lon, threat.lat])
    if (coords) {
      const marker = mapGroup.append("g")
        .attr("class", "threat-marker")
        .attr("transform", `translate(${coords[0]}, ${coords[1]})`)

      // Glow effect
      marker.append("circle")
        .attr("r", getThreatSize(threat.count) * 2)
        .style("fill", getThreatColor(threat.severity))
        .style("opacity", 0.2)

      // Main marker
      marker.append("circle")
        .attr("r", getThreatSize(threat.count))
        .style("fill", getThreatColor(threat.severity))
        .style("stroke", "#ffffff")
        .style("stroke-width", 1.5)
        .style("opacity", 0.9)
        .style("cursor", "pointer")

      // Pulse animation for critical threats
      if (threat.severity === 'Critical') {
        marker.append("circle")
          .attr("r", getThreatSize(threat.count))
          .style("fill", "none")
          .style("stroke", getThreatColor(threat.severity))
          .style("stroke-width", 1)
          .style("opacity", 0.8)
          .transition()
          .duration(1500)
          .ease(d3.easeLinear)
          .attr("r", getThreatSize(threat.count) * 2.5)
          .style("opacity", 0)
          .on("end", function() {
            d3.select(this).remove()
          })
      }
    }
  })
}

const getThreatSize = (count) => {
  return Math.min(12, 4 + Math.sqrt(count) * 0.5)
}

const shouldShowThreat = (threat) => {
  if (threat.severity === 'Critical' && !filterCritical.value) return false
  if (threat.severity === 'High' && !filterHigh.value) return false
  if (threat.severity === 'Medium' && !filterMedium.value) return false
  if (threat.severity === 'Low' && !filterLow.value) return false
  return true
}

const fetchThreatData = async () => {
  try {
    const geoData = apiStore.geoData || []

    threatData.value = geoData.map(item => {
      const coords = countryCoordinates[item.country] || { lat: 0, lon: 0 }
      return {
        ...item,
        lat: coords.lat,
        lon: coords.lon,
        severity: getSeverityFromCount(item.count),
        count: item.count || 0
      }
    })
    // Do not generate any sample data; overlays are updated elsewhere from backend
    // Stats/legend derive from threatData (geoData)
    
    nextTick(() => {})
  } catch (error) {
    console.error('Error fetching threat data:', error)
  }
}

const generateAttackFlows = () => {
  const flows = []
  const threats = threatData.value.slice(0, 8)

  for (let i = 0; i < threats.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 2, threats.length); j++) {
      const from = threats[i]
      const to = threats[j]

      flows.push({
        fromLat: from.lat,
        fromLon: from.lon,
        toLat: to.lat,
        toLon: to.lon,
        severity: from.severity,
        source: from.country,
        target: to.country
      })
    }
  }

  attackFlows.value = flows
}

const generateRecentFlows = () => {
  const flows = []
  const now = new Date()

  for (let i = 0; i < 5; i++) {
    const time = new Date(now.getTime() - i * 12000)
    const sourceCountry = Object.keys(countryCoordinates)[Math.floor(Math.random() * Object.keys(countryCoordinates).length)]
    const targetCountry = Object.keys(countryCoordinates)[Math.floor(Math.random() * Object.keys(countryCoordinates).length)]
    const severities = ['Critical', 'High', 'Medium', 'Low']
    const severity = severities[Math.floor(Math.random() * severities.length)]

    flows.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source: sourceCountry,
      target: targetCountry,
      severity
    })
  }

  recentFlows.value = flows
}

const generateLiveTicker = () => {
  const ticker = []
  const now = new Date()

  for (let i = 0; i < 8; i++) {
    const time = new Date(now.getTime() - i * 3000)
    const sourceCountry = Object.keys(countryCoordinates)[Math.floor(Math.random() * Object.keys(countryCoordinates).length)]
    const targetCountry = Object.keys(countryCoordinates)[Math.floor(Math.random() * Object.keys(countryCoordinates).length)]
    const severities = ['Critical', 'High', 'Medium', 'Low']
    const severity = severities[Math.floor(Math.random() * severities.length)]

    ticker.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source: sourceCountry,
      target: targetCountry,
      severity
    })
  }

  liveThreatTicker.value = ticker
}

const getSeverityFromCount = (count) => {
  if (count > 100) return 'Critical'
  if (count > 50) return 'High'
  if (count > 20) return 'Medium'
  return 'Low'
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const toggleRealtime = () => {
  realtimeEnabled.value = !realtimeEnabled.value
}

const resetView = () => {
  currentZoom.value = 1
  if (zoom.value && svg.value) {
    svg.value.transition().duration(750).call(
      zoom.value.transform,
      d3.zoomIdentity
    )
  }
  initD3Map()
}

const zoomIn = () => {
  if (currentZoom.value < maxZoom.value && zoom.value && svg.value) {
    svg.value.transition().duration(300).call(
      zoom.value.scaleBy,
      1 + zoomStep.value
    )
  }
}

const zoomOut = () => {
  if (currentZoom.value > minZoom.value && zoom.value && svg.value) {
    svg.value.transition().duration(300).call(
      zoom.value.scaleBy,
      1 / (1 + zoomStep.value)
    )
  }
}

const addMumbaiKolkataThreatFlow = () => {
  // Add Mumbai and Kolkata as threat markers
  const mumbaiThreat = {
    country: 'Mumbai',
    lat: 19.0760,
    lon: 72.8777,
    severity: 'Critical',
    count: 150
  }
  
  const kolkataThreat = {
    country: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    severity: 'Critical',
    count: 120
  }

  // Add to threat data if not already present
  const existingMumbai = threatData.value.find(t => t.country === 'Mumbai')
  const existingKolkata = threatData.value.find(t => t.country === 'Kolkata')
  
  if (!existingMumbai) {
    threatData.value.push(mumbaiThreat)
  }
  if (!existingKolkata) {
    threatData.value.push(kolkataThreat)
  }

  // Add Mumbai-Kolkata attack flow
  const mumbaiKolkataFlow = {
    fromLat: 19.0760,
    fromLon: 72.8777,
    toLat: 22.5726,
    toLon: 88.3639,
    severity: 'Critical',
    source: 'Mumbai',
    target: 'Kolkata'
  }

  // Add to attack flows if not already present
  const existingFlow = attackFlows.value.find(f => 
    f.source === 'Mumbai' && f.target === 'Kolkata'
  )
  
  if (!existingFlow) {
    attackFlows.value.push(mumbaiKolkataFlow)
  }

  // Add to live ticker and recent flows
  const now = new Date()
  const mumbaiKolkataTickerEntry = {
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    source: 'Mumbai',
    target: 'Kolkata',
    severity: 'Critical'
  }

  // Add to ticker if not already present
  const existingTickerEntry = liveThreatTicker.value.find(t => 
    t.source === 'Mumbai' && t.target === 'Kolkata'
  )
  
  if (!existingTickerEntry) {
    liveThreatTicker.value.unshift(mumbaiKolkataTickerEntry)
    liveThreatTicker.value = liveThreatTicker.value.slice(0, 8)
  }

  // Add to recent flows if not already present
  const existingRecentFlow = recentFlows.value.find(f => 
    f.source === 'Mumbai' && f.target === 'Kolkata'
  )
  
  if (!existingRecentFlow) {
    recentFlows.value.unshift(mumbaiKolkataTickerEntry)
    recentFlows.value = recentFlows.value.slice(0, 5)
  }

  // Also plot on Raven map
  plotRaven('19.0760,72.8777', '22.5726,88.3639', 1500)
}

let refreshInterval = null
let unsubscribeThreat = null

onMounted(async () => {
  if (apiStore.geoData.length === 0) {
    await apiStore.fetchGeoData('24h')
  }

  await nextTick()
  const iframe = iframeRef.value
  if (iframe) {
    iframe.addEventListener('load', () => {
      iframeLoaded = true
      if (pendingPlots.length) {
        let delay = 0
        pendingPlots.slice(0, 200).forEach(item => {
          setTimeout(() => {
            try {
              iframeRef.value?.contentWindow?.postMessage({ type: 'raven_plot', from: item.from, to: item.to, timeout: item.timeout }, getTargetOrigin())
            } catch (_) {}
          }, delay)
          delay += 100
        })
        pendingPlots = []
      }
    })
  }
  // no-op for D3, but keep the data/overlay logic
  initD3Map()
  fetchThreatData()
  
  // Add Mumbai-Kolkata threat flow after initialization
  setTimeout(() => {
    addMumbaiKolkataThreatFlow()
  }, 1000)

  // Subscribe to real-time threats
  unsubscribeThreat = subscribeTothreats((threatData) => {
    if (realtimeEnabled.value) {
      // Add to live ticker only if explicit fields exist
      if (threatData?.source || threatData?.target) {
        liveThreatTicker.value.unshift({
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          source: threatData.source || 'Unknown',
          target: threatData.target || 'Unknown',
          severity: threatData.severity || 'Low'
        })
        liveThreatTicker.value = liveThreatTicker.value.slice(0, 8)
      }
      // Also mirror to Raven if explicit fields exist
      if (threatData.source && threatData.target) {
        plotRaven(threatData.source, threatData.target, 900)
      }
    }
  })

  // Try to connect to WebSocket (optional - fallback to polling)
  try {
    await connectThreatWS()
  } catch (err) {
    console.log('WebSocket not available, using polling mode')
  }
  // Direct tailscale stream for Raven plotting
  connectTailscaleWS()
  // Seed flows so the map animates from existing data
  await seedFromAPILogRecent()

  // Auto-refresh every 5 seconds
  refreshInterval = setInterval(() => {
    if (realtimeEnabled.value) {
      fetchThreatData()
    }
  }, updateRate.value)

  // Handle window resize
  window.addEventListener('resize', () => {
    setTimeout(initD3Map, 100)
  })
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (unsubscribeThreat) {
    unsubscribeThreat()
  }
  disconnectThreatWS()
  if (tailscaleWS) { try { tailscaleWS.close() } catch (_) {} tailscaleWS = null }
  if (tailscaleReconnectTimer) { clearTimeout(tailscaleReconnectTimer); tailscaleReconnectTimer = null }
  window.removeEventListener('resize', initD3Map)
})
</script>

<style scoped>
.threat-marker {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.threat-marker:hover {
  transform: scale(1.3);
}

.country {
  cursor: pointer;
  transition: fill 0.3s ease;
}

.country:hover {
  fill: #334155;
}

.attack-flow {
  pointer-events: none;
}

@keyframes attackPulse {
  0%, 100% {
    opacity: 0.6;
    stroke-width: 2px;
  }
  50% {
    opacity: 0.9;
    stroke-width: 3px;
  }
}

@keyframes scroll-up {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100%);
  }
}

.animate-scroll-up {
  animation: scroll-up 15s linear infinite;
}
</style>