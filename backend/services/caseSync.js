import Case from '../models/Case.js'
import { getRecentCases } from './thehiveIntegration.js'
import logger from '../utils/logger.js'

const MAX_SOURCE_RETRY = 3
const RETRY_DELAY_BASE = 1500
let syncInterval = null

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildCaseData(hiveCase) {
  const caseId = hiveCase.id || hiveCase._id || hiveCase.caseId || hiveCase.number
  if (!caseId) {
    return null
  }

  const createdAt = hiveCase.createdAt || hiveCase._createdAt
  const updatedAt = hiveCase.updatedAt || hiveCase._updatedAt

  return {
    thehive_id: String(caseId),
    title: hiveCase.title || 'Untitled Case',
    description: hiveCase.description || '',
    severity: normalizeSeverity(hiveCase.severity),
    status: normalizeStatus(hiveCase.status),
    owner: hiveCase.owner || hiveCase.assignee || 'Unassigned',
    source: 'TheHive',
    tags: Array.isArray(hiveCase.tags) ? hiveCase.tags : [],
    artifacts: Array.isArray(hiveCase.artifacts) ? hiveCase.artifacts : [],
    created_at: parseHiveTimestamp(createdAt),
    updated_at: parseHiveTimestamp(updatedAt),
    metadata: {
      thehive_data: hiveCase,
      synced_at: new Date()
    }
  }
}

function parseHiveTimestamp(value) {
  if (!value) return new Date()

  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (typeof value === 'number') {
    return new Date(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) {
      return new Date()
    }

    if (/^\d+$/.test(trimmed)) {
      const asNumber = Number(trimmed)
      return Number.isFinite(asNumber) ? new Date(asNumber) : new Date()
    }

    if (trimmed.includes('T')) {
      if (!trimmed.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(trimmed)) {
        return new Date(`${trimmed}Z`)
      }
      return new Date(trimmed)
    }

    return new Date(trimmed)
  }

  return new Date()
}

/**
 * Sync cases from TheHive to MongoDB
 */
export const syncCasesFromTheHive = async () => {
  try {
    logger.info('Starting TheHive case sync...')

    let hiveCases = []
    let attempt = 0
    let lastError = null

    while (attempt < MAX_SOURCE_RETRY && (!hiveCases || hiveCases.length === 0)) {
      try {
        hiveCases = await getRecentCases(100)
        if (hiveCases && hiveCases.length > 0) {
          break
        }
      } catch (error) {
        lastError = error
        if (error?.response?.status === 404) {
          logger.warn('TheHive cases endpoint returned 404, aborting retry loop')
          break
        }
      }

      attempt += 1
      if (attempt < MAX_SOURCE_RETRY) {
        const delay = Math.min(RETRY_DELAY_BASE * Math.pow(2, attempt - 1), 10000)
        logger.warn(`Retrying TheHive case fetch (attempt ${attempt + 1}/${MAX_SOURCE_RETRY}) in ${delay}ms`)
        await sleep(delay)
      }
    }

    if (!hiveCases || hiveCases.length === 0) {
      const reason = lastError ? lastError.message : 'No cases available from source'
      logger.warn(`Case sync skipped: ${reason}`)
      return { synced: 0, updated: 0, total: 0 }
    }

    let synced = 0
    let updated = 0
    let skipped = 0
    const errors = []

    for (const hiveCase of hiveCases) {
      try {
        const caseData = buildCaseData(hiveCase)
        if (!caseData) {
          skipped += 1
          logger.warn('Skipping case without stable identifier', { hiveCase })
          continue
        }

        const existingCase = await Case.findOne({ thehive_id: caseData.thehive_id })

        if (existingCase) {
          await Case.findByIdAndUpdate(existingCase._id, caseData, { new: true, runValidators: true })
          updated += 1
        } else {
          await Case.create(caseData)
          synced += 1
        }
      } catch (error) {
        errors.push(error.message)
        logger.error('Error syncing individual case', {
          error: error.message,
          caseId: hiveCase?.id || hiveCase?._id || hiveCase?.caseId || hiveCase?.number
        })
      }
    }

    logger.info(`Case sync completed: ${synced} new, ${updated} updated, ${skipped} skipped, ${errors.length} errors`)
    return { synced, updated, skipped, errors, total: hiveCases.length }
  } catch (error) {
    logger.error('Error syncing cases from TheHive:', error.message)
    throw error
  }
}

/**
 * Normalize severity from TheHive format into numeric scale (1-4)
 */
const normalizeSeverity = (severity) => {
  if (severity === undefined || severity === null) return 2

  if (typeof severity === 'number' && Number.isFinite(severity)) {
    const clamped = Math.max(1, Math.min(4, Math.round(severity)))
    return clamped
  }

  const s = String(severity).toLowerCase().trim()
  if (s.includes('critical')) return 4
  if (s.includes('high')) return 3
  if (s.includes('medium')) return 2
  if (s.includes('low')) return 1
  return 2
}

/**
 * Normalize status from TheHive format to schema enum values
 */
const normalizeStatus = (status) => {
  if (!status) return 'Open'
  const s = String(status).toLowerCase().trim()
  if (s.includes('closed')) return 'Closed'
  if (s.includes('resolved')) return 'Resolved'
  if (s.includes('progress') || s.includes('in-progress') || s.includes('in_progress')) return 'InProgress'
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
