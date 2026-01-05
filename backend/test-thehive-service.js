// Test TheHive service directly
import { getRecentCases } from './services/thehiveIntegration.js'

async function testTheHiveService() {
  try {
    console.log('Testing TheHive service...')
    const cases = await getRecentCases(5)
    
    console.log(`Returned ${cases.length} cases`)
    if (cases.length > 0) {
      console.log('Cases:')
      cases.forEach((caseItem, index) => {
        console.log(`${index + 1}. ${caseItem.title} (Source: ${caseItem.source})`)
      })
    } else {
      console.log('No cases returned')
    }
  } catch (error) {
    console.error('Error testing TheHive service:', error.message)
  }
}

testTheHiveService()