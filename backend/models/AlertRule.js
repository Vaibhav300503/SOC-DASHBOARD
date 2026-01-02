import mongoose from 'mongoose'

const alertRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  condition: {
    type: {
      type: String,
      enum: ['ip', 'severity', 'log_type', 'endpoint', 'custom'],
      required: true
    },
    value: String,
    operator: {
      type: String,
      enum: ['equals', 'contains', 'matches', 'greater_than', 'less_than'],
      default: 'equals'
    }
  },
  actions: [{
    type: {
      type: String,
      enum: ['email', 'webhook', 'slack', 'log'],
      required: true
    },
    target: String
  }],
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'High'
  },
  enabled: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  last_triggered: Date,
  trigger_count: {
    type: Number,
    default: 0
  }
})

export default mongoose.model('AlertRule', alertRuleSchema)
