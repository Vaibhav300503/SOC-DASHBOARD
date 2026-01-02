import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  // Timestamp
  '@timestamp': {
    type: Date,
    index: true
  },
  
  // Host information
  host: {
    name: String,
    hostname: String,
    ip: [String],
    mac: [String],
    architecture: String,
    os: {
      name: String,
      version: String,
      platform: String,
      family: String,
      kernel: String,
      codename: String,
      type: String
    },
    containerized: Boolean,
    id: String
  },
  
  // User information
  user: {
    name: String,
    id: String
  },
  
  // Event information
  event: {
    action: String,
    dataset: String,
    kind: String,
    type: [String],
    module: String,
    category: [String],
    start: Date,
    end: Date,
    duration: Number
  },
  
  // Network information
  source: {
    ip: String,
    port: Number,
    bytes: Number,
    packets: Number
  },
  destination: {
    ip: String,
    port: Number,
    bytes: Number,
    packets: Number
  },
  client: {
    ip: String,
    port: Number,
    bytes: Number,
    packets: Number
  },
  server: {
    ip: String,
    port: Number,
    bytes: Number,
    packets: Number
  },
  network: {
    transport: String,
    type: String,
    bytes: Number,
    packets: Number,
    direction: String,
    community_id: String
  },
  
  // Process information
  process: {
    pid: Number,
    name: String,
    executable: String,
    args: [String],
    entity_id: String,
    created: Date
  },
  
  // Agent information
  agent: {
    name: String,
    type: String,
    id: String,
    version: String,
    ephemeral_id: String
  },
  
  // ECS compliance
  ecs: {
    version: String
  },
  
  // Related information
  related: {
    user: [String],
    ip: [String]
  },
  
  // Tags
  tags: [String],
  
  // Version
  '@version': String,
  
  // System information
  system: {
    audit: {
      socket: {
        uid: Number,
        gid: Number,
        euid: Number,
        egid: Number,
        kernel_sock_address: String
      }
    }
  },
  
  // Group information
  group: {
    name: String,
    id: String
  },
  
  // Service information
  service: {
    type: String
  },
  
  // Flow information
  flow: {
    complete: Boolean,
    final: Boolean
  },
  
  // Custom host field
  host_custom: String
}, {
  timestamps: true
})

// Indexes for common queries
eventSchema.index({ '@timestamp': -1 })
eventSchema.index({ 'source.ip': 1, '@timestamp': -1 })
eventSchema.index({ 'destination.ip': 1, '@timestamp': -1 })
eventSchema.index({ 'event.action': 1, '@timestamp': -1 })
eventSchema.index({ 'host.name': 1, '@timestamp': -1 })
eventSchema.index({ tags: 1, '@timestamp': -1 })

export default mongoose.model('Event', eventSchema)
