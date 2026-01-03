<template>
  <DashboardCard title="Live Cyber Attack Threat Map" subtitle="Real-time global threat detection with source-to-destination attack flows" size="full">
    <template #header-action>
      <div class="flex gap-2">
        <button
          @click="toggleFilters"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Toggle filters"
        >
          <i class="fas fa-filter mr-1"></i>Filter
        </button>
        <button
          @click="toggleRealtime"
          :class="[
            'px-3 py-1 text-xs rounded-lg transition-colors',
            realtimeEnabled ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-700/50 text-slate-400'
          ]"
          title="Toggle real-time updates"
        >
          <i :class="realtimeEnabled ? 'fas fa-circle-notch fa-spin' : 'fas fa-pause'" class="mr-1"></i>
          {{ realtimeEnabled ? 'Live' : 'Paused' }}
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
      </div>
    </div>

    <!-- Map Container -->
    <div class="relative w-full h-[600px] bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/30">
      <!-- D3.js SVG Map Container -->
      <div ref="mapContainer" class="w-full h-full"></div>

      <!-- Top Left: Stats -->
      <div class="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 space-y-3 z-10">
        <div class="text-sm font-semibold text-slate-200">ATTACKS TODAY</div>
        <div class="text-2xl font-black text-neon-red">{{ totalAttacksToday.toLocaleString() }}</div>
        <div class="text-xs text-slate-400 mt-2">ATTACKS YESTERDAY</div>
        <div class="text-lg font-bold text-slate-300">{{ totalAttacksYesterday.toLocaleString() }}</div>
        <div class="text-xs text-slate-500 mt-2">TOP TARGETS BY COUNTRY</div>
        <div class="space-y-1 mt-2">
          <div v-for="(country, idx) in topTargets.slice(0, 3)" :key="idx" class="flex justify-between text-xs">
            <span class="text-slate-400">{{ country.name }}</span>
            <span class="text-slate-300 font-semibold">{{ country.count }}</span>
          </div>
        </div>
      </div>

      <!-- Top Right: Legend -->
      <div class="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 space-y-2 z-10">
        <div class="text-sm font-semibold text-slate-200 mb-3">THREAT LEVEL</div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span class="text-xs text-slate-400">Critical</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-orange-500"></div>
          <span class="text-xs text-slate-400">High</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span class="text-xs text-slate-400">Medium</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-cyan-500"></div>
          <span class="text-xs text-slate-400">Low</span>
        </div>
      </div>

      <!-- Bottom: Attack Flows Table -->
      <div class="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 z-10 max-h-24 overflow-y-auto">
        <div class="text-xs font-semibold text-slate-200 mb-2">RECENT ATTACK FLOWS</div>
        <div class="space-y-1">
          <div v-for="(flow, idx) in recentFlows.slice(0, 3)" :key="idx" class="text-xs text-slate-400 flex justify-between">
            <span>{{ flow.time }}</span>
            <span class="text-slate-500">{{ flow.source }} → {{ flow.target }}</span>
            <span :class="['font-semibold', getSeverityColor(flow.severity)]">{{ flow.severity }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <template #footer>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="text-center">
          <div class="text-lg font-bold text-red-400">{{ stats.critical }}</div>
          <div class="text-xs text-slate-500">Critical</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-orange-400">{{ stats.high }}</div>
          <div class="text-xs text-slate-500">High</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-yellow-400">{{ stats.medium }}</div>
          <div class="text-xs text-slate-500">Medium</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-cyan-400">{{ stats.low }}</div>
          <div class="text-xs text-slate-500">Low</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-slate-300">{{ stats.total }}</div>
          <div class="text-xs text-slate-500">Total</div>
        </div>
      </div>
    </template>
  </DashboardCard>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import DashboardCard from '../common/DashboardCard.vue'
import * as d3 from 'd3'

const apiStore = useAPIStore()
const mapContainer = ref(null)

const showFilters = ref(false)
const realtimeEnabled = ref(true)
const filterCritical = ref(true)
const filterHigh = ref(true)
const filterMedium = ref(true)
const filterLow = ref(true)

const threatData = ref([])
const attackFlows = ref([])
const recentFlows = ref([])
const svg = ref(null)
const projection = ref(null)
const path = ref(null)

const totalAttacksToday = ref(3344919)
const totalAttacksYesterday = ref(12281688)

// World map data (more detailed GeoJSON for major countries and continents)
const worldData = {
  "type": "FeatureCollection",
  "features": [
    // North America
    {
      "type": "Feature",
      "properties": { "name": "United States" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-125, 49], [-125, 45], [-124, 40], [-120, 34], [-117, 32], [-108, 31], 
          [-108, 25], [-93, 25], [-82, 24], [-82, 31], [-75, 35], [-75, 39], 
          [-70, 41], [-70, 45], [-67, 47], [-67, 49], [-125, 49]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Canada" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-140, 70], [-140, 60], [-130, 60], [-125, 49], [-67, 49], [-67, 60], 
          [-63, 60], [-63, 70], [-140, 70]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Mexico" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-117, 32], [-108, 31], [-108, 25], [-99, 25], [-99, 20], [-87, 20], 
          [-87, 16], [-92, 14], [-117, 32]
        ]]
      }
    },
    // South America
    {
      "type": "Feature",
      "properties": { "name": "Brazil" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-73, 5], [-60, 5], [-50, 0], [-35, -5], [-35, -20], [-40, -25], 
          [-50, -30], [-60, -30], [-70, -20], [-73, -10], [-73, 5]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Argentina" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-73, -22], [-65, -22], [-58, -27], [-58, -40], [-65, -50], [-70, -55], 
          [-73, -50], [-73, -22]
        ]]
      }
    },
    // Europe
    {
      "type": "Feature",
      "properties": { "name": "Russia" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [20, 80], [180, 80], [180, 50], [130, 50], [100, 55], [40, 55], [20, 60], [20, 80]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Germany" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [5, 55], [15, 55], [15, 47], [5, 47], [5, 55]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "France" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-5, 51], [8, 51], [8, 42], [-2, 42], [-5, 51]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "United Kingdom" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-8, 61], [2, 61], [2, 50], [-8, 50], [-8, 61]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Spain" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-10, 44], [4, 44], [4, 36], [-10, 36], [-10, 44]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Italy" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [6, 47], [19, 47], [19, 36], [12, 36], [6, 47]
        ]]
      }
    },
    // Asia
    {
      "type": "Feature", 
      "properties": { "name": "China" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [75, 50], [135, 50], [135, 18], [100, 18], [90, 28], [75, 35], [75, 50]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "India" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [68, 37], [97, 37], [97, 8], [77, 8], [68, 20], [68, 37]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Japan" },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[129, 46], [146, 46], [146, 30], [129, 30], [129, 46]]],
          [[[139, 42], [146, 42], [146, 35], [139, 35], [139, 42]]]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Indonesia" },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[95, 6], [141, 6], [141, -11], [95, -11], [95, 6]]]
        ]
      }
    },
    // Africa
    {
      "type": "Feature",
      "properties": { "name": "Algeria" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-9, 37], [12, 37], [12, 19], [-9, 19], [-9, 37]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Libya" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [10, 33], [25, 33], [25, 20], [10, 20], [10, 33]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Egypt" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [25, 32], [35, 32], [35, 22], [25, 22], [25, 32]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "South Africa" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [16, -22], [33, -22], [33, -35], [16, -35], [16, -22]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Nigeria" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [3, 14], [15, 14], [15, 4], [3, 4], [3, 14]
        ]]
      }
    },
    // Oceania
    {
      "type": "Feature",
      "properties": { "name": "Australia" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [113, -10], [154, -10], [154, -44], [113, -44], [113, -10]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "New Zealand" },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[166, -34], [179, -34], [179, -47], [166, -47], [166, -34]]]
        ]
      }
    }
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
  'Philippines': { lat: 12.8797, lon: 121.7740 },
  'Singapore': { lat: 1.3521, lon: 103.8198 }
}

const topTargets = computed(() => {
  const targets = {}
  threatData.value.forEach(threat => {
    targets[threat.country] = (targets[threat.country] || 0) + (threat.count || 0)
  })
  return Object.entries(targets)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const stats = computed(() => {
  const filtered = threatData.value.filter(t => {
    if (t.severity === 'Critical' && !filterCritical.value) return false
    if (t.severity === 'High' && !filterHigh.value) return false
    if (t.severity === 'Medium' && !filterMedium.value) return false
    if (t.severity === 'Low' && !filterLow.value) return false
    return true
  })

  return {
    critical: filtered.filter(t => t.severity === 'Critical').length,
    high: filtered.filter(t => t.severity === 'High').length,
    medium: filtered.filter(t => t.severity === 'Medium').length,
    low: filtered.filter(t => t.severity === 'Low').length,
    total: filtered.length
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

const initD3Map = () => {
  const container = mapContainer.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight

  // Clear any existing SVG
  d3.select(container).selectAll("*").remove()

  // Create SVG
  svg.value = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%)")

  // Create projection
  projection.value = d3.geoNaturalEarth1()
    .scale(width / 6.5)
    .translate([width / 2, height / 2])

  // Create path generator
  path.value = d3.geoPath().projection(projection.value)

  // Draw countries
  svg.value.selectAll(".country")
    .data(worldData.features)
    .enter().append("path")
    .attr("class", "country")
    .attr("d", path.value)
    .style("fill", "#737373")
    .style("stroke", "#00e1ff")
    .style("stroke-width", 0.5)
    .style("opacity", 0.7)
    .on("mouseover", function(event, d) {
      d3.select(this).style("fill", "#ff726f")
    })
    .on("mouseout", function(event, d) {
      d3.select(this).style("fill", "#737373")
    })

  // Add graticule (grid lines)
  const graticule = d3.geoGraticule()
  svg.value.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path.value)
    .style("fill", "none")
    .style("stroke", "#00e1ff")
    .style("stroke-width", 0.3)
    .style("opacity", 0.1)

  drawThreats()
}

const drawThreats = () => {
  if (!svg.value || !projection.value) return

  // Remove existing threat elements
  svg.value.selectAll(".threat-marker").remove()
  svg.value.selectAll(".attack-flow").remove()

  // Draw attack flows
  attackFlows.value.forEach((flow, i) => {
    const source = projection.value([flow.fromLon, flow.fromLat])
    const target = projection.value([flow.toLon, flow.toLat])

    if (source && target) {
      // Create curved path
      const dx = target[0] - source[0]
      const dy = target[1] - source[1]
      const dr = Math.sqrt(dx * dx + dy * dy) * 0.3

      const pathData = `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]}`

      svg.value.append("path")
        .attr("class", "attack-flow")
        .attr("d", pathData)
        .style("fill", "none")
        .style("stroke", getThreatColor(flow.severity))
        .style("stroke-width", 2)
        .style("opacity", 0.6)
        .style("marker-end", "url(#arrowhead)")

      // Add arrow marker
      svg.value.append("defs").append("marker")
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
  })

  // Draw threat markers
  threatData.value.forEach(threat => {
    if (!shouldShowThreat(threat)) return

    const coords = projection.value([threat.lon, threat.lat])
    if (coords) {
      const marker = svg.value.append("g")
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

    generateAttackFlows()
    generateRecentFlows()
    
    // Redraw threats
    nextTick(() => {
      drawThreats()
    })
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
        severity: from.severity
      })
    }
  }

  attackFlows.value = flows
}

const generateRecentFlows = () => {
  const flows = []
  const now = new Date()

  for (let i = 0; i < 5; i++) {
    const time = new Date(now.getTime() - i * 60000)
    const source = Object.keys(countryCoordinates)[Math.floor(Math.random() * Object.keys(countryCoordinates).length)]
    const target = Object.keys(countryCoordinates)[Math.floor(Math.random() * Object.keys(countryCoordinates).length)]
    const severities = ['Critical', 'High', 'Medium', 'Low']
    const severity = severities[Math.floor(Math.random() * severities.length)]

    flows.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source,
      target,
      severity
    })
  }

  recentFlows.value = flows
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
  initD3Map()
}

let refreshInterval = null

onMounted(async () => {
  if (apiStore.geoData.length === 0) {
    await apiStore.fetchGeoData('24h')
  }

  await nextTick()
  initD3Map()
  fetchThreatData()

  // Refresh every 5 seconds
  refreshInterval = setInterval(() => {
    if (realtimeEnabled.value) {
      fetchThreatData()
    }
  }, 5000)

  // Handle window resize
  window.addEventListener('resize', () => {
    setTimeout(initD3Map, 100)
  })
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  window.removeEventListener('resize', initD3Map)
})
</script>

<style scoped>
.threat-marker {
  cursor: pointer;
}

.country {
  cursor: pointer;
  transition: fill 0.3s ease;
}

.attack-flow {
  pointer-events: none;
}
</style>
