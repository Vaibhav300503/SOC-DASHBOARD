import mapSource from '../../2dMap.jsx?raw'

const FEATURE_LIMIT = 1200
const FLOW_LIMIT = 320
export const FLOW_TTL = 18000
const BROADCAST_INTERVAL_MS = 2200

const severities = ['Critical', 'High', 'Medium', 'Low']
const severityWeights = {
  Critical: 6,
  High: 20,
  Medium: 34,
  Low: 40
}
const severityTotalWeight = severities.reduce((acc, severity) => acc + (severityWeights[severity] || 0), 0)

const featureBuffer = []
const flowBuffer = []
const listeners = new Set()
let intervalHandle = null

function sanitizeLiteral(rawLiteral) {
  return rawLiteral
    .replace(/\/\/.*$/gm, '')
    .replace(/\b([a-zA-Z0-9_]+)\s*:/g, '"$1":')
    .replace(/'(.*?)'/g, '"$1"')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
}

function extractArrayLiteral(source, name) {
  const regex = new RegExp(`const\\s+${name}\\s*=\\s*(\\[[\\s\\S]*?\\]);`)
  const match = regex.exec(source)
  if (!match || !match[1]) return []
  try {
    return JSON.parse(sanitizeLiteral(match[1]))
  } catch (error) {
    console.error(`Failed to parse ${name} from 2dMap.jsx`, error)
    return []
  }
}

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function validateCoordinates(region) {
  if (!region) return false
  const lat = toNumber(region.lat)
  const lon = toNumber(region.lon)
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

function normalizeRegion(region) {
  const name = typeof region?.name === 'string' ? region.name : ''
  const [cityPart = '', countryPart = ''] = name.split(',').map(part => part.trim())
  const lat = toNumber(region?.lat)
  const lon = toNumber(region?.lon)
  return {
    ...region,
    name,
    lat,
    lon,
    city: region?.city || cityPart,
    country: region?.country || countryPart || cityPart
  }
}

function hashString(value) {
  const str = String(value)
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function generateIp(seed) {
  const hash = hashString(seed)
  const segments = [
    11 + (hash % 199),
    (hash >> 8) & 255,
    (hash >> 16) & 255,
    (hash >> 24) & 255
  ].map(seg => {
    const normalized = seg % 255
    return normalized === 0 ? 1 : normalized
  })
  segments[0] = Math.min(223, segments[0])
  return segments.join('.')
}

function pickSeverity() {
  const target = Math.random() * severityTotalWeight
  let cumulative = 0
  for (let i = 0; i < severities.length; i += 1) {
    const severity = severities[i]
    cumulative += severityWeights[severity] || 0
    if (target <= cumulative) return severity
  }
  return 'Low'
}

function pickAttackType() {
  if (!attackTypes.length) {
    return { name: 'HTTP (80)', color: '#38bdf8' }
  }
  const index = Math.floor(Math.random() * attackTypes.length)
  return attackTypes[index]
}

function buildFeature(region, overrides = {}) {
  if (!validateCoordinates(region)) return null
  const timestamp = overrides.timestamp || new Date().toISOString()
  const direction = overrides.direction || 'Observation'
  const uniqueKey = `${region.name || 'region'}-${direction}-${timestamp}`
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [region.lon, region.lat]
    },
    properties: {
      id: overrides.id || uniqueKey,
      ip: overrides.ip || generateIp(uniqueKey),
      country: region.country || '',
      city: region.city || '',
      severity: overrides.severity || 'Low',
      logType: overrides.logType || 'HTTP (80)',
      timestamp,
      isp: overrides.isp || `${region.country || 'Global'} Communications`,
      direction
    }
  }
}

function pushFeature(feature) {
  if (!feature) return
  featureBuffer.unshift(feature)
  while (featureBuffer.length > FEATURE_LIMIT) {
    featureBuffer.pop()
  }
}

function buildFlow(srcRegion, dstRegion, attackType, severity, timestamp, srcFeature, dstFeature) {
  return {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 10)}`,
    src: {
      name: srcRegion.name,
      lat: srcRegion.lat,
      lon: srcRegion.lon,
      city: srcRegion.city,
      country: srcRegion.country,
      ip: srcFeature?.properties?.ip
    },
    dst: {
      name: dstRegion.name,
      lat: dstRegion.lat,
      lon: dstRegion.lon,
      city: dstRegion.city,
      country: dstRegion.country,
      ip: dstFeature?.properties?.ip
    },
    severity,
    color: attackType.color || '#38bdf8',
    logType: attackType.name,
    sourceIp: srcFeature?.properties?.ip,
    destIp: dstFeature?.properties?.ip,
    timestamp,
    expiresAt: Date.now() + FLOW_TTL
  }
}

function addFlow(flow) {
  if (!flow) return
  flowBuffer.push(flow)
  while (flowBuffer.length > FLOW_LIMIT) {
    flowBuffer.shift()
  }
}

function pruneFlows() {
  const now = Date.now()
  for (let i = flowBuffer.length - 1; i >= 0; i -= 1) {
    if (flowBuffer[i].expiresAt <= now) {
      flowBuffer.splice(i, 1)
    }
  }
}

function generateAttackEvent() {
  if (regions.length < 2) return null
  const srcIndex = Math.floor(Math.random() * regions.length)
  let dstIndex = Math.floor(Math.random() * regions.length)
  if (dstIndex === srcIndex) {
    dstIndex = (dstIndex + 11) % regions.length
  }

  const srcRegion = regions[srcIndex]
  const dstRegion = regions[dstIndex]
  const attackType = pickAttackType()
  const severity = pickSeverity()
  const timestamp = new Date().toISOString()

  const srcFeature = buildFeature(srcRegion, {
    severity,
    logType: attackType.name,
    timestamp,
    direction: 'Source'
  })
  const dstFeature = buildFeature(dstRegion, {
    severity,
    logType: attackType.name,
    timestamp,
    direction: 'Destination'
  })

  pushFeature(srcFeature)
  pushFeature(dstFeature)

  const flow = buildFlow(srcRegion, dstRegion, attackType, severity, timestamp, srcFeature, dstFeature)
  addFlow(flow)

  pruneFlows()

  return { flow, features: [srcFeature, dstFeature] }
}

function seedInitialFeatures() {
  const now = Date.now()
  regions.slice(0, 80).forEach((region, index) => {
    const severity = severities[index % severities.length]
    const type = attackTypes[index % attackTypes.length] || attackTypes[0] || { name: 'HTTP (80)' }
    const feature = buildFeature(region, {
      severity,
      logType: type.name,
      timestamp: new Date(now - (index * 45000)).toISOString()
    })
    pushFeature(feature)
  })

  const aggregates = [...initialSources, ...initialDestinations]
  aggregates.forEach((entry, index) => {
    const region = regions.find(candidate => String(candidate.name).includes(entry.name))
    if (!region) return
    const repeats = Math.max(1, Math.round((entry.count || 1) / 11000))
    for (let i = 0; i < repeats; i += 1) {
      const feature = buildFeature(region, {
        severity: severities[(index + i) % severities.length],
        logType: attackTypes[(index + i) % attackTypes.length]?.name || 'HTTP (80)',
        timestamp: new Date(now - (index * 60000) - (i * 15000)).toISOString(),
        direction: index < initialSources.length ? 'Source' : 'Destination'
      })
      pushFeature(feature)
    }
  })
}

function ensureInterval() {
  if (intervalHandle) return
  intervalHandle = setInterval(() => {
    const event = generateAttackEvent()
    if (!event) return
    listeners.forEach(listener => {
      try {
        listener({ flow: event.flow, features: event.features })
      } catch (error) {
        console.error('Location map listener error', error)
      }
    })
  }, BROADCAST_INTERVAL_MS)
}

export function getLocationFeatureCollection() {
  return {
    success: true,
    features: featureBuffer.slice(0, FEATURE_LIMIT)
  }
}

export function getAttackFlowCollection() {
  pruneFlows()
  return flowBuffer.slice()
}

export function subscribeToLocationThread(listener) {
  if (typeof listener !== 'function') {
    return () => {}
  }
  listeners.add(listener)
  ensureInterval()
  try {
    listener({ snapshot: true, features: featureBuffer.slice(), flows: getAttackFlowCollection() })
  } catch (error) {
    console.error('Initial location thread dispatch error', error)
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size && intervalHandle) {
      clearInterval(intervalHandle)
      intervalHandle = null
    }
  }
}

const regions = extractArrayLiteral(mapSource, 'REGIONS')
  .map(normalizeRegion)
  .filter(validateCoordinates)
const attackTypes = extractArrayLiteral(mapSource, 'ATTACK_TYPES')
const initialSources = extractArrayLiteral(mapSource, 'INITIAL_COUNTRIES_SRC')
const initialDestinations = extractArrayLiteral(mapSource, 'INITIAL_COUNTRIES_DST')

if (!regions.length) {
  console.warn('Location map data: Unable to parse regions from 2dMap.jsx; real-time thread disabled.')
} else {
  seedInitialFeatures()
  pruneFlows()
}
