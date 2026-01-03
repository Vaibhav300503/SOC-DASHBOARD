import mongoose from 'mongoose'

const alertEventSchema = new mongoose.Schema({
  rule_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AlertRule',
    required: false,
    index: true
  },
  log_id: {
    type: String, // Changed from ObjectId to String to accept frontend data
    required: false // Made optional since frontend may not always provide it
  },
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true,
    index: true
  },
  title: String,
  description: String,
  source_ip: String,
  dest_ip: String,
  created_by: {
    type: String,
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledged_by: mongoose.Schema.Types.ObjectId,
  acknowledged_at: Date,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: mongoose.Schema.Types.Mixed,
  thehive_alert_id: {
    type: String,
    index: true
  },
  thehive_case_id: {
    type: String,
    index: true
  },
  cortex_job_ids: [String],
  analysis_status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'error'],
    default: 'pending',
    index: true
  },
  analysis_summary: mongoose.Schema.Types.Mixed,
  last_updated: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('AlertEvent', alertEventSchema)
