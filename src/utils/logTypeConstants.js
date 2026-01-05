/**
 * Log Type Constants
 * Standardized log type categories and display names
 * Part of Task 3.1: Update LogsDisplay.vue Filtering Logic
 */

// The 8 standardized log type categories
export const STANDARD_LOG_TYPES = [
  'auth',
  'network', 
  'firewall',
  'application',
  'database',
  'system',
  'registry',
  'fim'
];

// User-friendly display names for categories
export const CATEGORY_DISPLAY_NAMES = {
  'auth': 'Authentication',
  'network': 'Network',
  'firewall': 'Firewall', 
  'application': 'Application',
  'database': 'Database',
  'system': 'System',
  'registry': 'Registry',
  'fim': 'File Integrity'
};

// Category descriptions for tooltips/help text
export const CATEGORY_DESCRIPTIONS = {
  'auth': 'Authentication and authorization events',
  'network': 'Network traffic, connections, and protocols',
  'firewall': 'Firewall rules, blocks, allows, and denies',
  'application': 'Application-specific logs and events',
  'database': 'Database operations and queries',
  'system': 'Operating system events and processes',
  'registry': 'Windows registry modifications',
  'fim': 'File Integrity Monitoring events'
};

// Category colors for UI consistency
export const CATEGORY_COLORS = {
  'auth': {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    hover: 'hover:bg-blue-500/20'
  },
  'network': {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30', 
    text: 'text-green-400',
    hover: 'hover:bg-green-500/20'
  },
  'firewall': {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400', 
    hover: 'hover:bg-red-500/20'
  },
  'application': {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    hover: 'hover:bg-purple-500/20'
  },
  'database': {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    hover: 'hover:bg-yellow-500/20'
  },
  'system': {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    hover: 'hover:bg-gray-500/20'
  },
  'registry': {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    hover: 'hover:bg-orange-500/20'
  },
  'fim': {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    hover: 'hover:bg-cyan-500/20'
  }
};

// Default category for unmatched log types
export const DEFAULT_LOG_TYPE = 'system';

/**
 * Get display name for a log type category
 * @param {string} category - The log type category
 * @returns {string} - User-friendly display name
 */
export function getDisplayName(category) {
  return CATEGORY_DISPLAY_NAMES[category] || category;
}

/**
 * Get description for a log type category
 * @param {string} category - The log type category
 * @returns {string} - Category description
 */
export function getDescription(category) {
  return CATEGORY_DESCRIPTIONS[category] || 'Unknown log type category';
}

/**
 * Get color classes for a log type category
 * @param {string} category - The log type category
 * @returns {Object} - Color class object
 */
export function getCategoryColors(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS[DEFAULT_LOG_TYPE];
}

/**
 * Check if a category is valid
 * @param {string} category - The log type category to validate
 * @returns {boolean} - True if valid category
 */
export function isValidCategory(category) {
  return STANDARD_LOG_TYPES.includes(category);
}

/**
 * Get all categories with their display names
 * @returns {Array<Object>} - Array of {value, label} objects
 */
export function getCategoryOptions() {
  return STANDARD_LOG_TYPES.map(category => ({
    value: category,
    label: getDisplayName(category),
    description: getDescription(category),
    colors: getCategoryColors(category)
  }));
}