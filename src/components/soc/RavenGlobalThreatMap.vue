<template>
  <DashboardCard title="Global Live Threat Map (Raven)" subtitle="Embedded Raven map with live backend events" size="full">
    <template #header-action>
      <div class="flex gap-2 flex-wrap">
        <button
          @click="addMumbaiKolkataFlow"
          class="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
          title="Add Mumbai-Kolkata critical threat flow"
        >
          <i class="fas fa-exclamation-triangle mr-1"></i>Mumbai-Kolkata Flow
        </button>
        <button
          @click="seedFromAPILogRecent"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Refresh threat data"
        >
          <i class="fas fa-sync mr-1"></i>Refresh
        </button>
      </div>
    </template>
    
    <div class="relative w-full h-[600px] bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/30">
      <iframe
        ref="iframeRef"
        :src="iframeSrc"
        frameborder="0"
        class="w-full h-full bg-slate-900"
      />
    </div>
  </DashboardCard>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import DashboardCard from '../common/DashboardCard.vue'

const iframeRef = ref(null)
const getRavenPageUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
  const url = new URL(apiBase)
  // Use localhost to avoid HTTPS upgrade issues
  return `http://localhost:3002/raven-main/src/raven.html`
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
      seedFromRecent(items)
    }
  } catch (_) {}
}
const iframeSrc = getRavenPageUrl()
let ws = null
let iframeLoaded = false
let pendingPlots = []
let reconnectTimer = null

const getWSUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
  const url = new URL(apiBase)
  // Use localhost to avoid HTTPS upgrade issues
  return `ws://localhost:3002/ws/tailscale`
}

const getTargetOrigin = () => {
  try { return new URL(iframeSrc).origin } catch { return '*' }
}

const plotAttack = (fromVal, toVal, timeout = 1000) => {
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

const seedFromRecent = (items) => {
  if (!Array.isArray(items)) return
  let delay = 300
  items.slice(0, 50).reverse().forEach((log) => {
    const fromVal = log.src || log.source_ip || log?.source?.ip || log?.raw_data?.src_ip || null
    const toVal = log.dst || log.dest_ip || log?.destination?.ip || log?.raw_data?.dst_ip || null
    setTimeout(() => plotAttack(fromVal, toVal, 800), delay)
    delay += 150
  })
}

const connectWS = async () => {
  const url = getWSUrl()
  try {
    ws = new WebSocket(url)
    ws.onopen = () => {}
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg?.type === 'tailscale_recent' && Array.isArray(msg.data)) {
          seedFromRecent(msg.data)
        } else if (msg?.type === 'tailscale_log' && msg.data) {
          const log = msg.data
          const fromVal = log.src || log.source_ip || log?.source?.ip || log?.raw_data?.src_ip || null
          const toVal = log.dst || log.dest_ip || log?.destination?.ip || log?.raw_data?.dst_ip || null
          plotAttack(fromVal, toVal, 900)
        }
      } catch (_) {}
    }
    ws.onerror = () => {}
    ws.onclose = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => {
        connectWS()
      }, 2000)
    }
  } catch (_) {}
}

const addMumbaiKolkataFlow = () => {
  // Plot Mumbai to Kolkata critical threat flow
  const mumbaiCoords = '19.0760,72.8777'
  const kolkataCoords = '22.5726,88.3639'
  
  // Plot the flow with extended timeout for visibility
  plotAttack(mumbaiCoords, kolkataCoords, 2000)
  
  // Add a few more flows for dramatic effect
  setTimeout(() => plotAttack(mumbaiCoords, kolkataCoords, 1500), 500)
  setTimeout(() => plotAttack(kolkataCoords, mumbaiCoords, 1500), 1000)
  setTimeout(() => plotAttack(mumbaiCoords, kolkataCoords, 2000), 1500)
}

onMounted(async () => {
  const iframe = iframeRef.value
  if (iframe) {
    iframe.addEventListener('load', () => {
      iframeLoaded = true
      if (pendingPlots.length) {
        let delay = 0
        pendingPlots.slice(0, 200).forEach(item => {
          setTimeout(() => {
            try {
              const target = iframeRef.value
              target?.contentWindow?.postMessage({ type: 'raven_plot', from: item.from, to: item.to, timeout: item.timeout }, getTargetOrigin())
            } catch (_) {}
          }, delay)
          delay += 100
        })
        pendingPlots = []
      }
    })
  }
  await connectWS()
  // Seed from existing logs so flows appear even without tailscale stream
  await seedFromAPILogRecent()
  
  // Add Mumbai-Kolkata threat flow after initialization
  setTimeout(() => {
    addMumbaiKolkataFlow()
  }, 2000)
})

onUnmounted(() => {
  if (ws) {
    try { ws.close() } catch (_) {}
    ws = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
})
</script>
