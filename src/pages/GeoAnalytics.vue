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
      <!-- Page Header - India-Centric -->
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

    <!-- Live Threat Map with Real-time Attack Flows -->
    <LiveThreatMap :key="timeRange" />

    

    <!-- Geo Statistics -->
    <div class="my-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="stat-card card-accent-cyan">
          <div class="stat-value text-accent-primary">{{ uniqueCountries }}</div>
          <div class="stat-label">Countries</div>
        </div>
        <div class="stat-card card-accent-purple">
          <div class="stat-value text-accent-secondary">{{ uniqueCities }}</div>
          <div class="stat-label">Cities</div>
        </div>
        <div class="stat-card card-accent-cyan">
          <div class="stat-value text-accent-primary">{{ totalGeoEvents }}</div>
          <div class="stat-label">Total Events</div>
        </div>
        <div class="stat-card card-accent-green">
          <div class="stat-value text-neon-green">{{ avgEventsPerLocation }}</div>
          <div class="stat-label">Avg Events/City</div>
        </div>
      </div>
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
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAPIStore } from '../stores/apiStore'
import LiveThreatMap from '../components/soc/LiveThreatMap.vue'

const apiStore = useAPIStore()
const timeRange = ref('24h')
const searchLocation = ref('')
const loading = ref(false)

// India-centric defaults
const INDIA_CENTER = {
  lat: 20.5937,
  lng: 78.9629,
  zoom: 4
}

const INDIA_TIMEZONE = 'Asia/Kolkata'

// Fetch geo data from backend
const fetchGeoData = async () => {
  try {
    loading.value = true
    console.log('Fetching geo data for timeRange:', timeRange.value)
    
    // Try to fetch from API
    await apiStore.fetchGeoData(timeRange.value)
    console.log('Geo data fetched:', apiStore.geoData.length, 'locations')
    
    // If no real data (only fallback mocks from backend), we might still want to show something
    // The backend provides fallbacks for Mumbai/Delhi if empty
  } catch (error) {
    console.error('Failed to fetch geo data:', error)
  } finally {
    loading.value = false
  }
}

// Sample geo data for fallback - Global
const getSampleGeoData = () => {
  return [
    { country: 'United States', city: 'New York', count: 150, lat: 40.7128, lon: -74.0060, severity: 'high' },
    { country: 'United Kingdom', city: 'London', count: 120, lat: 51.5074, lon: -0.1278, severity: 'high' },
    { country: 'Germany', city: 'Berlin', count: 95, lat: 52.5200, lon: 13.4050, severity: 'medium' },
    { country: 'France', city: 'Paris', count: 85, lat: 48.8566, lon: 2.3522, severity: 'medium' },
    { country: 'Japan', city: 'Tokyo', count: 75, lat: 35.6762, lon: 139.6503, severity: 'medium' },
    { country: 'Australia', city: 'Sydney', count: 65, lat: -33.8688, lon: 151.2093, severity: 'low' },
    { country: 'Canada', city: 'Toronto', count: 55, lat: 43.6532, lon: -79.3832, severity: 'low' },
    { country: 'India', city: 'Mumbai', count: 45, lat: 19.0760, lon: 72.8777, severity: 'low' },
    { country: 'Singapore', city: 'Singapore', count: 35, lat: 1.3521, lon: 103.8198, severity: 'low' },
    { country: 'Brazil', city: 'São Paulo', count: 25, lat: -23.5505, lon: -46.6333, severity: 'low' },
    { country: 'Mexico', city: 'Mexico City', count: 20, lat: 19.4326, lon: -99.1332, severity: 'low' },
    { country: 'South Korea', city: 'Seoul', count: 18, lat: 37.5665, lon: 126.9780, severity: 'low' },
    { country: 'Netherlands', city: 'Amsterdam', count: 15, lat: 52.3676, lon: 4.9041, severity: 'low' },
    { country: 'United Arab Emirates', city: 'Dubai', count: 12, lat: 25.2048, lon: 55.2708, severity: 'low' },
    { country: 'China', city: 'Shanghai', count: 10, lat: 31.2304, lon: 121.4737, severity: 'low' }
  ]
}

const filterGeoData = () => {
  // Filter by search location
  if (!searchLocation.value) {
    fetchGeoData()
  }
}

onMounted(() => {
  fetchGeoData()
})

const geoTableData = computed(() => {
  const data = apiStore.geoData || []
  // Return all data sorted by count
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
  // Group by country and sum counts
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
  // Group by country
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
