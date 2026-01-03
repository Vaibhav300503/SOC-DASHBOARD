<template>
  <DashboardCard title="Global Threat Map - Real-time Detection" subtitle="3D Globe with source-to-destination attack flows" size="full">
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

      <!-- Top Left: Attack Types Legend -->
      <div class="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 max-w-xs z-10">
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
      <div class="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 space-y-2 z-10">
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
        <div class="flex items-center justify-between gap-4">
          <span class="text-xs text-slate-400">ATTACK FLOWS</span>
          <span class="text-sm font-bold text-purple-400">{{ attackFlows.length }}</span>
        </div>
      </div>

      <!-- Bottom: Timeline -->
      <div class="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 z-10">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>{{ timelineStart }}</span>
          <span>{{ timelineMiddle }}</span>
          <span class="text-cyan-400 font-semibold">NOW</span>
          <button
            @click="toggleTimeline"
            class="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 transition-colors"
          >
            <i class="fas fa-compress mr-1"></i>{{ timelineCollapsed ? 'EXPAND' : 'COLLAPSE' }}
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import DashboardCard from '../common/DashboardCard.vue'

const apiStore = useAPIStore()
const globeCanvas = ref(null)
let animationId = null

const showAttackFilters = ref(false)
const realtimeEnabled = ref(true)
const timelineCollapsed = ref(false)
const threatData = ref([])
const attackFlows = ref([])
const rotation = ref(0)

const attackFilters = ref({
  webAttackers: true,
  ddosAttackers: true,
  intruders: true,
  scanners: true,
  anonymizers: true
})

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

const timelineStart = computed(() => {
  const now = new Date()
  const start = new Date(now.getTime() - 20 * 60000)
  return start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
})

const timelineMiddle = computed(() => {
  const now = new Date()
  const middle = new Date(now.getTime() - 10 * 60000)
  return middle.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
})

const initGlobe = () => {
  const canvas = globeCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  canvas.width = width
  canvas.height = height

  const animate = () => {
    // Clear canvas with space background
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height))
    gradient.addColorStop(0, '#1a1f3a')
    gradient.addColorStop(1, '#0f172a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2.5

    // Draw 3D globe with perspective
    draw3DGlobe(ctx, centerX, centerY, radius)

    // Draw threat markers and flows
    drawThreatMarkers(ctx, centerX, centerY, radius)

    // Rotate globe
    rotation.value += 0.1

    animationId = requestAnimationFrame(animate)
  }

  animate()
}

const draw3DGlobe = (ctx, centerX, centerY, radius) => {
  // Draw globe sphere with 3D effect
  
  // Back hemisphere (darker)
  ctx.fillStyle = 'rgba(10, 20, 50, 0.6)'
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fill()

  // Front hemisphere gradient (lighter)
  const frontGradient = ctx.createRadialGradient(centerX - radius * 0.3, centerY - radius * 0.3, 0, centerX, centerY, radius)
  frontGradient.addColorStop(0, 'rgba(30, 60, 120, 0.4)')
  frontGradient.addColorStop(0.5, 'rgba(15, 40, 80, 0.3)')
  frontGradient.addColorStop(1, 'rgba(5, 15, 40, 0.2)')
  ctx.fillStyle = frontGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fill()

  // Draw rotating grid with perspective
  ctx.strokeStyle = 'rgba(0, 225, 255, 0.15)'
  ctx.lineWidth = 1

  // Latitude lines (horizontal)
  for (let lat = -80; lat <= 80; lat += 20) {
    const latRad = (lat * Math.PI) / 180
    const y = centerY + Math.sin(latRad) * radius * 0.8
    const ellipseRadius = Math.cos(latRad) * radius

    ctx.beginPath()
    ctx.ellipse(centerX, y, ellipseRadius, ellipseRadius * 0.3, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Longitude lines (vertical, rotating)
  for (let lon = -180; lon <= 180; lon += 30) {
    const lonRad = ((lon + rotation.value) * Math.PI) / 180
    const cosLon = Math.cos(lonRad)
    const sinLon = Math.sin(lonRad)

    // Only draw visible longitude lines (front hemisphere)
    if (cosLon > -0.3) {
      ctx.strokeStyle = `rgba(0, 225, 255, ${0.15 + cosLon * 0.15})`
      ctx.beginPath()

      for (let lat = -90; lat <= 90; lat += 10) {
        const latRad = (lat * Math.PI) / 180
        const x = centerX + cosLon * Math.cos(latRad) * radius
        const y = centerY + Math.sin(latRad) * radius * 0.8

        if (lat === -90) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
    }
  }

  // Draw globe outline with glow
  ctx.strokeStyle = 'rgba(0, 225, 255, 0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Add subtle shadow
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2)
  ctx.stroke()
}

const drawThreatMarkers = (ctx, centerX, centerY, radius) => {
  // Draw attack flows first (so they appear behind markers)
  attackFlows.value.forEach(flow => {
    // Convert lat/lon to 3D coordinates
    const fromLat = (flow.fromLat * Math.PI) / 180
    const fromLon = ((flow.fromLon + rotation.value) * Math.PI) / 180
    const toLat = (flow.toLat * Math.PI) / 180
    const toLon = ((flow.toLon + rotation.value) * Math.PI) / 180

    const fromX = centerX + Math.cos(fromLat) * Math.cos(fromLon) * radius
    const fromY = centerY + Math.sin(fromLat) * radius * 0.8
    const toX = centerX + Math.cos(toLat) * Math.cos(toLon) * radius
    const toY = centerY + Math.sin(toLat) * radius * 0.8

    // Only draw if both points are on front hemisphere
    if (Math.cos(fromLon) > -0.2 && Math.cos(toLon) > -0.2) {
      ctx.strokeStyle = flow.color.replace(')', ', 0.3)')
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(fromX, fromY)

      const midX = (fromX + toX) / 2
      const midY = (fromY + toY) / 2
      const offsetX = (toY - fromY) * 0.1
      const offsetY = (fromX - toX) * 0.1

      ctx.quadraticCurveTo(midX + offsetX, midY + offsetY, toX, toY)
      ctx.stroke()

      // Draw arrow at destination
      const angle = Math.atan2(toY - fromY, toX - fromX)
      const arrowSize = 8
      ctx.fillStyle = flow.color
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - arrowSize * Math.cos(angle - Math.PI / 6), toY - arrowSize * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(toX - arrowSize * Math.cos(angle + Math.PI / 6), toY - arrowSize * Math.sin(angle + Math.PI / 6))
      ctx.closePath()
      ctx.fill()
    }
  })

  // Draw threat markers
  threatData.value.forEach(threat => {
    const lat = (threat.lat * Math.PI) / 180
    const lon = ((threat.lon + rotation.value) * Math.PI) / 180

    const x = centerX + Math.cos(lat) * Math.cos(lon) * radius
    const y = centerY + Math.sin(lat) * radius * 0.8

    // Only draw if on front hemisphere
    if (Math.cos(lon) > -0.2) {
      const color = getThreatColor(threat.severity)
      const size = getThreatSize(threat.count)

      // Glow effect
      ctx.fillStyle = color.replace(')', ', 0.15)')
      ctx.beginPath()
      ctx.arc(x, y, size * 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Main marker
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Pulse effect for critical threats
      if (threat.severity === 'Critical') {
        const pulseSize = size + Math.sin(Date.now() / 300) * 2
        ctx.strokeStyle = color.replace(')', ', 0.5)')
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  })
}

const getThreatColor = (severity) => {
  const colors = {
    'Critical': 'rgba(255, 45, 120, 0.9)',
    'High': 'rgba(255, 139, 94, 0.9)',
    'Medium': 'rgba(255, 215, 0, 0.9)',
    'Low': 'rgba(5, 255, 161, 0.9)'
  }
  return colors[severity] || 'rgba(0, 225, 255, 0.9)'
}

const getThreatSize = (count) => {
  return Math.min(12, 4 + Math.sqrt(count) * 0.5)
}

const fetchThreatData = async () => {
  try {
    const geoData = apiStore.geoData || []

    threatData.value = geoData.map(item => ({
      ...item,
      lat: item.lat || 0,
      lon: item.lon || 0,
      severity: getSeverityFromCount(item.count),
      count: item.count || 0
    }))

    generateAttackFlows()
  } catch (error) {
    console.error('Error fetching threat data:', error)
  }
}

const generateAttackFlows = () => {
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

const toggleRealtime = () => {
  realtimeEnabled.value = !realtimeEnabled.value
  if (realtimeEnabled.value) {
    startRealtimeUpdates()
  } else {
    stopRealtimeUpdates()
  }
}

const toggleTimeline = () => {
  timelineCollapsed.value = !timelineCollapsed.value
}

const resetView = () => {
  rotation.value = 0
}

let realtimeInterval = null

const startRealtimeUpdates = () => {
  realtimeInterval = setInterval(() => {
    fetchThreatData()
  }, 5000)
}

const stopRealtimeUpdates = () => {
  if (realtimeInterval) {
    clearInterval(realtimeInterval)
    realtimeInterval = null
  }
}

onMounted(async () => {
  if (apiStore.geoData.length === 0) {
    await apiStore.fetchGeoData('24h')
  }

  initGlobe()
  fetchThreatData()

  if (realtimeEnabled.value) {
    startRealtimeUpdates()
  }

  window.addEventListener('resize', initGlobe)
})

onUnmounted(() => {
  stopRealtimeUpdates()
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', initGlobe)
})
</script>

<style scoped>
canvas {
  display: block;
  background: linear-gradient(135deg, #1a1f3a 0%, #0f172a 100%);
}
</style>
