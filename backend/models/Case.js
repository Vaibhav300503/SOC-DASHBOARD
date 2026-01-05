import mongoose from 'mongoose'

const caseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  severity: {
    type: Number,
    default: 1,
    min: 0,
    max: 4
  },
  status: {
    type: String,
    enum: ['Open', 'InProgress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  owner: {
    type: String,
    default: 'Unassigned'
  },
  source: {
    type: String,
    enum: ['TheHive', 'MongoDB', 'Manual'],
    default: 'MongoDB'
  },
  thehive_id: {
    type: String,
    sparse: true
  },
  tags: [{
    type: String
  }],
  artifacts: [{
    dataType: String,
    data: String,
    message: String
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// Index for performance
caseSchema.index({ created_at: -1 })
caseSchema.index({ status: 1 })
caseSchema.index({ severity: -1 })

export default mongoose.model('Case', caseSchema)