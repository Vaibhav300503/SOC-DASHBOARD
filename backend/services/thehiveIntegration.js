import axios from 'axios'
import Case from '../models/Case.js'

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

  const authHeader = THEHIVE_AUTH_HEADER || `Bearer ${THEHIVE_API_KEY}`

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

    // Convert severity to numeric value for TheHive
    const getSeverityValue = (severity) => {
      switch (severity?.toLowerCase()) {
        case 'critical': return 4
        case 'high': return 3
        case 'medium': return 2
        case 'low': return 1
        default: return 2
      }
    }

    const payload = {
      type: 'external',
      source: 'SOC Dashboard',
      sourceRef: `soc-${Date.now()}-${alertEvent._id || 'unknown'}`,
      title: alertEvent.title,
      description: alertEvent.description,
      severity: getSeverityValue(alertEvent.severity),
      tags: ['soc-dashboard'],
      artifacts: [
        alertEvent.source_ip && {
          dataType: 'ip',
          data: alertEvent.source_ip,
          message: 'Source IP'
        },
        alertEvent.dest_ip && {
          dataType: 'ip',
          data: alertEvent.dest_ip,
          message: 'Destination IP'
        }
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
 * Falls back to MongoDB if TheHive is unavailable.
 */
export const getRecentCases = async (limit = 20) => {
  try {
    // First attempt: TheHive API
    const client = getClient()
    if (client) {
      const path = process.env.THEHIVE_CASES_PATH || '/api/v1/case'
      const params = { sort: '-createdAt', range: `0-${limit - 1}` }

      const response = await client.get(path, { params })
      const hiveData = Array.isArray(response.data) ? response.data : []

      if (hiveData.length > 0) {
        console.log(`✅ TheHive: Retrieved ${hiveData.length} cases`)
        return hiveData.map(hiveCase => ({
          ...hiveCase,
          source: 'TheHive',
          // Normalize field names for frontend consistency
          id: hiveCase.id || hiveCase._id,
          createdAt: hiveCase.createdAt || hiveCase._createdAt,
          severity: hiveCase.severity || 1
        }))
      }
    }

    // Fallback: MongoDB cases collection
    console.log('⚠️  TheHive unavailable or empty, falling back to MongoDB')
    const mongoCases = await Case.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .lean()

    if (mongoCases.length > 0) {
      console.log(`✅ MongoDB: Retrieved ${mongoCases.length} cases`)
      return mongoCases.map(mongoCase => ({
        ...mongoCase,
        source: 'MongoDB',
        // Normalize field names for frontend consistency
        id: mongoCase._id,
        createdAt: mongoCase.created_at,
        _createdAt: mongoCase.created_at
      }))
    }

    // If both sources are empty, create sample cases for demo
    console.log('⚠️  No cases found in TheHive or MongoDB, creating sample cases')
    const sampleCases = await createSampleCases()
    return sampleCases

  } catch (error) {
    console.error('getRecentCases error:', error.message)

    // Final fallback: try MongoDB even if there was an error
    try {
      const mongoCases = await Case.find()
        .sort({ created_at: -1 })
        .limit(limit)
        .lean()

      return mongoCases.map(mongoCase => ({
        ...mongoCase,
        source: 'MongoDB',
        id: mongoCase._id,
        createdAt: mongoCase.created_at,
        _createdAt: mongoCase.created_at
      }))
    } catch (mongoError) {
      console.error('MongoDB fallback error:', mongoError.message)
      return []
    }
  }
}

/**
 * Create sample cases for demonstration when no real cases exist
 */
const createSampleCases = async () => {
  try {
    const sampleCases = [
      {
        title: 'Suspicious Login Activity',
        description: 'Multiple failed login attempts detected from unusual location',
        severity: 3,
        status: 'Open',
        owner: 'security-team',
        tags: ['authentication', 'suspicious-activity']
      },
      {
        title: 'Malware Detection Alert',
        description: 'Potential malware detected on endpoint DESKTOP-ABC123',
        severity: 4,
        status: 'InProgress',
        owner: 'incident-response',
        tags: ['malware', 'endpoint-security']
      },
      {
        title: 'Network Anomaly',
        description: 'Unusual network traffic patterns detected',
        severity: 2,
        status: 'Open',
        owner: 'network-team',
        tags: ['network', 'anomaly']
      }
    ]

    const createdCases = []
    for (const caseData of sampleCases) {
      const existingCase = await Case.findOne({ title: caseData.title })
      if (!existingCase) {
        const newCase = new Case(caseData)
        await newCase.save()
        createdCases.push({
          ...newCase.toObject(),
          source: 'MongoDB',
          id: newCase._id,
          createdAt: newCase.created_at,
          _createdAt: newCase.created_at
        })
      }
    }

    console.log(`✅ Created ${createdCases.length} sample cases`)
    return createdCases
  } catch (error) {
    console.error('Error creating sample cases:', error.message)
    return []
  }
}
