// Fix case indexes and create sample data
import mongoose from 'mongoose'

const MONGODB_URI = 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin'

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const collection = db.collection('cases')
    
    // Drop the problematic unique index on case_id
    try {
      await collection.dropIndex('case_id_1')
      console.log('Dropped case_id_1 index')
    } catch (error) {
      console.log('Index case_id_1 not found or already dropped')
    }

    // Clear existing cases
    await collection.deleteMany({})
    console.log('Cleared existing cases')

    // Create sample cases
    const sampleCases = [
      {
        title: 'Suspicious Login Activity Detected',
        description: 'Multiple failed login attempts detected from IP 192.168.1.100. User account: admin@company.com. Location: Unknown (VPN suspected).',
        severity: 4, // Critical
        status: 'Open',
        owner: 'security-analyst',
        tags: ['authentication', 'brute-force', 'suspicious-activity'],
        artifacts: [
          { dataType: 'ip', data: '192.168.1.100', message: 'Source IP' },
          { dataType: 'user', data: 'admin@company.com', message: 'Target Account' }
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Malware Detection on Endpoint',
        description: 'Windows Defender detected potential malware on DESKTOP-ABC123. File: suspicious.exe. Action: Quarantined.',
        severity: 3, // High
        status: 'InProgress',
        owner: 'incident-response',
        tags: ['malware', 'endpoint-security', 'windows-defender'],
        artifacts: [
          { dataType: 'file', data: 'suspicious.exe', message: 'Malicious File' },
          { dataType: 'hostname', data: 'DESKTOP-ABC123', message: 'Affected Endpoint' }
        ],
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000)  // 1 hour ago
      },
      {
        title: 'Network Anomaly - Unusual Traffic Pattern',
        description: 'Detected unusual outbound traffic from internal server 10.0.1.50 to external IP 203.0.113.45. Traffic volume: 500MB in 10 minutes.',
        severity: 2, // Medium
        status: 'Open',
        owner: 'network-team',
        tags: ['network', 'anomaly', 'data-exfiltration'],
        artifacts: [
          { dataType: 'ip', data: '10.0.1.50', message: 'Source IP' },
          { dataType: 'ip', data: '203.0.113.45', message: 'Destination IP' }
        ],
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        title: 'Failed SSH Brute Force Attack',
        description: 'SSH brute force attack detected on server ssh.company.com from IP 198.51.100.25. 150 failed attempts in 5 minutes.',
        severity: 3, // High
        status: 'Resolved',
        owner: 'security-team',
        tags: ['ssh', 'brute-force', 'linux', 'blocked'],
        artifacts: [
          { dataType: 'ip', data: '198.51.100.25', message: 'Attacker IP' },
          { dataType: 'hostname', data: 'ssh.company.com', message: 'Target Server' }
        ],
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000)  // 1 hour ago
      },
      {
        title: 'Phishing Email Campaign Detected',
        description: 'Email security system detected phishing campaign targeting employees. Subject: "Urgent: Update Your Password". 25 emails blocked.',
        severity: 2, // Medium
        status: 'InProgress',
        owner: 'email-security',
        tags: ['phishing', 'email', 'social-engineering'],
        artifacts: [
          { dataType: 'email', data: 'noreply@fake-bank.com', message: 'Sender Email' },
          { dataType: 'url', data: 'http://fake-bank-login.com', message: 'Malicious URL' }
        ],
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000)  // 3 hours ago
      },
      {
        title: 'DDoS Attack Mitigated',
        description: 'Large-scale DDoS attack detected and mitigated. Peak traffic: 10Gbps. Attack duration: 45 minutes. Source: Botnet.',
        severity: 4, // Critical
        status: 'Resolved',
        owner: 'network-security',
        tags: ['ddos', 'botnet', 'network-attack', 'mitigated'],
        artifacts: [
          { dataType: 'ip', data: '203.0.113.0/24', message: 'Attack Source Range' }
        ],
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000)   // 2 hours ago
      }
    ]

    const result = await collection.insertMany(sampleCases)
    console.log(`Created ${result.insertedCount} sample cases`)

    // Display created cases
    const createdCases = await collection.find({}).sort({ created_at: -1 }).toArray()
    console.log('\nCreated cases:')
    createdCases.forEach((caseItem, index) => {
      const severityLabel = caseItem.severity === 4 ? 'Critical' : 
                           caseItem.severity === 3 ? 'High' : 
                           caseItem.severity === 2 ? 'Medium' : 'Low'
      console.log(`${index + 1}. ${caseItem.title} (${severityLabel}) - ${caseItem.status}`)
    })

    console.log('\nSample cases created successfully!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

fixIndexes()