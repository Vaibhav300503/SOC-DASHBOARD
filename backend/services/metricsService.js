/**
 * Metrics Service - Placeholder implementation
 * Used by CaseService for metrics collection
 */

class MetricsService {
  constructor() {
    this.metrics = new Map()
  }

  incrementCounter(name, tags = {}) {
    const key = `${name}:${JSON.stringify(tags)}`
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1)
  }

  recordTimer(name, duration, tags = {}) {
    const key = `${name}:${JSON.stringify(tags)}`
    const existing = this.metrics.get(key) || []
    existing.push(duration)
    this.metrics.set(key, existing)
  }

  setGauge(name, value, tags = {}) {
    const key = `${name}:${JSON.stringify(tags)}`
    this.metrics.set(key, value)
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  reset() {
    this.metrics.clear()
  }
}

export default new MetricsService()
