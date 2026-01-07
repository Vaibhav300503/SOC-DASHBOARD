import mongoose from 'mongoose'
import Agent from '../models/Agent.js'
import dotenv from 'dotenv'

dotenv.config()

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin')
    console.log('✅ MongoDB connected')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Sample agent data
const sampleAgents = [
  {
    agent_id: 'agent-001',
    endpoint_name: 'Web-Server-01',
    hostname: 'web01.company.com',
    ip_address: '192.168.1.10',
    os_type: 'Ubuntu 22.04',
    status: 'active',
    agent_version: '1.2.3',
    labels: ['web', 'production'],
    last_seen: new Date(),
    first_registered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  },
  {
    agent_id: 'agent-002',
    endpoint_name: 'DB-Server-01',
    hostname: 'db01.company.com',
    ip_address: '192.168.1.20',
    os_type: 'CentOS 8',
    status: 'active',
    agent_version: '1.2.3',
    labels: ['database', 'production'],
    last_seen: new Date(),
    first_registered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    agent_id: 'agent-003',
    endpoint_name: 'File-Server-01',
    hostname: 'fs01.company.com',
    ip_address: '192.168.1.30',
    os_type: 'Windows Server 2019',
    status: 'inactive',
    agent_version: '1.2.2',
    labels: ['file-server', 'production'],
    last_seen: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago (inactive)
    first_registered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    agent_id: 'agent-004',
    endpoint_name: 'Mail-Server-01',
    hostname: 'mail01.company.com',
    ip_address: '192.168.1.40',
    os_type: 'Ubuntu 20.04',
    status: 'degraded',
    agent_version: '1.2.3',
    labels: ['mail', 'production'],
    last_seen: new Date(),
    first_registered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    agent_id: 'agent-005',
    endpoint_name: 'Workstation-Dev-01',
    hostname: 'dev01.company.com',
    ip_address: '192.168.2.10',
    os_type: 'Windows 11',
    status: 'active',
    agent_version: '1.2.3',
    labels: ['workstation', 'development'],
    last_seen: new Date(),
    first_registered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    agent_id: 'agent-006',
    endpoint_name: 'Workstation-Dev-02',
    hostname: 'dev02.company.com',
    ip_address: '192.168.2.11',
    os_type: 'macOS Monterey',
    status: 'active',
    agent_version: '1.2.3',
    labels: ['workstation', 'development'],
    last_seen: new Date(),
    first_registered: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
  },
  {
    agent_id: 'agent-007',
    endpoint_name: 'Security-Scanner-01',
    hostname: 'scanner01.company.com',
    ip_address: '192.168.3.10',
    os_type: 'Kali Linux',
    status: 'active',
    agent_version: '1.2.3',
    labels: ['security', 'scanner'],
    last_seen: new Date(),
    first_registered: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  },
  {
    agent_id: 'agent-008',
    endpoint_name: 'Backup-Server-01',
    hostname: 'backup01.company.com',
    ip_address: '192.168.1.50',
    os_type: 'Ubuntu 22.04',
    status: 'inactive',
    agent_version: '1.2.1',
    labels: ['backup', 'storage'],
    last_seen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago (inactive)
    first_registered: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
  }
]

const populateAgents = async () => {
  try {
    await connectDB()
    
    console.log('🗑️  Clearing existing agents...')
    await Agent.deleteMany({})
    
    console.log('📝 Creating sample agents...')
    const createdAgents = await Agent.insertMany(sampleAgents)
    
    console.log(`✅ Created ${createdAgents.length} sample agents:`)
    createdAgents.forEach(agent => {
      console.log(`   - ${agent.endpoint_name} (${agent.agent_id}) - ${agent.status}`)
    })
    
    console.log('\n🎯 Test the topology at: http://localhost:3000')
    console.log('📡 API endpoint: http://localhost:3001/api/agents')
    
  } catch (error) {
    console.error('❌ Error populating agents:', error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run the script
populateAgents()