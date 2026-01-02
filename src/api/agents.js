import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'

export const agentsAPI = {
    /**
     * Get all agents
     */
    async getAll() {
        try {
            const response = await axios.get(`${API_BASE}/agents`)
            return response.data
        } catch (error) {
            console.error('Error fetching agents:', error)
            throw error
        }
    },

    /**
     * Register or update agent
     */
    async save(agentData) {
        try {
            const response = await axios.post(`${API_BASE}/agents`, agentData)
            return response.data
        } catch (error) {
            console.error('Error saving agent:', error)
            throw error
        }
    },

    /**
     * Delete agent
     */
    async delete(id) {
        try {
            const response = await axios.delete(`${API_BASE}/agents/${id}`)
            return response.data
        } catch (error) {
            console.error('Error deleting agent:', error)
            throw error
        }
    }
}
