import mongoose from 'mongoose'

const safeIPSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  notes: String,
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
  confidence: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  tags: [String]
})

export default mongoose.model('SafeIP', safeIPSchema)
