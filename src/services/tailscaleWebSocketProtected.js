import { ref } from 'vue'

const socket = ref(null)
const isConnected = ref(false)
const connectionStatus = ref('disconnected') // disconnected, connecting, connected, error
const listeners = new Map()
let reconnectTimer = null
let heartbeatTimer = null
let reconnectAttempts = 0
const maxReconnectAttempts = 10
const reconnectDelay = 5000 // 5 seconds
const heartbeatInterval = 30000 // 30 seconds
let messageQueue = [] // Queue messages when disconnected
const maxQueueSize = 100

export function useTailscaleWebSocket() {
  const connect = () => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      return
    }

    if (connectionStatus.value === 'connecting') {
      return
    }

    connectionStatus.value = 'connecting'
    
    // Get auth token
    const token = getAuthToken()
    if (!token) {
      console.error('No authentication token available for WebSocket connection')
      connectionStatus.value = 'error'
      return
    }

    const wsUrl = `${getWebSocketBaseURL()}/ws/tailscale?token=${encodeURIComponent(token)}`
    
    try {
      socket.value = new WebSocket(wsUrl)
      
      socket.value.onopen = () => {
        console.log('Tailscale WebSocket connected')
        isConnected.value = true
        connectionStatus.value = 'connected'
        reconnectAttempts = 0
        
        // Clear reconnect timer
        if (reconnectTimer) {
          clearTimeout(reconnectTimer)
          reconnectTimer = null
        }
        
        // Start heartbeat
        startHeartbeat()
        
        // Send queued messages
        flushMessageQueue()
        
        // Notify listeners
        emit('connected', { 
          timestamp: new Date(),
          reconnectAttempts
        })
      }
      
      socket.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle different message types
          switch (data.type) {
            case 'welcome':
              emit('welcome', data.data)
              break
            case 'pong':
              // Heartbeat response
              break
            case 'update':
              emit('update', data.payload || data)
              break
            default:
              emit(data.type || 'message', data)
          }
          
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          emit('error', { 
            type: 'parse_error',
            error: error.message,
            rawMessage: event.data
          })
        }
      }
      
      socket.value.onclose = (event) => {
        console.log('Tailscale WebSocket disconnected', {
          code: event.code,
          reason: event.reason
        })
        
        isConnected.value = false
        connectionStatus.value = 'disconnected'
        socket.value = null
        
        // Stop heartbeat
        stopHeartbeat()
        
        // Notify listeners
        emit('disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        })
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }
      
      socket.value.onerror = (error) => {
        console.error('Tailscale WebSocket error:', error)
        connectionStatus.value = 'error'
        
        emit('error', {
          type: 'connection_error',
          error: error.message || 'WebSocket connection error'
        })
      }
      
    } catch (error) {
      console.error('Failed to create Tailscale WebSocket:', error)
      connectionStatus.value = 'error'
      
      emit('error', {
        type: 'creation_error',
        error: error.message
      })
    }
  }
  
  const disconnect = () => {
    // Clear all timers
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    
    // Close WebSocket
    if (socket.value) {
      socket.value.close(1000, 'Client disconnect')
      socket.value = null
    }
    
    isConnected.value = false
    connectionStatus.value = 'disconnected'
    reconnectAttempts = 0
    
    // Clear message queue
    messageQueue = []
  }
  
  const scheduleReconnect = () => {
    if (reconnectTimer) return
    
    reconnectAttempts++
    const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts - 1), 30000) // Exponential backoff, max 30s
    
    console.log(`Scheduling WebSocket reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`)
    
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }
  
  const startHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
    }
    
    heartbeatTimer = setInterval(() => {
      if (socket.value && socket.value.readyState === WebSocket.OPEN) {
        send('ping', { timestamp: Date.now() })
      }
    }, heartbeatInterval)
  }
  
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }
  
  const send = (type, data) => {
    const message = {
      type,
      data,
      timestamp: Date.now()
    }
    
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      try {
        socket.value.send(JSON.stringify(message))
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        queueMessage(message)
      }
    } else {
      // Queue message for when connection is restored
      queueMessage(message)
    }
  }
  
  const queueMessage = (message) => {
    if (messageQueue.length >= maxQueueSize) {
      // Remove oldest message if queue is full
      messageQueue.shift()
    }
    
    messageQueue.push(message)
  }
  
  const flushMessageQueue = () => {
    while (messageQueue.length > 0) {
      const message = messageQueue.shift()
      
      if (socket.value && socket.value.readyState === WebSocket.OPEN) {
        try {
          socket.value.send(JSON.stringify(message))
        } catch (error) {
          console.error('Failed to send queued message:', error)
          // Don't re-queue to avoid infinite loops
        }
      }
    }
  }
  
  const emit = (type, data) => {
    const eventListeners = listeners.get(type) || []
    
    eventListeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in WebSocket listener:', error)
      }
    })
  }
  
  const subscribe = (eventType, callback) => {
    if (!listeners.has(eventType)) {
      listeners.set(eventType, [])
    }
    
    listeners.get(eventType).push(callback)
    
    // Return unsubscribe function
    return () => {
      const eventListeners = listeners.get(eventType) || []
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }
  
  const subscribeWithFilter = (eventType, callback, filter) => {
    const filteredCallback = (data) => {
      try {
        if (filter && !filter(data)) {
          return
        }
        callback(data)
      } catch (error) {
        console.error('Error in filtered WebSocket listener:', error)
      }
    }
    
    return subscribe(eventType, filteredCallback)
  }
  
  const getConnectionInfo = () => {
    return {
      isConnected: isConnected.value,
      status: connectionStatus.value,
      reconnectAttempts,
      queuedMessages: messageQueue.length,
      maxQueueSize
    }
  }
  
  // Helper functions
  const getAuthToken = () => {
    // Try to get token from auth store or localStorage
    try {
      // Check if authStore is available
      if (window.authStore) {
        return window.authStore.token
      }
      
      // Fallback to localStorage
      const authData = localStorage.getItem('auth')
      if (authData) {
        const parsed = JSON.parse(authData)
        return parsed.token
      }
    } catch (error) {
      console.error('Failed to get auth token:', error)
    }
    
    return null
  }
  
  const getWebSocketBaseURL = () => {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_WS_HOST || window.location.hostname
    const port = import.meta.env.VITE_WS_PORT || window.location.port
    
    if (port && port !== '80' && port !== '443') {
      return `${protocol}//${host}:${port}`
    }
    
    return `${protocol}//${host}`
  }
  
  // Handle page visibility changes
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden, reduce activity
      stopHeartbeat()
    } else {
      // Page is visible, reconnect if needed
      if (!isConnected.value) {
        connect()
      } else {
        startHeartbeat()
      }
    }
  }
  
  // Setup visibility change listener
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
  
  // Cleanup on page unload
  const cleanup = () => {
    disconnect()
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    
    // Clear all listeners
    listeners.clear()
  }
  
  // Auto-connect if token is available
  if (getAuthToken()) {
    connect()
  }
  
  return {
    connect,
    disconnect,
    send,
    subscribe,
    subscribeWithFilter,
    getConnectionInfo,
    isConnected: () => isConnected.value,
    getStatus: () => connectionStatus.value,
    cleanup
  }
}
