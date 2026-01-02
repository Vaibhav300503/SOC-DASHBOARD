import AlertEvent from '../models/AlertEvent.js'
import { createAlertFromEvent } from './thehiveIntegration.js'
import { triggerAnalyzersForAlert } from './cortexIntegration.js'

/**
 * Handle downstream integrations when a new internal alert event is created.
 * This function is fire-and-forget from the HTTP handler to avoid adding
 * latency to the alert creation API.
 */
export const handleAlertIntegrations = async (alertEventDoc) => {
  try {
    // Reload the document to ensure we have the latest version
    const event = await AlertEvent.findById(alertEventDoc._id)
    if (!event) return

    let modified = false

    // TheHive: create alert
    const hiveResult = await createAlertFromEvent(event)
    if (hiveResult) {
      if (hiveResult.id || hiveResult._id) {
        event.thehive_alert_id = hiveResult.id || hiveResult._id
      }
      event.metadata = {
        ...(event.metadata || {}),
        thehive: hiveResult
      }
      event.last_updated = new Date()
      modified = true
    }

    // Cortex: trigger analyzers
    const cortexJobs = await triggerAnalyzersForAlert(event)
    if (Array.isArray(cortexJobs) && cortexJobs.length > 0) {
      event.cortex_job_ids = cortexJobs
      event.analysis_status = 'running'
      event.last_updated = new Date()
      modified = true
    }

    if (modified) {
      await event.save()
    }
  } catch (error) {
    console.error('handleAlertIntegrations error:', error.message)
  }
}
