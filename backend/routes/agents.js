import express from 'express'
import Agent from '../models/Agent.js'

const router = express.Router()

/**
 * GET /api/agents
 * Get all agents with status calculation
 */
router.get('/', async (req, res) => {
    try {
        const agents = await Agent.find().sort({ endpoint_name: 1 })
        
        // Calculate status based on last_seen
        const now = new Date()
        const inactiveThreshold = 5 * 60 * 1000 // 5 minutes
        
        const agentsWithStatus = agents.map(agent => {
            const agentObj = agent.toObject()
            
            if (!agentObj.last_seen) {
                agentObj.status = 'inactive'
            } else {
                const timeSinceLastSeen = now - new Date(agentObj.last_seen)
                if (timeSinceLastSeen > inactiveThreshold) {
                    agentObj.status = 'inactive'
                } else {
                    agentObj.status = agentObj.status || 'active'
                }
            }
            
            return agentObj
        })
        
        res.json({ success: true, data: agentsWithStatus })
    } catch (error) {
        console.error('Error fetching agents:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * POST /api/agents/sync
 * Sync endpoints from logs to agents collection
 */
router.post('/sync', async (req, res) => {
    try {
        const { endpoints } = req.body
        
        if (!Array.isArray(endpoints) || endpoints.length === 0) {
            return res.status(400).json({ success: false, error: 'endpoints array is required' })
        }
        
        console.log(`🔄 Syncing ${endpoints.length} endpoints to agents collection...`)
        
        const syncResults = []
        
        for (const endpoint of endpoints) {
            try {
                const agent = await Agent.findOneAndUpdate(
                    { agent_id: endpoint.endpoint_name || endpoint._id },
                    {
                        agent_id: endpoint.endpoint_name || endpoint._id,
                        endpoint_name: endpoint.endpoint_name || endpoint._id,
                        hostname: endpoint.hostname || endpoint.endpoint_name || endpoint._id,
                        ip_address: endpoint.ip_address || 'N/A',
                        os_type: endpoint.os_type || 'Unknown',
                        status: endpoint.status || 'active',
                        last_seen: endpoint.last_seen || new Date(),
                        first_registered: new Date(),
                        labels: ['auto-synced-from-logs']
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                )
                
                syncResults.push({
                    endpoint_name: endpoint.endpoint_name || endpoint._id,
                    status: 'synced',
                    agent_id: agent._id
                })
            } catch (err) {
                console.error(`Error syncing endpoint ${endpoint.endpoint_name}:`, err)
                syncResults.push({
                    endpoint_name: endpoint.endpoint_name || endpoint._id,
                    status: 'error',
                    error: err.message
                })
            }
        }
        
        console.log(`✅ Sync completed: ${syncResults.filter(r => r.status === 'synced').length}/${endpoints.length} endpoints synced`)
        
        res.json({ 
            success: true, 
            message: `Synced ${syncResults.filter(r => r.status === 'synced').length}/${endpoints.length} endpoints`,
            results: syncResults 
        })
    } catch (error) {
        console.error('Error syncing endpoints:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * POST /api/agents
 * Register or update an agent
 */
router.post('/', async (req, res) => {
    try {
        const { agent_id, endpoint_name, hostname, ip_address, os_type, status, agent_version, labels } = req.body

        if (!agent_id || !endpoint_name) {
            return res.status(400).json({ success: false, error: 'agent_id and endpoint_name are required' })
        }

        const agent = await Agent.findOneAndUpdate(
            { agent_id },
            {
                endpoint_name,
                hostname,
                ip_address,
                os_type,
                status: status || 'active',
                agent_version,
                labels: labels || [],
                last_seen: new Date(),
                first_registered: new Date() // Only set on first creation
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

/**
 * POST /api/agents/:id/heartbeat
 * Agent heartbeat to update last_seen
 */
router.post('/:id/heartbeat', async (req, res) => {
    try {
        const { metrics, status } = req.body
        
        const agent = await Agent.findByIdAndUpdate(
            req.params.id,
            {
                last_seen: new Date(),
                status: status || 'active',
                ...(metrics && { stats: metrics })
            },
            { new: true }
        )
        
        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' })
        }
        
        res.json({ success: true, data: agent })
    } catch (error) {
        console.error('Error updating agent heartbeat:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * POST /api/agents/heartbeat
 * Agent heartbeat by agent_id
 */
router.post('/heartbeat', async (req, res) => {
    try {
        const { agent_id, metrics, status } = req.body
        
        if (!agent_id) {
            return res.status(400).json({ success: false, error: 'agent_id is required' })
        }
        
        const agent = await Agent.findOneAndUpdate(
            { agent_id },
            {
                last_seen: new Date(),
                status: status || 'active',
                ...(metrics && { stats: metrics })
            },
            { new: true }
        )
        
        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' })
        }
        
        res.json({ success: true, data: agent })
    } catch (error) {
        console.error('Error updating agent heartbeat:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
