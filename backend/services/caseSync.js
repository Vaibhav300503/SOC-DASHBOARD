import Case from '../models/Case.js'
import { getRecentCases } from './thehiveIntegration.js'
import logger from '../utils/logger.js'

let syncInterval = null

/**
 * Sync cases from TheHive to MongoDB
 */
export const syncCasesFromTheHive = async () => {
  try {
    logger.info('Starting TheHive case sync...')
    
    // Fetch recent cases from TheHive (fetch more to ensure we get all)
    const hiveCases = await getRecentCases(100)
    
    if (!hiveCases || hiveCases.length === 0) {
      logger.info('No cases found in TheHive')
      return
    }

    let synced = 0
    let updated = 0

    for (const hiveCase of hiveCases) {
      try {
        const caseId = hiveCase.id || hiveCase._id
        
        if (!caseId) {
          logger.warn('Case missing ID:', hiveCase)
          continue
        }

        // Check if case already exists
        const existingCase = await Case.findOne({ case_id: String(caseId) })

        const caseData = {
          case_id: String(caseId),
          thehive_case_id: hiveCase.caseId || hiveCase.number,
          title: hiveCase.title || 'Untitled Case',
          description: hiveCase.description || '',
          severity: normalizeSeverity(hiveCase.severity),
          status: normalizeStatus(hiveCase.status),
          created_at: hiveCase.createdAt ? new Date(hiveCase.createdAt) : new Date(),
          updated_at: hiveCase.updatedAt ? new Date(hiveCase.updatedAt) : new Date(),
          tags: hiveCase.tags || [],
          metadata: {
            thehive_data: hiveCase,
            synced_at: new Date()
          }
        }

        if (existingCase) {
          // Update existing case
          await Case.findByIdAndUpdate(existingCase._id, caseData, { new: true })
          updated++
        } else {
          // Create new case
          await Case.create(caseData)
          synced++
        }
      } catch (error) {
        logger.error('Error syncing individual case:', error.message)
      }
    }

    logger.info(`Case sync completed: ${synced} new, ${updated} updated`)
    return { synced, updated, total: hiveCases.length }
  } catch (error) {
    logger.error('Error syncing cases from TheHive:', error.message)
    throw error
  }
}

/**
 * Normalize severity from TheHive format
 */
const normalizeSeverity = (severity) => {
  if (!severity) return 'Medium'
  const s = String(severity).toLowerCase().trim()
  if (s.includes('critical')) return 'Critical'
  if (s.includes('high')) return 'High'
  if (s.includes('medium')) return 'Medium'
  if (s.includes('low')) return 'Low'
  return 'Medium'
}

/**
 * Normalize status from TheHive format
 */
const normalizeStatus = (status) => {
  if (!status) return 'Open'
  const s = String(status).toLowerCase().trim()
  if (s.includes('closed')) return 'Closed'
  if (s.includes('resolved')) return 'Resolved'
  if (s.includes('progress')) return 'In Progress'
  return 'Open'
}

/**
 * Start periodic case sync
 */
export const startCaseSync = (intervalMs = 300000) => {
  // Default: sync every 5 minutes
  if (syncInterval) {
    logger.warn('Case sync already running')
    return
  }

  logger.info(`Starting case sync with interval: ${intervalMs}ms`)
  
  // Sync immediately on start
  syncCasesFromTheHive().catch(err => {
    logger.error('Initial case sync failed:', err.message)
  })

  // Then sync periodically
  syncInterval = setInterval(() => {
    syncCasesFromTheHive().catch(err => {
      logger.error('Periodic case sync failed:', err.message)
    })
  }, intervalMs)
}

/**
 * Stop periodic case sync
 */
export const stopCaseSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    logger.info('Case sync stopped')
  }
}

export default {
  syncCasesFromTheHive,
  startCaseSync,
  stopCaseSync
}
