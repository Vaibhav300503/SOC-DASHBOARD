<template>
  <DashboardCard title="Global Threat Map" subtitle="Real-time threat visualization with attack flows" size="full">
    <template #header-action>
      <div class="flex gap-2">
        <button
          @click="toggleAttackTypes"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Toggle attack type filters"
        >
          <i class="fas fa-filter mr-1"></i>Filters
        </button>
        <button
          @click="resetView"
          class="px-3 py-1 text-xs rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
          title="Reset view"
        >
          <i class="fas fa-redo mr-1"></i>Reset
        </button>
      </div>
    </template>

    <!-- Attack Type Filters -->
    <div v-if="showAttackFilters" class="mb-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="attackFilters.webAttackers" type="checkbox" class="rounded" />
          <span>Web Attackers</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="attackFilters.ddosAttackers" type="checkbox" class="rounded" />
          <span>DDoS Attackers</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="attackFilters.intruders" type="checkbox" class="rounded" />
          <span>Intruders</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="attackFilters.scanners" type="checkbox" class="rounded" />
          <span>Scanners</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="attackFilters.anonymizers" type="checkbox" class="rounded" />
          <span>Anonymizers</span>
        </label>
      </div>
    </div>

    <!-- Globe Container -->
    <div class="relative w-full h-96 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/30">
      <canvas ref="globeCanvas" class="w-full h-full"></canvas>

      <!-- Threat Indicators Overlay -->
      <div class="absolute inset-0 pointer-events-none">
        <!-- Attack flows visualization -->
        <svg class="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="attackFlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: #00E1FF; stop-opacity: 0.8" />
              <stop offset="100%" style="stop-color: #FF2D78; stop-opacity: 0.2" />
            </linearGradient>
          </defs>
          <!-- Attack flow lines will be drawn here -->
        </svg>
      </div>

      <!-- Top Left: Attack Types Legend -->
      <div class="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 max-w-xs">
        <div class="text-sm font-semibold text-slate-200 mb-3">ATTACK TYPES</div>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span class="text-xs text-slate-400">Web Attackers</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-orange-500"></div>
            <span class="text-xs text-slate-400">DDoS Attackers</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-purple-500"></div>
            <span class="text-xs text-slate-400">Intruders</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <span class="text-xs text-slate-400">Scanners</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-pink-500"></div>
            <span class="text-xs text-slate-400">Anonymizers</span>
          </div>
        </div>
      </div>

      <!-- Top Right: Status Indicators -->
      <div class="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 space-y-2">
        <div class="flex items-center justify-between gap-4">
          <span class="text-xs text-slate-400">UNDER ATTACK</span>
          <span class="text-sm font-bold text-red-400">{{ underAttackCount }}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span class="text-xs text-slate-400">ACTIVE THREATS</span>
          <span class="text-sm font-bold text-orange-400">{{ activeThreatCount }}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span class="text-xs text-slate-400">TOTAL EVENTS</span>
          <span class="text-sm font-bold text-cyan-400">{{ totalEventCount }}</span>
        </div>
      </div>

      <!-- Bottom: Timeline -->
      <div class="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>0:50</span>
          <span>1:10</span>
          <span class="text-cyan-400 font-semibold">NOW</span>
          <button class="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 transition-colors">
            <i class="fas fa-compress mr-1"></i>COLLAPSE
          </button>
        </div>
      </div>
    </div>

    <!-- Threat Statistics -->
    <template #footer>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="text-center">
          <div class="text-lg font-bold text-red-400">{{ threatStats.critical }}</div>
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
          <div class="text-lg font-bold text-emerald-400">{{ threatStats.low }}</div>
          <div class="text-xs text-slate-500">Low</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-cyan-400">{{ threatStats.total }}</div>
          <div class="text-xs text-slate-500">Total</div>
        </div>
      </div>
    </template>
  </DashboardCard>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import DashboardCard from '../common/DashboardCard.vue'

const apiStore = useAPIStore()
const globeCanvas = ref(null)
const showAttackFilters = ref(false)

const attackFilters = ref({
  webAttackers: true,
  ddosAttackers: true,
  intruders: true,
  scanners: true,
  anonymizers: true
})

const threatData = ref([])
const attackFlows = ref([])

const underAttackCount = computed(() => {
  return threatData.value.filter(t => t.severity === 'Critical').length
})

const activeThreatCount = computed(() => {
  return threatData.value.filter(t => t.severity === 'High').length
})

const totalEventCount = computed(() => {
  return threatData.value.reduce((sum, t) => sum + (t.count || 0), 0)
})

const threatStats = computed(() => ({
  critical: threatData.value.filter(t => t.severity === 'Critical').length,
  high: threatData.value.filter(t => t.severity === 'High').length,
  medium: threatData.value.filter(t => t.severity === 'Medium').length,
  low: threatData.value.filter(t => t.severity === 'Low').length,
  total: threatData.value.length
}))

const initGlobe = () => {
  const canvas = globeCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  canvas.width = width
  canvas.height = height

  // Draw globe background
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height))
  gradient.addColorStop(0, '#1a1f3a')
  gradient.addColorStop(1, '#0f172a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Draw globe circle
  ctx.strokeStyle = 'rgba(0, 225, 255, 0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 2.5, 0, Math.PI * 2)
  ctx.stroke()

  // Draw grid lines
  ctx.strokeStyle = 'rgba(0, 225, 255, 0.1)'
  ctx.lineWidth = 1

  // Latitude lines
  for (let i = -80; i <= 80; i += 20) {
    const y = (height / 2) + (i / 90) * (Math.min(width, height) / 2.5)
    ctx.beginPath()
    ctx.moveTo(width / 2 - Math.min(width, height) / 2.5, y)
    ctx.lineTo(width / 2 + Math.min(width, height) / 2.5, y)
    ctx.stroke()
  }

  // Longitude lines
  for (let i = -180; i <= 180; i += 30) {
    const angle = (i * Math.PI) / 180
    const radius = Math.min(width, height) / 2.5
    const x1 = width / 2 + Math.cos(angle) * radius
    const y1 = height / 2 + Math.sin(angle) * radius * 0.5
    const x2 = width / 2 + Math.cos(angle + Math.PI) * radius
    const y2 = height / 2 + Math.sin(angle + Math.PI) * radius * 0.5
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // Draw threat markers
  drawThreatMarkers(ctx, width, height)
}

const drawThreatMarkers = (ctx, width, height) => {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2.5

  threatData.value.forEach(threat => {
    // Convert lat/lon to canvas coordinates
    const lat = threat.lat || 0
    const lon = threat.lon || 0

    const x = centerX + (lon / 180) * radius
    const y = centerY - (lat / 90) * radius * 0.5

    // Draw threat marker
    const color = getThreatColor(threat.severity)
    const size = getThreatSize(threat.count)

    // Glow effect
    ctx.fillStyle = color.replace(')', ', 0.3)')
    ctx.beginPath()
    ctx.arc(x, y, size * 2, 0, Math.PI * 2)
    ctx.fill()

    // Main marker
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.stroke()
  })

  // Draw attack flows
  drawAttackFlows(ctx, centerX, centerY, radius)
}

const drawAttackFlows = (ctx, centerX, centerY, radius) => {
  attackFlows.value.forEach(flow => {
    const fromX = centerX + (flow.fromLon / 180) * radius
    const fromY = centerY - (flow.fromLat / 90) * radius * 0.5
    const toX = centerX + (flow.toLon / 180) * radius
    const toY = centerY - (flow.toLat / 90) * radius * 0.5

    // Draw curved line
    ctx.strokeStyle = flow.color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)

    // Quadratic curve
    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2
    const offsetX = (toY - fromY) * 0.1
    const offsetY = (fromX - toX) * 0.1

    ctx.quadraticCurveTo(midX + offsetX, midY + offsetY, toX, toY)
    ctx.stroke()
    ctx.globalAlpha = 1
  })
}

const getThreatColor = (severity) => {
  const colors = {
    'Critical': 'rgba(255, 45, 120, 0.8)',
    'High': 'rgba(255, 139, 94, 0.8)',
    'Medium': 'rgba(255, 215, 0, 0.8)',
    'Low': 'rgba(5, 255, 161, 0.8)'
  }
  return colors[severity] || 'rgba(0, 225, 255, 0.8)'
}

const getThreatSize = (count) => {
  return Math.min(12, 4 + Math.sqrt(count) * 0.5)
}

const fetchThreatData = async () => {
  try {
    // Fetch geo data from API store
    const geoData = apiStore.geoData || []

    // Transform to threat data
    threatData.value = geoData.map(item => ({
      ...item,
      lat: item.lat || 0,
      lon: item.lon || 0,
      severity: getSeverityFromCount(item.count),
      count: item.count || 0
    }))

    // Generate attack flows
    generateAttackFlows()

    // Redraw globe
    initGlobe()
  } catch (error) {
    console.error('Error fetching threat data:', error)
  }
}

const generateAttackFlows = () => {
  // Create attack flows between threat locations
  const flows = []
  const threats = threatData.value.slice(0, 10)

  for (let i = 0; i < threats.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 3, threats.length); j++) {
      const from = threats[i]
      const to = threats[j]

      flows.push({
        fromLat: from.lat,
        fromLon: from.lon,
        toLat: to.lat,
        toLon: to.lon,
        color: getThreatColor(from.severity),
        severity: from.severity
      })
    }
  }

  attackFlows.value = flows
}

const getSeverityFromCount = (count) => {
  if (count > 100) return 'Critical'
  if (count > 50) return 'High'
  if (count > 20) return 'Medium'
  return 'Low'
}

const toggleAttackTypes = () => {
  showAttackFilters.value = !showAttackFilters.value
}

const resetView = () => {
  initGlobe()
}

onMounted(async () => {
  // Wait for API store to load data
  if (apiStore.geoData.length === 0) {
    await apiStore.fetchGeoData('24h')
  }

  fetchThreatData()

  // Redraw on window resize
  window.addEventListener('resize', initGlobe)
})
</script>

<style scoped>
canvas {
  display: block;
  background: linear-gradient(135deg, #1a1f3a 0%, #0f172a 100%);
}
</style>
