import express from 'express'
import caseService from '../services/caseService.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/cases/recent
 * Get recent cases with hybrid data source fallback
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20
    const cases = await caseService.getRecentCases(limit)
    
    res.json({
      success: true,
      data: cases,
      count: cases.length,
      source: cases.length > 0 ? cases[0].source : null
    })
  } catch (error) {
    logger.error('Cases API: Failed to get recent cases', { error: error.message })
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cases',
      message: error.message
    })
  }
})

/**
 * GET /api/cases/:id
 * Get a specific case by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const case_ = await caseService.getCaseById(id)
    
    if (!case_) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      })
    }
    
    res.json({
      success: true,
      data: case_
    })
  } catch (error) {
    logger.error('Cases API: Failed to get case by ID', { id: req.params.id, error: error.message })
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve case',
      message: error.message
    })
  }
})

/**
 * POST /api/cases
 * Create a new case
 */
router.post('/', async (req, res) => {
  try {
    const caseData = req.body
    
    // Basic validation
    if (!caseData.title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      })
    }
    
    const newCase = await caseService.createCase(caseData)
    
    res.status(201).json({
      success: true,
      data: newCase
    })
  } catch (error) {
    logger.error('Cases API: Failed to create case', { error: error.message })
    res.status(500).json({
      success: false,
      error: 'Failed to create case',
      message: error.message
    })
  }
})

/**
 * PATCH /api/cases/:id
 * Update an existing case
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const updatedCase = await caseService.updateCase(id, updates)
    
    res.json({
      success: true,
      data: updatedCase
    })
  } catch (error) {
    logger.error('Cases API: Failed to update case', { id: req.params.id, error: error.message })
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update case',
      message: error.message
    })
  }
})

/**
 * GET /api/cases/health/check
 * Health check endpoint to test data source availability
 */
router.get('/health/check', async (req, res) => {
  try {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      sources: {}
    }
    
    // Test TheHive connectivity
    try {
      await caseService.fetchFromTheHive(1)
      healthStatus.sources.theHive = { status: 'available', error: null }
    } catch (error) {
      healthStatus.sources.theHive = { status: 'unavailable', error: error.message }
    }
    
    // Test MongoDB connectivity
    try {
      await caseService.fetchFromMongoDB(1)
      healthStatus.sources.mongoDB = { status: 'available', error: null }
    } catch (error) {
      healthStatus.sources.mongoDB = { status: 'unavailable', error: error.message }
    }
    
    const allSourcesDown = Object.values(healthStatus.sources).every(source => source.status === 'unavailable')
    
    res.status(allSourcesDown ? 503 : 200).json({
      success: !allSourcesDown,
      data: healthStatus
    })
  } catch (error) {
    logger.error('Cases API: Health check failed', { error: error.message })
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    })
  }
})

export default router