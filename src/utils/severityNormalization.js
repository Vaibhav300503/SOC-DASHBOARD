/**
 * Centralized severity normalization utility
 * Ensures consistent severity mapping across the entire SOC dashboard
 * 
 * This is the single source of truth for severity classification
 */

/**
 * Normalize any severity value to standard format
 * @param {string|null|undefined} severity - Raw severity value from backend
 * @returns {string} - Normalized severity: 'Critical', 'High', 'Medium', 'Low'
 */
export const normalizeSeverity = (severity) => {
  if (!severity) return 'Low'
  
  const s = String(severity).toLowerCase().trim()
  
  if (s.includes('critical')) return 'Critical'
  if (s.includes('high')) return 'High'
  if (s.includes('medium')) return 'Medium'
  if (s.includes('low')) return 'Low'
  
  return 'Low'
}

/**
 * Get CSS class for severity badge
 * @param {string|null|undefined} severity - Raw severity value
 * @returns {string} - CSS class name (lowercase)
 */
export const getSeverityClass = (severity) => {
  const normalized = normalizeSeverity(severity)
  return normalized.toLowerCase()
}

/**
 * Get display label for severity
 * @param {string|null|undefined} severity - Raw severity value
 * @returns {string} - Display label
 */
export const getSeverityLabel = (severity) => {
  return normalizeSeverity(severity)
}

/**
 * Get severity color for UI
 * @param {string|null|undefined} severity - Raw severity value
 * @returns {string} - Hex color code
 */
export const getSeverityColor = (severity) => {
  const normalized = normalizeSeverity(severity)
  
  const colors = {
    'Critical': '#ff0055',
    'High': '#ff6b35',
    'Medium': '#ffd700',
    'Low': '#00ff88'
  }
  
  return colors[normalized] || colors['Low']
}

/**
 * Severity levels in order of priority
 */
export const SEVERITY_LEVELS = ['Critical', 'High', 'Medium', 'Low']

/**
 * Severity priority map for sorting
 */
export const SEVERITY_PRIORITY = {
  'Critical': 4,
  'High': 3,
  'Medium': 2,
  'Low': 1
}

/**
 * Sort items by severity (highest to lowest)
 * @param {Array} items - Items with severity property
 * @returns {Array} - Sorted items
 */
export const sortBySeverity = (items) => {
  return [...items].sort((a, b) => {
    const priorityA = SEVERITY_PRIORITY[normalizeSeverity(a.severity)] || 0
    const priorityB = SEVERITY_PRIORITY[normalizeSeverity(b.severity)] || 0
    return priorityB - priorityA
  })
}

export default {
  normalizeSeverity,
  getSeverityClass,
  getSeverityLabel,
  getSeverityColor,
  SEVERITY_LEVELS,
  SEVERITY_PRIORITY,
  sortBySeverity
}
