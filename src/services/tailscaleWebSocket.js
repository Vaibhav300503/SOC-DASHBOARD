import { ref } from 'vue'

const socket = ref(null)
const isConnected = ref(false)
const listeners = new Map()
let reconnectTimer = null

export function useTailscaleWebSocket() {
  const connect = () => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = `ws://${window.location.hostname}:3002/ws/tailscale`

    try {
      socket.value = new WebSocket(wsUrl)

      socket.value.onopen = () => {
        console.log('Tailscale WebSocket connected')
        isConnected.value = true
        clearInterval(reconnectTimer)

        // Notify all listeners that connection is established
        emit('connected', { timestamp: new Date() })
      }

      socket.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          emit(data.type || 'update', data.payload || data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      socket.value.onclose = () => {
        console.log('Tailscale WebSocket disconnected')
        isConnected.value = false
        socket.value = null

        // Attempt to reconnect after 5 seconds
        reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect Tailscale WebSocket...')
          connect()
        }, 5000)
      }

      socket.value.onerror = (error) => {
        console.error('Tailscale WebSocket error:', error)
        isConnected.value = false
      }
    } catch (error) {
      console.error('Failed to create Tailscale WebSocket:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearInterval(reconnectTimer)
      reconnectTimer = null
    }

    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    isConnected.value = false
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

  const send = (type, data) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({ type, data }))
    }
  }

  return {
    connect,
    disconnect,
    subscribe,
    send,
    isConnected: () => isConnected.value
  }
}
