<template>
  <div class="space-y-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-96">
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-4xl text-cyber-400 mb-4"></i>
        <div class="text-slate-dark-400">Loading Geo Analytics...</div>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black title-gradient tracking-tight">Geolocation Analytics</h1>
          <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Interactive world map with threat hotspots and regional distribution</p>
        </div>
        <div class="flex gap-3">
          <select v-model="timeRange" class="input-cyber">
            <option value="1h">Last 1 Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      <!-- 2D Cyber Map -->
      <div class="bg-slate-800/50 rounded-lg p-1 border border-slate-700/30 mt-6 relative group">
        <div class="absolute top-4 left-4 z-20 flex gap-4 font-mono pointer-events-none">
           <div class="bg-black/80 border border-green-500/20 p-2 backdrop-blur-md rounded-sm">
               <div class="text-[10px] text-gray-400 uppercase mb-1">Active Vectors</div>
               <div class="text-lg font-bold text-green-400 tracking-wider">TRACKING</div>
           </div>
           <div class="bg-black/80 border border-orange-500/20 p-2 backdrop-blur-md rounded-sm">
               <div class="text-[10px] text-gray-400 uppercase mb-1">Attack Intensity</div>
               <div class="text-lg font-bold text-orange-400 tracking-wider">MODERATE</div>
           </div>
        </div>
        
        <div class="h-[600px] w-full rounded-lg overflow-hidden">
          <CyberMap :activeAttacks="activeAttacks" />
        </div>
      </div>

      <!-- Geo Statistics -->
      <div class="my-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="stat-card card-accent-cyan text-center-left">
            <div class="stat-value text-accent-primary">{{ uniqueCountries }}</div>
            <div class="stat-label">Countries</div>
          </div>
          <div class="stat-card card-accent-purple text-center-left">
            <div class="stat-value text-accent-secondary">{{ uniqueCities }}</div>
            <div class="stat-label">Cities</div>
          </div>
          <div class="stat-card card-accent-cyan text-center-left">
            <div class="stat-value text-accent-primary">{{ totalGeoEvents }}</div>
            <div class="stat-label">Total Events</div>
          </div>
          <div class="stat-card card-accent-green text-center-left">
            <div class="stat-value text-neon-green">{{ avgEventsPerLocation }}</div>
            <div class="stat-label">Avg Events/City</div>
          </div>
        </div>
      </div>

      <!-- Global Geo Table -->
      <div class="my-8">
        <div class="card-glass p-6 rounded-xl border-t border-t-accent-cyan/10">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black title-gradient">Global Country Distribution</h3>
            <div class="flex gap-2">
              <input v-model="searchLocation" type="text" placeholder="Search country/city..." class="input-cyber text-sm" />
              <button @click="filterGeoData" class="btn-cyber-outline">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table-cyber">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>City</th>
                  <th>Hit Count</th>
                  <th>Severity</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>ASN</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in geoTableData" :key="idx">
                  <td>
                    <span class="font-semibold text-slate-dark-50">{{ item.country }}</span>
                  </td>
                  <td class="text-slate-dark-400">{{ item.city }}</td>
                  <td>
                    <span class="font-bold text-cyber-400">{{ item.count }}</span>
                  </td>
                  <td>
                    <span :class="['badge-' + getSeverityClass(item.count)]">
                      {{ getSeverityLabel(item.count) }}
                    </span>
                  </td>
                  <td class="text-slate-dark-400 text-sm">{{ item.lat.toFixed(2) }}</td>
                  <td class="text-slate-dark-400 text-sm">{{ item.lon.toFixed(2) }}</td>
                  <td class="text-slate-dark-400 text-sm">AS{{ Math.floor(Math.random() * 65535) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Top Critical Cities & Regions -->
      <div class="my-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
            <h3 class="text-lg font-black title-gradient mb-6">Top Countries by Events</h3>
            <div class="space-y-4">
              <div v-for="(country, idx) in topCountries" :key="idx" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-slate-dark-300">{{ country.name }}</span>
                  <span class="text-sm font-bold text-slate-dark-50">{{ country.count }}</span>
                </div>
                <div class="w-full bg-slate-dark-900/50 rounded-full h-2 overflow-hidden border border-slate-dark-700/50">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-cyber-500 to-neon-purple"
                    :style="{ width: `${(country.count / maxCountryCount) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="card-glass p-6 rounded-xl border-t border-t-accent-secondary/10">
            <h3 class="text-lg font-black title-gradient mb-6">Severity by Countries</h3>
            <div class="space-y-4">
              <div v-for="region in severityByRegion" :key="region.name" class="bg-slate-dark-900/50 rounded-lg p-3 border border-slate-dark-700/50">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold text-slate-dark-300">{{ region.name }}</span>
                  <span class="text-xs text-slate-dark-400">{{ region.total }} events</span>
                </div>
                <div class="flex gap-1">
                  <div
                    class="flex-1 h-2 rounded-full bg-neon-red/80"
                    :style="{ width: `${(region.critical / region.total) * 100}%` }"
                    :title="`Critical: ${region.critical}`"
                  />
                  <div
                    class="flex-1 h-2 rounded-full bg-neon-orange/80"
                    :style="{ width: `${(region.high / region.total) * 100}%` }"
                    :title="`High: ${region.high}`"
                  />
                  <div
                    class="flex-1 h-2 rounded-full bg-yellow-500/80"
                    :style="{ width: `${(region.medium / region.total) * 100}%` }"
                    :title="`Medium: ${region.medium}`"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAPIStore } from '../stores/apiStore'
import CyberMap from '../components/CyberMap.vue'

const apiStore = useAPIStore()
const timeRange = ref('24h')
const searchLocation = ref('')
const loading = ref(false)
const activeAttacks = ref([])
let simulationInterval = null

// --- Simulation Data Constants ---
const ATTACK_TYPES = [
  { name: "SMB (445)", color: "#ff4d4d" },      // Red
  { name: "Telnet (23)", color: "#00f2ff" },     // Cyan
  { name: "SSH (22)", color: "#ffee00" },       // Yellow
  { name: "HTTP (80)", color: "#ff00ff" },      // Magenta
  { name: "RDP (3389)", color: "#3d5afe" },     // Electric Blue
]

const REGIONS = [
  { name: "California, USA", lat: 36.7783, lon: -119.4179 },
  { name: "Texas, USA", lat: 31.9686, lon: -99.9018 },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  { name: "Florida, USA", lat: 27.6648, lon: -81.5158 },
  { name: "Washington, USA", lat: 47.7511, lon: -120.7401 },
  { name: "Ontario, CAN", lat: 51.2538, lon: -85.3232 },
  { name: "Quebec, CAN", lat: 52.9399, lon: -73.5491 },
  { name: "Bavaria, DEU", lat: 48.7904, lon: 11.4979 },
  { name: "Ile-de-France, FRA", lat: 48.8566, lon: 2.3522 },
  { name: "England, GBR", lat: 52.3555, lon: -1.1743 },
  { name: "Lombardy, ITA", lat: 45.4791, lon: 9.8453 },
  { name: "Madrid, ESP", lat: 40.4168, lon: -3.7038 },
  { name: "Moscow Oblast, RUS", lat: 55.7558, lon: 37.6173 },
  { name: "Tokyo, JPN", lat: 35.6762, lon: 139.6503 },
  { name: "Osaka, JPN", lat: 34.6937, lon: 135.5023 },
  { name: "Guangdong, CHN", lat: 23.3790, lon: 113.7633 },
  { name: "Zhejiang, CHN", lat: 29.1832, lon: 120.0934 },
  { name: "Maharashtra, IND", lat: 19.7515, lon: 75.7139 },
  { name: "Karnataka, IND", lat: 15.3173, lon: 75.7139 },
  { name: "Seoul, KOR", lat: 37.5665, lon: 126.9780 },
  { name: "NSW, AUS", lat: -31.2532, lon: 146.9211 },
  { name: "Victoria, AUS", lat: -37.4713, lon: 144.7852 },
  { name: "Sao Paulo, BRA", lat: -23.5505, lon: -46.6333 },
  { name: "Buenos Aires, ARG", lat: -34.6037, lon: -58.3816 },
  { name: "Gauteng, ZAF", lat: -26.2708, lon: 28.1123 },
  { name: "Lagos, NGA", lat: 6.5244, lon: 3.3792 },
  { name: "Cairo, EGY", lat: 30.0444, lon: 31.2357 },
]

// Fetch geo data from backend
const fetchGeoData = async () => {
  try {
    loading.value = true
    // console.log('Fetching geo data for timeRange:', timeRange.value)
    
    // Try to fetch from API
    await apiStore.fetchGeoData(timeRange.value)
    
  } catch (error) {
    console.error('Failed to fetch geo data:', error)
  } finally {
    loading.value = false
  }
}

// Start simulation
const startSimulation = () => {
    // Add sample attack immediately
    const sampleAttack = {
        id: 'sample-attack-123',
        source: REGIONS[17], // Maharashtra, IND
        destination: REGIONS[2], // New York, USA
        type: ATTACK_TYPES[0], // SMB (445)
        timestamp: new Date().toISOString()
    }
    activeAttacks.value.push(sampleAttack)

    simulationInterval = setInterval(() => {
        const typeIdx = Math.floor(Math.random() * ATTACK_TYPES.length)
        const sourceIdx = Math.floor(Math.random() * REGIONS.length)
        let destIdx = Math.floor(Math.random() * REGIONS.length)
        while(sourceIdx === destIdx) destIdx = Math.floor(Math.random() * REGIONS.length)

        const newAttack = {
            id: Math.random().toString(36).substr(2, 9),
            source: REGIONS[sourceIdx],
            destination: REGIONS[destIdx],
            type: ATTACK_TYPES[typeIdx],
            timestamp: new Date().toISOString()
        }

        activeAttacks.value.push(newAttack)
        
        // Remove attack after animation completes (approx 3-5s based on canvas logic)
        setTimeout(() => {
            activeAttacks.value = activeAttacks.value.filter(a => a.id !== newAttack.id)
        }, 8000)

    }, 1500) // Launch attack every 1.5s
}

const filterGeoData = () => {
  if (!searchLocation.value) {
    fetchGeoData()
  }
}

onMounted(() => {
  fetchGeoData()
  startSimulation()
})

onUnmounted(() => {
    if (simulationInterval) clearInterval(simulationInterval)
})

const geoTableData = computed(() => {
  const data = apiStore.geoData || []
  return data.sort((a, b) => (b.count || 0) - (a.count || 0))
})

const uniqueCountries = computed(() => {
  const data = apiStore.geoData || []
  const countries = new Set(data.map(l => l.country).filter(Boolean))
  return countries.size
})

const uniqueCities = computed(() => {
  const data = apiStore.geoData || []
  const cities = new Set(data.map(l => l.city).filter(Boolean))
  return cities.size
})

const totalGeoEvents = computed(() => {
  const data = apiStore.geoData || []
  return data.reduce((sum, l) => sum + (l.count || 0), 0)
})

const avgEventsPerLocation = computed(() => {
  const data = apiStore.geoData || []
  if (data.length === 0) return 0
  const total = data.reduce((sum, l) => sum + (l.count || 0), 0)
  return (total / data.length).toFixed(1)
})

const topCountries = computed(() => {
  const countries = {}
  const data = apiStore.geoData || []
  data.forEach(item => {
    if (item.country) {
      countries[item.country] = (countries[item.country] || 0) + (item.count || 0)
    }
  })
  return Object.entries(countries)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

const maxCountryCount = computed(() => {
  return topCountries.value.length > 0 ? topCountries.value[0].count : 1
})

const severityByRegion = computed(() => {
  const regions = {}
  const data = apiStore.geoData || []
  data.forEach(item => {
    const region = item.country || 'Unknown'
    if (!regions[region]) {
      regions[region] = { name: region, critical: 0, high: 0, medium: 0, low: 0, total: 0 }
    }
    regions[region].critical += (item.critical || 0)
    regions[region].high += (item.high || 0)
    regions[region].medium += (item.medium || 0)
    regions[region].low += (item.low || 0)
    regions[region].total += (item.count || 0)
  })
  return Object.values(regions).sort((a, b) => b.total - a.total).slice(0, 6)
})

const getSeverityClass = (count) => {
  if (count > 100) return 'critical'
  if (count > 50) return 'high'
  if (count > 20) return 'medium'
  return 'low'
}

const getSeverityLabel = (count) => {
  if (count > 100) return 'Critical'
  if (count > 50) return 'High'
  if (count > 20) return 'Medium'
  return 'Low'
}
</script>
