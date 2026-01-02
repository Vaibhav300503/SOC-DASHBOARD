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

    <!-- Interactive Geo Map -->
    <GeoMapLeaflet :key="timeRange" />

    <!-- Network Topology Visualization - India Centric -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/20">
      <h3 class="text-lg font-black title-gradient mb-6">Network Topology</h3>
      <Suspense>
        <template #default>
          <NetworkGraphLight v-model:modelValue="timeRange" :indiaCentric="true" />
        </template>
        <template #fallback>
          <div class="flex items-center justify-center h-96">
            <div class="text-slate-dark-400">Loading network topology...</div>
          </div>
        </template>
      </Suspense>
    </div>

    <!-- Geo Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat-card card-accent-cyan">
        <div class="stat-value text-accent-primary">1</div>
        <div class="stat-label">Country</div>
      </div>
      <div class="stat-card card-accent-purple">
        <div class="stat-value text-accent-secondary">{{ uniqueCities }}</div>
        <div class="stat-label">Indian Cities</div>
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

    <!-- India Geo Table -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-cyan/10">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-black title-gradient">India Regional Distribution</h3>
        <div class="flex gap-2">
          <input v-model="searchLocation" type="text" placeholder="Search state/city..." class="input-cyber text-sm" />
          <button @click="filterGeoData" class="btn-cyber-outline">
            <i class="fas fa-search"></i>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="table-cyber">
          <thead>
            <tr>
              <th>State/UT</th>
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
                <span class="font-semibold text-slate-dark-50">{{ getStateForCity(item.city) }}</span>
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
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
        <h3 class="text-lg font-black title-gradient mb-6">Top Indian Cities by Events</h3>
        <div class="space-y-4">
          <div v-for="(city, idx) in topCountries" :key="idx" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-dark-300">{{ city.name }}</span>
              <span class="text-sm font-bold text-slate-dark-50">{{ city.count }}</span>
            </div>
            <div class="w-full bg-slate-dark-900/50 rounded-full h-2 overflow-hidden border border-slate-dark-700/50">
              <div
                class="h-full rounded-full bg-gradient-to-r from-cyber-500 to-neon-purple"
                :style="{ width: `${(city.count / maxCountryCount) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="card-glass p-6 rounded-xl border-t border-t-accent-secondary/10">
        <h3 class="text-lg font-black title-gradient mb-6">Severity by Indian Cities</h3>
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
import NetworkGraphLight from '../components/soc/NetworkGraphLight.vue'
import GeoMapLeaflet from '../components/soc/GeoMapLeaflet.vue'

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

// Sample geo data for fallback - India only
const getSampleGeoData = () => {
  return [
    { country: 'India', city: 'Mumbai', count: 150, lat: 19.0760, lon: 72.8777, severity: 'high' },
    { country: 'India', city: 'Delhi', count: 120, lat: 28.7041, lon: 77.1025, severity: 'high' },
    { country: 'India', city: 'Bangalore', count: 95, lat: 12.9716, lon: 77.5946, severity: 'medium' },
    { country: 'India', city: 'Chennai', count: 85, lat: 13.0827, lon: 80.2707, severity: 'medium' },
    { country: 'India', city: 'Kolkata', count: 75, lat: 22.5726, lon: 88.3639, severity: 'medium' },
    { country: 'India', city: 'Hyderabad', count: 65, lat: 17.3850, lon: 78.4867, severity: 'low' },
    { country: 'India', city: 'Pune', count: 55, lat: 18.5204, lon: 73.8567, severity: 'low' },
    { country: 'India', city: 'Ahmedabad', count: 45, lat: 23.0225, lon: 72.5714, severity: 'low' },
    { country: 'India', city: 'Jaipur', count: 35, lat: 26.9124, lon: 75.7873, severity: 'low' },
    { country: 'India', city: 'Lucknow', count: 25, lat: 26.8467, lon: 80.9462, severity: 'low' },
    { country: 'India', city: 'Chandigarh', count: 20, lat: 30.7333, lon: 76.7794, severity: 'low' },
    { country: 'India', city: 'Indore', count: 18, lat: 22.7196, lon: 75.8577, severity: 'low' },
    { country: 'India', city: 'Nagpur', count: 15, lat: 21.1458, lon: 79.0882, severity: 'low' },
    { country: 'India', city: 'Kochi', count: 12, lat: 9.9312, lon: 76.2673, severity: 'low' },
    { country: 'India', city: 'Coimbatore', count: 10, lat: 11.0168, lon: 76.9558, severity: 'low' }
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
  // Filter for India only
  const indiaData = data.filter(item => item.country === 'India')
  return indiaData.sort((a, b) => (b.count || 0) - (a.count || 0))
})

const uniqueCountries = computed(() => {
  const data = apiStore.geoData || []
  // Filter for India only
  const indiaData = data.filter(item => item.country === 'India')
  const countries = new Set(indiaData.map(l => l.country).filter(Boolean))
  return countries.size
})

const uniqueCities = computed(() => {
  const data = apiStore.geoData || []
  // Filter for India only
  const indiaData = data.filter(item => item.country === 'India')
  const cities = new Set(indiaData.map(l => l.city).filter(Boolean))
  return cities.size
})

const totalGeoEvents = computed(() => {
  const data = apiStore.geoData || []
  // Filter for India only
  const indiaData = data.filter(item => item.country === 'India')
  return indiaData.reduce((sum, l) => sum + (l.count || 0), 0)
})

const avgEventsPerLocation = computed(() => {
  const data = apiStore.geoData || []
  // Filter for India only
  const indiaData = data.filter(item => item.country === 'India')
  if (indiaData.length === 0) return 0
  const total = indiaData.reduce((sum, l) => sum + (l.count || 0), 0)
  return (total / indiaData.length).toFixed(1)
})

const topCountries = computed(() => {
  // Since we're focusing on India, show top cities instead
  const cities = {}
  const data = apiStore.geoData || []
  const indiaData = data.filter(item => item.country === 'India')
  indiaData.forEach(item => {
    if (item.city) {
      cities[item.city] = (cities[item.city] || 0) + (item.count || 0)
    }
  })
  return Object.entries(cities)
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
  // Filter for India only and group by city
  const indiaData = data.filter(item => item.country === 'India')
  indiaData.forEach(item => {
    const region = item.city || 'Unknown'
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

// Map Indian cities to their states
const getStateForCity = (city) => {
  const cityToState = {
    'Mumbai': 'Maharashtra',
    'Delhi': 'Delhi',
    'Bangalore': 'Karnataka',
    'Chennai': 'Tamil Nadu',
    'Kolkata': 'West Bengal',
    'Hyderabad': 'Telangana',
    'Pune': 'Maharashtra',
    'Ahmedabad': 'Gujarat',
    'Jaipur': 'Rajasthan',
    'Lucknow': 'Uttar Pradesh',
    'Chandigarh': 'Chandigarh',
    'Indore': 'Madhya Pradesh',
    'Nagpur': 'Maharashtra',
    'Kochi': 'Kerala',
    'Coimbatore': 'Tamil Nadu'
  }
  return cityToState[city] || 'Unknown'
}
</script>
