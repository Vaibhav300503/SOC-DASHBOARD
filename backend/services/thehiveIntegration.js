import axios from 'axios'

const {
  THEHIVE_BASE_URL,
  THEHIVE_API_KEY,
  THEHIVE_ALERTS_PATH,
  THEHIVE_AUTH_HEADER
} = process.env

const isConfigured = () => {
  return !!THEHIVE_BASE_URL && !!(THEHIVE_API_KEY || THEHIVE_AUTH_HEADER)
}

const getClient = () => {
  if (!isConfigured()) return null

  const authHeader = THEHIVE_AUTH_HEADER || THEHIVE_API_KEY

  return axios.create({
    baseURL: THEHIVE_BASE_URL,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json'
    },
    timeout: 5000
  })
}

/**
 * Create a TheHive alert from an internal AlertEvent document.
 * The exact payload/paths are configurable via env to avoid coupling
 * to a specific TheHive deployment.
 */
export const createAlertFromEvent = async (alertEvent) => {
  try {
    const client = getClient()
    if (!client) {
      return null
    }

    const path = THEHIVE_ALERTS_PATH || '/api/v1/alert'

    const payload = {
      title: alertEvent.title,
      description: alertEvent.description,
      severity: alertEvent.severity,
      source: alertEvent.source_ip,
      destination: alertEvent.dest_ip,
      tags: ['soc-dashboard'],
      artifacts: [
        alertEvent.source_ip && { dataType: 'ip', data: alertEvent.source_ip },
        alertEvent.dest_ip && { dataType: 'ip', data: alertEvent.dest_ip }
      ].filter(Boolean)
    }

    const response = await client.post(path, payload)
    return response.data || null
  } catch (error) {
    console.error('TheHive createAlertFromEvent error:', error.message)
    return null
  }
}

/**
 * Fetch recent cases from TheHive for metrics/case views.
 * Endpoint/path is configurable via env.
 */
export const getRecentCases = async (limit = 20) => {
  try {
    const client = getClient()
    if (!client) {
      return []
    }

    const path = process.env.THEHIVE_CASES_PATH || '/api/v1/case'
    const params = { sort: '-createdAt', range: `0-${limit - 1}` }

    const response = await client.get(path, { params })
    const data = Array.isArray(response.data) ? response.data : []
    return data
  } catch (error) {
    console.error('TheHive getRecentCases error:', error.message)
    return []
  }
}
