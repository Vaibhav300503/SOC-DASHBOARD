/**
 * Tailscale Stream Service
 * Handles real-time streaming of Tailscale logs via SSE
 */

class TailscaleStreamService {
  constructor() {
    this.eventSource = null
    this.listeners = new Map()
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
  }

  /**
   * Connect to Tailscale stream
   */
  connect() {
    if (this.eventSource) {
      console.warn('Already connected to Tailscale stream')
      return
    }

    console.log('Connecting to Tailscale stream...')

    this.eventSource = new EventSource('/api/tailscale-stream/stream')

    // Handle connection open
    this.eventSource.addEventListener('open', () => {
      console.log('Connected to Tailscale stream')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connected', { timestamp: new Date() })
    })

    // Handle incoming messages
    this.eventSource.addEventListener('message', (event) => {
      try {
        if (!event.data) return
        const message = JSON.parse(event.data)
        if (message) {
          this.handleMessage(message)
        }
      } catch (error) {
        console.error('Error parsing stream message:', error)
      }
    })

    // Handle errors
    this.eventSource.addEventListener('error', (error) => {
      console.error('Tailscale stream error:', error)
      this.isConnected = false
      this.emit('error', { error: error.message })
      this.attemptReconnect()
    })
  }

  /**
   * Handle incoming stream message
   */
  handleMessage(message) {
    if (!message || !message.type) {
      console.warn('Invalid message format:', message)
      return
    }
    
    const { type, data } = message

    switch (type) {
      case 'connected':
        console.log('Stream connected:', data.message)
        this.emit('connected', data)
        break

      case 'log':
        // Emit log event
        this.emit('log', data)
        // Also emit specific type event
        this.emit(`log:${data.type}`, data)
        break

      case 'stats':
        this.emit('stats', data)
        break

      default:
        console.warn('Unknown message type:', type)
    }
  }

  /**
   * Attempt to reconnect to stream
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('reconnect_failed', { attempts: this.reconnectAttempts })
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.disconnect()
      this.connect()
    }, delay)
  }

  /**
   * Disconnect from stream
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.isConnected = false
      console.log('Disconnected from Tailscale stream')
      this.emit('disconnected', { timestamp: new Date() })
    }
  }

  /**
   * Subscribe to stream events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in listener for event "${event}":`, error)
        }
      })
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    }
  }
}

// Export singleton instance
export const tailscaleStreamService = new TailscaleStreamService()

export default tailscaleStreamService
