// Mock service for fetching logs from MongoDB
// In production, replace with actual API calls to your backend

export const logService = {
  // Fetch logs with filters
  async fetchLogs(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
          total: 0,
        })
      }, 500)
    })
  },

  // Fetch logs by severity
  async fetchLogsBySeverity(severity) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
        })
      }, 300)
    })
  },

  // Fetch logs by type
  async fetchLogsByType(logType) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
        })
      }, 300)
    })
  },

  // Fetch logs by IP
  async fetchLogsByIP(ip, timeRange = '24h') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
        })
      }, 300)
    })
  },

  // Fetch logs by endpoint
  async fetchLogsByEndpoint(endpoint, timeRange = '24h') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
        })
      }, 300)
    })
  },

  // Search logs with regex
  async searchLogs(query, regex = false) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
        })
      }, 500)
    })
  },
}

export const tailscaleService = {
  // Fetch Tailscale logs
  async fetchTailscaleLogs(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
        })
      }, 500)
    })
  },

  // Fetch device list
  async fetchDevices() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
        })
      }, 300)
    })
  },

  // Fetch user sessions
  async fetchUserSessions() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
        })
      }, 300)
    })
  },

  // Fetch peer connections
  async fetchPeerConnections() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [],
        })
      }, 300)
    })
  },

  // Stream real-time events
  streamEvents(callback) {
    const interval = setInterval(() => {
      callback({
        ts: new Date().toISOString(),
        type: 'event',
        message: 'Real-time event',
      })
    }, 5000)
    return () => clearInterval(interval)
  },
}
