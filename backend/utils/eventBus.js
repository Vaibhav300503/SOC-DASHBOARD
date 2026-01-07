/**
 * Simple Event Bus implementation
 * Used by CaseService for event publishing
 */

class EventBus {
  constructor() {
    this.events = new Map()
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(listener)
  }

  off(event, listener) {
    if (!this.events.has(event)) return
    const listeners = this.events.get(event)
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return
    this.events.get(event).forEach(listener => {
      try {
        listener(...args)
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error)
      }
    })
  }

  removeAllListeners(event) {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }

  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0
  }
}

export default new EventBus()
