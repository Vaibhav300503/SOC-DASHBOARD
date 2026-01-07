/**
 * Simple in-memory cache implementation
 * Used by CaseService for temporary caching of API responses
 */

class SimpleCache {
  constructor() {
    this.cache = new Map()
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  set(key, data, ttlMs = 60000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    })
  }

  delete(key) {
    return this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  has(key) {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  size() {
    return this.cache.size
  }

  keys() {
    return Array.from(this.cache.keys())
  }
}

export default new SimpleCache()
