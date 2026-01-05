// Test current authentication state
console.log('=== AUTHENTICATION STATE TEST ===')

// Check localStorage
console.log('localStorage user:', localStorage.getItem('user'))
console.log('localStorage demoMode:', localStorage.getItem('demoMode'))
console.log('localStorage loginTime:', localStorage.getItem('loginTime'))

// Test API call with current setup
import axios from 'axios'

const API_BASE = 'http://localhost:3002/api'

async function testAuthenticatedCall() {
  try {
    // Check if we have user data
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      console.log('Current user:', user)
      
      // Create demo token
      const demoToken = btoa(JSON.stringify({ 
        userId: user._id, 
        email: user.email,
        role: user.role,
        demo: true 
      }))
      
      console.log('Demo token:', demoToken)
      
      // Test API call with demo token
      const response = await axios.get(`${API_BASE}/alerts/cases/recent?limit=5`, {
        headers: {
          Authorization: `Bearer ${demoToken}`
        }
      })
      
      console.log('API Response:', response.data)
    } else {
      console.log('No user found in localStorage')
    }
  } catch (error) {
    console.error('API call failed:', error.response?.data || error.message)
  }
}

// Run in browser console
if (typeof window !== 'undefined') {
  testAuthenticatedCall()
} else {
  console.log('Run this in browser console')
}