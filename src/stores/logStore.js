import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logsAPI } from '../api/logs.js'

export const useLogStore = defineStore('logs', () => {
  const logs = ref([])
  const tailscaleLogs = ref([])
  const registryLogs = ref([])
  const allLogs = ref([]) // New store for all logs

  // Fetch all logs from backend
  const fetchAllLogs = async (filters = {}) => {
    try {
      const response = await logsAPI.getAll(filters)
      // Extract array from nested data property
      const logsArray = response.data || (Array.isArray(response) ? response : [])
      allLogs.value = logsArray

      // If no real data, keep the list empty (no samples)
      return response
    } catch (error) {
      console.error('Failed to fetch all logs:', error)
      // Do not use mock data; expose empty list
      allLogs.value = []
      return { data: [] }
    }
  }

  // Generate mock MongoDB logs
  const generateMockLogs = (count = 1000) => {
    const severities = ['Critical', 'High', 'Medium', 'Low']
    const logTypes = ['Firewall', 'IDS', 'Authentication', 'App', 'System']
    const countries = ['US', 'CN', 'RU', 'IN', 'BR', 'DE', 'UK', 'FR', 'JP', 'AU']
    const cities = ['New York', 'Beijing', 'Moscow', 'Mumbai', 'São Paulo', 'Berlin', 'London', 'Paris', 'Tokyo', 'Sydney']

    const mockLogs = []
    for (let i = 0; i < count; i++) {
      const severity = severities[Math.floor(Math.random() * severities.length)]
      const logType = logTypes[Math.floor(Math.random() * logTypes.length)]
      const countryIdx = Math.floor(Math.random() * countries.length)
      const cityIdx = Math.floor(Math.random() * cities.length)

      mockLogs.push({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        source_ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        dest_ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        endpoint: `endpoint-${Math.floor(Math.random() * 50)}`,
        severity,
        log_type: logType,
        geo: {
          country: countries[countryIdx],
          city: cities[cityIdx],
          lat: Math.random() * 180 - 90,
          lon: Math.random() * 360 - 180,
        },
        raw: {
          action: Math.random() > 0.5 ? 'ALLOW' : 'DENY',
          protocol: ['TCP', 'UDP', 'ICMP'][Math.floor(Math.random() * 3)],
          port: Math.floor(Math.random() * 65535),
          bytes_in: Math.floor(Math.random() * 1000000),
          bytes_out: Math.floor(Math.random() * 1000000),
          description: `Security event from ${logType} system - ${severity} priority`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          bytes: Math.floor(Math.random() * 1000000),
          packets: Math.floor(Math.random() * 10000),
          duration: Math.floor(Math.random() * 1000)
        }
      })
    }
    return mockLogs
  }

  // Generate mock registry logs
  const generateMockRegistryLogs = (count = 200) => {
    const severities = ['Critical', 'High', 'Medium', 'Low']
    const actions = ['CREATE', 'DELETE', 'MODIFY', 'READ']
    const computers = ['WIN-DC01', 'WIN-SRV01', 'WIN-WEB01', 'WIN-DB01', 'WIN-APP01', 'LAPTOP-JOHN', 'DESKTOP-MARY']
    const users = ['Administrator', 'SYSTEM', 'John.Doe', 'Mary.Smith', 'svc_account', 'backup_user']
    const registryPaths = [
      'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services',
      'HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows',
      'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion',
      'HKEY_USERS\\.DEFAULT\\Software\\Microsoft\\Windows'
    ]
    const valueTypes = ['REG_SZ', 'REG_DWORD', 'REG_BINARY', 'REG_MULTI_SZ', 'REG_EXPAND_SZ']

    const mockLogs = []
    for (let i = 0; i < count; i++) {
      const severity = severities[Math.floor(Math.random() * severities.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const computer = computers[Math.floor(Math.random() * computers.length)]
      const user = users[Math.floor(Math.random() * users.length)]
      const registryPath = registryPaths[Math.floor(Math.random() * registryPaths.length)]
      const valueType = valueTypes[Math.floor(Math.random() * valueTypes.length)]

      mockLogs.push({
        id: `reg-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        severity,
        log_type: 'Registry',
        computer,
        user,
        registry_path: registryPath,
        key_name: `Key_${Math.random().toString(36).substring(7)}`,
        value_type: valueType,
        old_value: action === 'MODIFY' ? `OldValue_${Math.random().toString(36).substring(7)}` : null,
        new_value: (action === 'CREATE' || action === 'MODIFY') ? `NewValue_${Math.random().toString(36).substring(7)}` : null,
        raw: {
          action,
          description: `Registry ${action.toLowerCase()} operation`,
          process_name: ['explorer.exe', 'regedit.exe', 'services.exe', 'winlogon.exe'][Math.floor(Math.random() * 4)],
          process_id: Math.floor(Math.random() * 5000) + 1000,
          hive: registryPath.split('\\')[0]
        }
      })
    }
    return mockLogs
  }

  // Generate mock Tailscale logs
  const generateMockTailscaleLogs = (count = 500) => {
    const eventTypes = ['peer_connected', 'peer_disconnected', 'auth_success', 'auth_failed', 'subnet_route_added', 'exit_node_used']
    const mockTailscaleLogs = []

    for (let i = 0; i < count; i++) {
      mockTailscaleLogs.push({
        id: `ts-${i}`,
        ts: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        node_id: `node-${Math.floor(Math.random() * 100)}`,
        user: `user-${Math.floor(Math.random() * 50)}`,
        src: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        dst: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        event: `Event ${i}`,
        status: Math.random() > 0.2 ? 'success' : 'failed',
      })
    }
    return mockTailscaleLogs
  }

  // Initialize logs - fetch real data from MongoDB
  const initializeLogs = async () => {
    try {
      // Fetch real logs from backend API - using getRecent as getLogs doesn't exist
      const response = await logsAPI.getRecent(1000)
      const logsArray = response.data || (Array.isArray(response) ? response : [])

      if (logsArray.length > 0) {
        logs.value = logsArray
      } else {
        // Keep empty if no real data available (no samples)
        logs.value = []
      }

      // Fetch tailscale logs
      try {
        const tailscaleResponse = await logsAPI.getTailscaleLogs()
        const tsLogs = tailscaleResponse?.data || (Array.isArray(tailscaleResponse) ? tailscaleResponse : [])
        if (tsLogs.length > 0) {
          tailscaleLogs.value = tsLogs
        } else {
          tailscaleLogs.value = []
        }
      } catch (error) {
        console.warn('Failed to fetch tailscale logs:', error)
        tailscaleLogs.value = []
      }

      // Generate registry logs (these are typically system-generated)
      registryLogs.value = []

    } catch (error) {
      console.error('Failed to fetch real logs from MongoDB:', error)
      // Do not fallback to mock data if API fails
      logs.value = []
      tailscaleLogs.value = []
      registryLogs.value = []
    }
  }

  // Computed stats
  const totalLogs = computed(() => logs.value.length)
  const criticalCount = computed(() => logs.value.filter(l => l.severity === 'Critical').length)
  const highCount = computed(() => logs.value.filter(l => l.severity === 'High').length)
  const mediumCount = computed(() => logs.value.filter(l => l.severity === 'Medium').length)
  const lowCount = computed(() => logs.value.filter(l => l.severity === 'Low').length)

  const severityDistribution = computed(() => [
    { name: 'Critical', value: criticalCount.value, color: '#ff0055' },
    { name: 'High', value: highCount.value, color: '#ff6b35' },
    { name: 'Medium', value: mediumCount.value, color: '#ffd700' },
    { name: 'Low', value: lowCount.value, color: '#00ff88' },
  ])

  const logTypeDistribution = computed(() => {
    const types = {}
    logs.value.forEach(log => {
      types[log.log_type] = (types[log.log_type] || 0) + 1
    })
    return Object.entries(types).map(([name, value]) => ({ name, value }))
  })

  const topSourceIPs = computed(() => {
    const ips = {}
    logs.value.forEach(log => {
      ips[log.source_ip] = (ips[log.source_ip] || 0) + 1
    })
    return Object.entries(ips)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  })

  const topDestinationIPs = computed(() => {
    const ips = {}
    logs.value.forEach(log => {
      ips[log.dest_ip] = (ips[log.dest_ip] || 0) + 1
    })
    return Object.entries(ips)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  })

  const geoHeatmap = computed(() => {
    const geoData = {}
    logs.value.forEach(log => {
      const key = `${log.geo.country}-${log.geo.city}`
      if (!geoData[key]) {
        geoData[key] = {
          country: log.geo.country,
          city: log.geo.city,
          lat: log.geo.lat,
          lon: log.geo.lon,
          count: 0,
        }
      }
      geoData[key].count++
    })
    return Object.values(geoData)
  })

  return {
    logs,
    tailscaleLogs,
    registryLogs,
    allLogs,
    fetchAllLogs,
    initializeLogs,
    totalLogs,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    severityDistribution,
    logTypeDistribution,
    topSourceIPs,
    topDestinationIPs,
    geoHeatmap,
  }
})
