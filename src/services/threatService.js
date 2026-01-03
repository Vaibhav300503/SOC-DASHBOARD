/**
 * Threat Service - Real-time threat data management with WebSocket support
 */

let ws = null
let reconnectAttempts = 0
const maxReconnectAttempts = 5
const reconnectDelay = 3000

// Threat event listeners
const threatListeners = new Set()

/**
 * Subscribe to threat updates
 */
export const subscribeTothreats = (callback) => {
  threatListeners.add(callback)
  return () => threatListeners.delete(callback)
}

/**
 * Emit threat event to all listeners
 */
const emitThreatEvent = (data) => {
  threatListeners.forEach(callback => {
    try {
      callback(data)
    } catch (error) {
      console.error('Error in threat listener:', error)
    }
  })
}

/**
 * Connect to WebSocket for real-time threat data
 */
export const connectThreatWS = (url = null) => {
  // Derive WebSocket URL from API base URL
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
  const wsUrl = url || (() => {
    const apiUrl = new URL(apiBase)
    const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProtocol}//${apiUrl.host}/ws/tailscale`
  })()
  return new Promise((resolve, reject) => {
    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('Connected to threat WebSocket')
        reconnectAttempts = 0
        resolve(ws)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          emitThreatEvent(data)
        } catch (error) {
          console.error('Error parsing threat data:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      }

      ws.onclose = () => {
        console.log('Disconnected from threat WebSocket')
        attemptReconnect(wsUrl)
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Attempt to reconnect to WebSocket
 */
const attemptReconnect = (url) => {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++
    console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)
    setTimeout(() => {
      connectThreatWS(url).catch(() => {
        // Retry will happen in onclose
      })
    }, reconnectDelay)
  } else {
    console.warn('Max reconnection attempts reached')
  }
}

/**
 * Disconnect from WebSocket
 */
export const disconnectThreatWS = () => {
  if (ws) {
    ws.close()
    ws = null
  }
}

/**
 * Send threat command via WebSocket
 */
export const sendThreatCommand = (command, payload = {}) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      command,
      payload
    }))
  } else {
    console.warn('WebSocket not connected')
  }
}

/**
 * Get WebSocket connection status
 */
export const getThreatWSStatus = () => {
  return {
    connected: ws && ws.readyState === WebSocket.OPEN,
    readyState: ws?.readyState,
    url: ws?.url
  }
}

/**
 * Simulate live threat data (fallback when no real WebSocket)
 */
export const simulateLiveThreatData = () => {
  const countries = ['USA', 'China', 'Russia', 'India', 'Germany', 'Japan', 'Brazil', 'Canada']
  const severities = ['Critical', 'High', 'Medium', 'Low']

  return {
    type: 'threat',
    timestamp: new Date().toISOString(),
    source: countries[Math.floor(Math.random() * countries.length)],
    target: countries[Math.floor(Math.random() * countries.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    attackType: ['DDoS', 'SQL Injection', 'XSS', 'Brute Force', 'Malware'][Math.floor(Math.random() * 5)],
    count: Math.floor(Math.random() * 1000) + 1
  }
}
