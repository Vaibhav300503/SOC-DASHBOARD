import axios from 'axios'

const {
  CORTEX_BASE_URL,
  CORTEX_API_KEY,
  CORTEX_AUTH_HEADER,
  CORTEX_ANALYZER_IDS,
  CORTEX_ANALYZERS_PATH
} = process.env

const isConfigured = () => {
  return !!CORTEX_BASE_URL && !!(CORTEX_API_KEY || CORTEX_AUTH_HEADER) && !!CORTEX_ANALYZER_IDS
}

const getClient = () => {
  if (!isConfigured()) return null

  const authHeader = CORTEX_AUTH_HEADER || `Bearer ${CORTEX_API_KEY}`

  return axios.create({
    baseURL: CORTEX_BASE_URL,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json'
    },
    timeout: 5000
  })
}

/**
 * Trigger Cortex analyzers for a given alert event.
 * Returns an array of job IDs if successful.
 */
export const triggerAnalyzersForAlert = async (alertEvent) => {
  try {
    const client = getClient()
    if (!client) {
      return []
    }

    const analyzerIds = CORTEX_ANALYZER_IDS.split(',').map(id => id.trim()).filter(Boolean)
    if (analyzerIds.length === 0) {
      return []
    }

    const jobs = []

    for (const analyzerId of analyzerIds) {
      // Use the correct endpoint format: /api/analyzer/{id}/run
      const path = `/api/analyzer/${analyzerId}/run`
      const payload = {
        data: alertEvent.source_ip || alertEvent.dest_ip,
        dataType: 'ip',
        tlp: 2,
        pap: 2,
        message: alertEvent.title || 'SOC dashboard alert'
      }

      try {
        const response = await client.post(path, payload)
        if (response.data && (response.data.id || response.data._id)) {
          jobs.push(response.data.id || response.data._id)
        }
      } catch (innerError) {
        console.error(`Cortex trigger analyzer ${analyzerId} error:`, innerError.message)
      }
    }

    return jobs
  } catch (error) {
    console.error('Cortex triggerAnalyzersForAlert error:', error.message)
    return []
  }
}
