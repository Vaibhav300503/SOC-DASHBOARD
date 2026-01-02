import mongoose from 'mongoose'

const logSchema = new mongoose.Schema({
  // Core fields
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  source_ip: {
    type: String,
    index: true
  },
  dest_ip: {
    type: String,
    index: true
  },
  endpoint: {
    type: String,
    index: true
  },
  severity: {
    type: String,
    index: true
  },
  log_type: {
    type: String,
    index: true
  },

  // New structure fields
  metadata: {
    agent_id: String,
    endpoint_name: { type: String, index: true },
    hostname: String,
    log_source: String,
    os_type: String,
    severity: String
  },

  ip_address: String,

  raw_data: mongoose.Schema.Types.Mixed,
  raw: mongoose.Schema.Types.Mixed,

  // Geolocation
  geo: {
    country: String,
    city: String,
    lat: Number,
    lon: Number,
    asn: String,
    isp: String
  },

  // Metadata
  source: {
    type: String,
    default: 'api'
  },
  ingested_at: {
    type: Date,
    default: Date.now
  },
  created_at: Date
}, {
  timestamps: true,
  collection: 'raw_logs',
  strict: false // Allow other fields
})

// TTL index - keep logs for 90 days
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 })

// Compound indexes for common queries
logSchema.index({ timestamp: -1, severity: 1 })
logSchema.index({ source_ip: 1, timestamp: -1 })
logSchema.index({ endpoint: 1, timestamp: -1 })
logSchema.index({ 'metadata.endpoint_name': 1, timestamp: -1 })

export default mongoose.model('Log', logSchema)
