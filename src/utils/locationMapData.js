export const FLOW_TTL = 3000

export const ATTACK_TYPES = [
  { name: 'DDoS', color: '#ef4444' },
  { name: 'Malware', color: '#f97316' },
  { name: 'Phishing', color: '#eab308' },
  { name: 'Brute Force', color: '#a855f7' },
  { name: 'SQL Injection', color: '#3b82f6' }
]

export const REGIONS = [
  { name: 'North America', lat: 40, lng: -100 },
  { name: 'South America', lat: -15, lng: -60 },
  { name: 'Europe', lat: 50, lng: 10 },
  { name: 'Asia', lat: 30, lng: 100 },
  { name: 'Africa', lat: 0, lng: 20 },
  { name: 'Oceania', lat: -25, lng: 135 }
]

// Simulation helper - DISABLED simulation, now relies on real data pushes
let subscribers = []

/**
 * Subscribe to the location threat thread
 * Components can listen for new threat events to visualize
 */
export function subscribeToLocationThread(callback) {
  subscribers.push(callback)

  return () => {
    subscribers = subscribers.filter(s => s !== callback)
  }
}

/**
 * Emit a new threat event to all subscribers
 * This is called by components or stores when real data is fetched
 */
export function emitThreat(event) {
  subscribers.forEach(sub => sub(event))
}
