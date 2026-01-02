import axios from 'axios'
import NodeCache from 'node-cache'
import GeoCache from '../models/GeoCache.js'

/**
 * Geo Enrichment Service
 * Enriches IP addresses with geolocation data from ipwho.org
 * Caches results in MongoDB to avoid repeated API calls
 */

// In-memory cache (1 hour TTL)
const memCache = new NodeCache({ stdTTL: 3600 })

// Free IP geolocation APIs (no auth required)
const GEO_APIS = {
  ipwho: 'https://ipwho.is/json/',
  ipapi: 'https://ipapi.co/'
}

/**
 * Fetch geolocation data for an IP address
 * Tries multiple sources and caches result
 */
export async function enrichIPWithGeo(ip) {
  // Skip private/internal IPs
  if (isPrivateIP(ip)) {
    return getDefaultGeoForPrivateIP(ip)
  }

  // Check in-memory cache first
  const cached = memCache.get(ip)
  if (cached) {
    return cached
  }

  // Check MongoDB cache
  try {
    const dbCached = await GeoCache.findOne({ ip })
    if (dbCached && isRecentCache(dbCached.cached_at)) {
      memCache.set(ip, dbCached.geo_data)
      return dbCached.geo_data
    }
  } catch (err) {
    console.error('Error checking geo cache:', err.message)
  }

  // Fetch from external API
  let geoData = null

  // Try ipwho.is first (more reliable)
  try {
    geoData = await fetchFromIPWho(ip)
  } catch (err) {
    console.warn(`ipwho.is failed for ${ip}:`, err.message)
  }

  // Fallback to ipapi.co
  if (!geoData) {
    try {
      geoData = await fetchFromIPAPI(ip)
    } catch (err) {
      console.warn(`ipapi.co failed for ${ip}:`, err.message)
    }
  }

  // If both fail, return default
  if (!geoData) {
    geoData = getDefaultGeo(ip)
  }

  // Cache in memory
  memCache.set(ip, geoData)

  // Cache in MongoDB
  try {
    await GeoCache.updateOne(
      { ip },
      {
        ip,
        geo_data: geoData,
        cached_at: new Date()
      },
      { upsert: true }
    )
  } catch (err) {
    console.error('Error caching geo data:', err.message)
  }

  return geoData
}

/**
 * Fetch geolocation from ipwho.is
 */
async function fetchFromIPWho(ip) {
  try {
    const response = await axios.get(`${GEO_APIS.ipwho}${ip}`, {
      timeout: 5000
    })

    if (response.data.success === false) {
      throw new Error('IP not found')
    }

    return {
      ip,
      country: response.data.country || 'Unknown',
      country_code: response.data.country_code || 'XX',
      city: response.data.city || 'Unknown',
      latitude: response.data.latitude || 0,
      longitude: response.data.longitude || 0,
      asn: response.data.asn || null,
      isp: response.data.connection?.isp || 'Unknown',
      is_vpn: response.data.security?.is_vpn || false,
      is_proxy: response.data.security?.is_proxy || false,
      is_tor: response.data.security?.is_tor || false,
      source: 'ipwho.is'
    }
  } catch (error) {
    throw new Error(`ipwho.is error: ${error.message}`)
  }
}

/**
 * Fetch geolocation from ipapi.co
 */
async function fetchFromIPAPI(ip) {
  try {
    const response = await axios.get(`${GEO_APIS.ipapi}${ip}/json/`, {
      timeout: 5000
    })

    return {
      ip,
      country: response.data.country_name || 'Unknown',
      country_code: response.data.country_code || 'XX',
      city: response.data.city || 'Unknown',
      latitude: parseFloat(response.data.latitude) || 0,
      longitude: parseFloat(response.data.longitude) || 0,
      asn: response.data.asn || null,
      isp: response.data.org || 'Unknown',
      is_vpn: false,
      is_proxy: false,
      is_tor: false,
      source: 'ipapi.co'
    }
  } catch (error) {
    throw new Error(`ipapi.co error: ${error.message}`)
  }
}

/**
 * Check if IP is private/internal
 */
function isPrivateIP(ip) {
  const privateRanges = [
    /^127\./,           // Loopback
    /^10\./,            // Private
    /^172\.(1[6-9]|2[0-9]|3[01])\./,  // Private
    /^192\.168\./,      // Private
    /^169\.254\./,      // Link-local
    /^fc00:/,           // IPv6 private
    /^fe80:/,           // IPv6 link-local
    /^::1$/,            // IPv6 loopback
    /^100\./            // Tailscale
  ]

  return privateRanges.some(range => range.test(ip))
}

/**
 * Get default geo data for private IPs
 */
function getDefaultGeoForPrivateIP(ip) {
  // Map common private IP ranges to Indian cities
  const privateIPMap = {
    '127.0.0.1': { country: 'India', city: 'Localhost', lat: 19.0760, lon: 72.8777 },
    '127.0.0.53': { country: 'India', city: 'Localhost', lat: 19.0760, lon: 72.8777 },
    '192.168.1.1': { country: 'India', city: 'Delhi', lat: 28.6139, lon: 77.2090 },
    '192.168.1.33': { country: 'India', city: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    '192.168.1.34': { country: 'India', city: 'Bangalore', lat: 12.9716, lon: 77.5946 },
    '192.168.1.35': { country: 'India', city: 'Chennai', lat: 13.0827, lon: 80.2707 },
    '192.168.1.38': { country: 'India', city: 'Kolkata', lat: 22.5726, lon: 88.3639 },
    '192.168.118.128': { country: 'India', city: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
    '192.168.118.1': { country: 'India', city: 'Pune', lat: 18.5204, lon: 73.8567 },
    '172.19.0.1': { country: 'India', city: 'Jaipur', lat: 26.9124, lon: 75.7873 },
    '172.19.0.2': { country: 'India', city: 'Lucknow', lat: 26.8467, lon: 80.9462 },
    '172.19.0.3': { country: 'India', city: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
    '172.19.0.4': { country: 'India', city: 'Surat', lat: 21.1702, lon: 72.8311 },
    '172.19.0.5': { country: 'India', city: 'Nagpur', lat: 21.1458, lon: 79.0882 }
  }

  if (privateIPMap[ip]) {
    return {
      ip,
      country: privateIPMap[ip].country,
      country_code: 'IN',
      city: privateIPMap[ip].city,
      latitude: privateIPMap[ip].lat,
      longitude: privateIPMap[ip].lon,
      asn: null,
      isp: 'Private Network',
      is_vpn: false,
      is_proxy: false,
      is_tor: false,
      source: 'private_mapping'
    }
  }

  // Range-based matching for private IPs
  if (ip.startsWith('127.0.0.')) return { ...privateIPMap['127.0.0.1'], ip }
  if (ip.startsWith('192.168.1.')) return { ...privateIPMap['192.168.1.1'], ip }
  if (ip.startsWith('192.168.118.')) return { ...privateIPMap['192.168.118.1'], ip }
  if (ip.startsWith('172.19.0.')) return { ...privateIPMap['172.19.0.1'], ip }
  if (ip.startsWith('10.')) return { ...privateIPMap['192.168.1.1'], ip }
  if (ip.startsWith('100.')) return { ...privateIPMap['192.168.1.1'], ip } // Tailscale

  return getDefaultGeo(ip)
}

/**
 * Get default geo data for unknown IPs
 */
function getDefaultGeo(ip) {
  return {
    ip,
    country: 'Unknown',
    country_code: 'XX',
    city: 'Unknown',
    latitude: 0,
    longitude: 0,
    asn: null,
    isp: 'Unknown',
    is_vpn: false,
    is_proxy: false,
    is_tor: false,
    source: 'default'
  }
}

/**
 * Check if cache is recent (less than 7 days old)
 */
function isRecentCache(cachedAt) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return new Date(cachedAt) > sevenDaysAgo
}

/**
 * Batch enrich multiple IPs
 */
export async function enrichIPsBatch(ips) {
  const uniqueIPs = [...new Set(ips.filter(Boolean))]
  const results = await Promise.all(
    uniqueIPs.map(ip => enrichIPWithGeo(ip).catch(() => getDefaultGeo(ip)))
  )
  return results
}

/**
 * Clear old cache entries (older than 30 days)
 */
export async function cleanupOldCache() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const result = await GeoCache.deleteMany({
      cached_at: { $lt: thirtyDaysAgo }
    })
    console.log(`Cleaned up ${result.deletedCount} old geo cache entries`)
  } catch (err) {
    console.error('Error cleaning up geo cache:', err.message)
  }
}

export default {
  enrichIPWithGeo,
  enrichIPsBatch,
  cleanupOldCache
}
