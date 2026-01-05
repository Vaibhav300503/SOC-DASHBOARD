// Create sample cases for dashboard testing
import mongoose from 'mongoose'
import Case from './models/Case.js'

const MONGODB_URI = 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin'

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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  },
  {
    title: 'Privilege Escalation Attempt',
    description: 'User account john.doe attempted to access admin resources without proper authorization. Event logged and access denied.',
    severity: 2, // Medium
    status: 'Open',
    owner: 'access-control',
    tags: ['privilege-escalation', 'access-control', 'unauthorized'],
    artifacts: [
      { dataType: 'user', data: 'john.doe', message: 'User Account' },
      { dataType: 'resource', data: '/admin/users', message: 'Restricted Resource' }
    ]
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
    ]
  },
  {
    title: 'Unauthorized File Access',
    description: 'Sensitive file accessed by unauthorized user. File: /confidential/financial_data.xlsx. User: temp_contractor.',
    severity: 3, // High
    status: 'Open',
    owner: 'data-protection',
    tags: ['data-breach', 'unauthorized-access', 'confidential'],
    artifacts: [
      { dataType: 'file', data: '/confidential/financial_data.xlsx', message: 'Accessed File' },
      { dataType: 'user', data: 'temp_contractor', message: 'Unauthorized User' }
    ]
  }
]

async function createSampleCases() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing cases
    await Case.deleteMany({})
    console.log('Cleared existing cases')

    // Create sample cases
    const createdCases = await Case.insertMany(sampleCases)
    console.log(`Created ${createdCases.length} sample cases`)

    // Display created cases
    createdCases.forEach((caseItem, index) => {
      console.log(`${index + 1}. ${caseItem.title} (${caseItem.severity === 4 ? 'Critical' : caseItem.severity === 3 ? 'High' : caseItem.severity === 2 ? 'Medium' : 'Low'})`)
    })

    console.log('\nSample cases created successfully!')
  } catch (error) {
    console.error('Error creating sample cases:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

createSampleCases()