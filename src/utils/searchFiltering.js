import { normalizeSeverity } from './severityNormalization'

/**
 * UNIFIED SEARCH & FILTERING UTILITY
 * Single source of truth for all filtering logic
 * 
 * CRITICAL: All pages must use these functions
 * Ensures consistent filtering order and behavior
 */

/**
 * Normalize a log entry before filtering
 * CRITICAL: Must be called FIRST before any filtering
 * 
 * Normalizes:
 * - Severity (case-insensitive)
 * - IP addresses (trim whitespace)
 * - Hostnames (lowercase)
 * - Timestamps (ISO format)
 * - All string fields (trim)
 */
export const normalizeLog = (log) => {
  if (!log) return null
  
  return {
    ...log,
    // Normalize severity
    severity: normalizeSeverity(log.severity),
    
    // Normalize IPs
    source_ip: (log.source_ip || '').trim(),
    dest_ip: (log.dest_ip || '').trim(),
    
    // Normalize strings
    endpoint: (log.endpoint || '').toLowerCase().trim(),
    log_type: (log.log_type || '').toLowerCase().trim(),
    computer: (log.computer || '').toLowerCase().trim(),
    
    // Normalize action
    action: (log.raw?.action || log.raw_data?.action || log.action || '').toUpperCase().trim(),
    
    // Normalize geo
    geo_country: (log.geo?.country || '').toLowerCase().trim(),
    geo_city: (log.geo?.city || '').toLowerCase().trim(),
    
    // Normalize timestamp
    timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : null
  }
}

/**
 * Apply severity filter
 * CRITICAL: Must use normalized severity
 */
export const applySeverityFilter = (log, severity) => {
  if (!severity) return true
  // Normalize both the log severity and filter value for comparison
  const normalizedFilterSeverity = normalizeSeverity(severity)
  return log.severity === normalizedFilterSeverity
}

/**
 * Apply log type filter
 */
export const applyLogTypeFilter = (log, logType) => {
  if (!logType) return true
  return log.log_type === logType.toLowerCase()
}

/**
 * Apply time range filter
 * CRITICAL: Must be done BEFORE search (time-based optimization)
 */
export const applyTimeRangeFilter = (log, timeRange) => {
  if (!timeRange || timeRange === 'all') return true
  
  const now = new Date()
  const logTime = new Date(log.timestamp)
  const diffMs = now - logTime
  
  const ranges = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  }
  
  const rangeMs = ranges[timeRange]
  return rangeMs ? diffMs <= rangeMs : true
}

/**
 * Apply action filter
 */
export const applyActionFilter = (log, action) => {
  if (!action) return true
  return log.action === action.toUpperCase()
}

/**
 * Apply IP filters (exact match)
 * CRITICAL: Uses exact match, not partial
 */
export const applyIPFilters = (log, sourceIP, destIP) => {
  if (sourceIP && log.source_ip !== sourceIP) return false
  if (destIP && log.dest_ip !== destIP) return false
  return true
}

/**
 * Apply endpoint filter
 */
export const applyEndpointFilter = (log, endpoint) => {
  if (!endpoint) return true
  return log.endpoint === endpoint.toLowerCase()
}

/**
 * Apply geo filters
 */
export const applyGeoFilters = (log, country, city) => {
  if (country && log.geo_country !== country.toLowerCase()) return false
  if (city && log.geo_city !== city.toLowerCase()) return false
  return true
}

/**
 * Apply search query filter
 * CRITICAL: Must be called AFTER all other filters
 * Searches normalized fields only (not entire JSON)
 */
export const applySearchQuery = (log, query) => {
  if (!query || query.length === 0) return true
  
  const q = query.toLowerCase()
  
  // Search in specific fields only (not entire JSON)
  const searchableFields = [
    log.source_ip,
    log.dest_ip,
    log.endpoint,
    log.log_type,
    log.computer,
    log.severity,
    log.action,
    log.geo_country,
    log.geo_city,
    log.raw?.description || '',
    log.raw?.message || '',
    log.raw_data?.description || '',
    log.raw_data?.message || ''
  ]
  
  return searchableFields.some(field => 
    field && String(field).toLowerCase().includes(q)
  )
}

/**
 * MAIN FILTERING FUNCTION
 * CRITICAL: This is the ONLY filtering function that should be used
 * 
 * Correct order:
 * 1. Normalize log
 * 2. Apply time range (optimization)
 * 3. Apply severity filter
 * 4. Apply log type filter
 * 5. Apply action filter
 * 6. Apply IP filters
 * 7. Apply endpoint filter
 * 8. Apply geo filters
 * 9. Apply search query (last)
 */
export const filterLog = (log, searchState) => {
  if (!log) return false
  
  // Step 1: Normalize
  const normalized = normalizeLog(log)
  
  // Step 2: Time range (optimization - do first)
  if (!applyTimeRangeFilter(normalized, searchState.filters.timeRange)) {
    return false
  }
  
  // Step 3: Severity
  if (!applySeverityFilter(normalized, searchState.filters.severity)) {
    return false
  }
  
  // Step 4: Log type
  if (!applyLogTypeFilter(normalized, searchState.filters.logType)) {
    return false
  }
  
  // Step 5: Action
  if (!applyActionFilter(normalized, searchState.filters.action)) {
    return false
  }
  
  // Step 6: IP filters
  if (!applyIPFilters(normalized, searchState.filters.sourceIP, searchState.filters.destIP)) {
    return false
  }
  
  // Step 7: Endpoint
  if (!applyEndpointFilter(normalized, searchState.filters.endpoint)) {
    return false
  }
  
  // Step 8: Geo
  if (!applyGeoFilters(normalized, searchState.filters.country, searchState.filters.city)) {
    return false
  }
  
  // Step 9: Search query (last)
  if (!applySearchQuery(normalized, searchState.searchQuery)) {
    return false
  }
  
  return true
}

/**
 * Filter array of logs
 * Returns normalized logs
 */
export const filterLogs = (logs, searchState) => {
  if (!logs || !Array.isArray(logs)) return []
  
  return logs
    .map(normalizeLog)
    .filter(log => filterLog(log, searchState))
}

/**
 * Validate IP address format
 */
export const isValidIP = (ip) => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipRegex.test(ip.trim())
}

/**
 * Validate CIDR notation
 */
export const isValidCIDR = (cidr) => {
  const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/
  return cidrRegex.test(cidr.trim())
}

/**
 * Validate hostname
 */
export const isValidHostname = (hostname) => {
  const hostnameRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
  return hostnameRegex.test(hostname.trim())
}

export default {
  normalizeLog,
  applySeverityFilter,
  applyLogTypeFilter,
  applyTimeRangeFilter,
  applyActionFilter,
  applyIPFilters,
  applyEndpointFilter,
  applyGeoFilters,
  applySearchQuery,
  filterLog,
  filterLogs,
  isValidIP,
  isValidCIDR,
  isValidHostname
}
