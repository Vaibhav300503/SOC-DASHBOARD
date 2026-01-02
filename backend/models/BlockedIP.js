import mongoose from 'mongoose'

const blockedIPSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  reason: {
    type: String,
    default: 'Manual block'
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
  expires_at: {
    type: Date,
    default: null
  },
  notes: String,
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'High'
  }
})

// Auto-delete expired blocks
blockedIPSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('BlockedIP', blockedIPSchema)
