import express from 'express'
import Agent from '../models/Agent.js'

const router = express.Router()

/**
 * GET /api/agents
 * Get all agents
 */
router.get('/', async (req, res) => {
    try {
        const agents = await Agent.find().sort({ name: 1 })
        res.json({ success: true, data: agents })
    } catch (error) {
        console.error('Error fetching agents:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * POST /api/agents
 * Register or update an agent
 */
router.post('/', async (req, res) => {
    try {
        const { name, hostname, ip, status, os, version, description } = req.body

        if (!name) {
            return res.status(400).json({ success: false, error: 'Agent name is required' })
        }

        const agent = await Agent.findOneAndUpdate(
            { name },
            {
                hostname,
                ip,
                status: status || 'online',
                os,
                version,
                description,
                lastSeen: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        res.json({ success: true, data: agent })
    } catch (error) {
        console.error('Error saving agent:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * GET /api/agents/:id
 * Get a specific agent
 */
router.get('/:id', async (req, res) => {
    try {
        const agent = await Agent.findById(req.params.id)
        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' })
        }
        res.json({ success: true, data: agent })
    } catch (error) {
        console.error('Error fetching agent:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * DELETE /api/agents/:id
 * Delete an agent
 */
router.delete('/:id', async (req, res) => {
    try {
        const agent = await Agent.findByIdAndDelete(req.params.id)
        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' })
        }
        res.json({ success: true, message: 'Agent deleted successfully' })
    } catch (error) {
        console.error('Error deleting agent:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
