import mongoose from 'mongoose'

const caseSchema = new mongoose.Schema({
  case_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  thehive_case_id: {
    type: Number,
    index: true
  },
  alert_ids: [{
    type: String,
    index: true
  }],
  title: {
    type: String,
    required: true
  },
  description: String,
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Closed', 'Resolved'],
    default: 'Open',
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  created_by: mongoose.Schema.Types.ObjectId,
  assigned_to: mongoose.Schema.Types.ObjectId,
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
})

export default mongoose.model('Case', caseSchema)
