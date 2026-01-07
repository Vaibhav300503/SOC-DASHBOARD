/**
 * Timestamp formatting utility
 * Handles timezone-aware formatting of timestamps
 */

/**
 * Format timestamp to local time string
 * @param {string|Date|number} timestamp - ISO string, Date object, or milliseconds
 * @param {string} format - Format type: 'time', 'date', 'datetime', 'relative'
 * @returns {string} Formatted timestamp
 */
export const formatTimestamp = (timestamp, format = 'datetime') => {
  if (!timestamp) return 'N/A'

  try {
    // Parse timestamp
    let date
    if (typeof timestamp === 'string') {
      // If timestamp has timezone info, use it as-is
      if (timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('UTC')) {
        date = new Date(timestamp)
      } else if (timestamp.includes('T')) {
        // Assume ISO without timezone is already local time
        date = new Date(timestamp)
      } else {
        date = new Date(timestamp)
      }
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp)
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      return 'Invalid'
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid'
    }

    // Format based on type - use UTC to avoid any local conversion
    switch (format) {
      case 'time':
        return date.toUTCString().split(' ')[4] || date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'UTC'
        })

      case 'date':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        })

      case 'datetime':
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'UTC'
        })

      case 'relative':
        return getRelativeTime(date)

      default:
        return date.toLocaleString('en-US', { timeZone: 'UTC' })
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error)
    return 'Error'
  }
}

/**
 * Get relative time string (e.g., "5 minutes ago")
 * @param {Date} date - Date object
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format timestamp for display in tables
 * @param {string|Date|number} timestamp - ISO string, Date object, or milliseconds
 * @returns {string} Formatted timestamp
 */
export const formatTableTimestamp = (timestamp) => {
  return formatTimestamp(timestamp, 'datetime')
}

/**
 * Format timestamp for display in logs
 * @param {string|Date|number} timestamp - ISO string, Date object, or milliseconds
 * @returns {string} Formatted timestamp
 */
export const formatLogTimestamp = (timestamp) => {
  return formatTimestamp(timestamp, 'datetime')
}

/**
 * Format timestamp for display in tooltips
 * @param {string|Date|number} timestamp - ISO string, Date object, or milliseconds
 * @returns {string} Formatted timestamp
 */
export const formatTooltipTimestamp = (timestamp) => {
  return formatTimestamp(timestamp, 'datetime')
}

/**
 * Format timestamp for display in cards
 * @param {string|Date|number} timestamp - ISO string, Date object, or milliseconds
 * @returns {string} Formatted timestamp
 */
export const formatCardTimestamp = (timestamp) => {
  return formatTimestamp(timestamp, 'relative')
}

export default {
  formatTimestamp,
  getRelativeTime,
  formatTableTimestamp,
  formatLogTimestamp,
  formatTooltipTimestamp,
  formatCardTimestamp
}
