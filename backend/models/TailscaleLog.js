import mongoose from 'mongoose'

const tailscaleLogSchema = new mongoose.Schema({
  // Normalized fields
  ts: {
    type: Date,
    default: Date.now,
    index: true
  },
  type: {
    type: String,
    index: true
    // Remove enum restriction to accept any Tailscale event type
  },
  node_id: {
    type: String,
    index: true
  },
  user: {
    type: String,
    index: true
  },
  src: String,
  dst: String,
  event: String,
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  
  // Additional fields
  device_name: String,
  device_os: String,
  ip_address: String,
  tailnet: String,
  
  // Raw data for debugging
  raw: mongoose.Schema.Types.Mixed,
  
  // Metadata
  source: {
    type: String,
    default: 'audit_stream'
    // Remove enum restriction to accept any source type
  },
  ingested_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// TTL index - keep logs for 90 days
tailscaleLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 })

// Compound indexes for common queries
tailscaleLogSchema.index({ ts: -1, type: 1 })
tailscaleLogSchema.index({ user: 1, ts: -1 })
tailscaleLogSchema.index({ node_id: 1, ts: -1 })

export default mongoose.model('TailscaleLog', tailscaleLogSchema)
