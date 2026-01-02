import mongoose from 'mongoose'

const registryLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  log_type: {
    type: String,
    default: 'Registry'
  },
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true
  },
  computer: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  registry_path: {
    type: String,
    required: true
  },
  key_name: {
    type: String,
    required: true
  },
  value_type: {
    type: String,
    enum: ['REG_SZ', 'REG_DWORD', 'REG_BINARY', 'REG_MULTI_SZ', 'REG_EXPAND_SZ', 'REG_QWORD']
  },
  old_value: {
    type: String
  },
  new_value: {
    type: String
  },
  raw: {
    action: {
      type: String,
      enum: ['CREATE', 'DELETE', 'MODIFY', 'READ'],
      required: true
    },
    description: String,
    process_name: String,
    process_id: Number,
    hive: String
  }
}, {
  timestamps: true
})

// Index for efficient querying
registryLogSchema.index({ timestamp: -1 })
registryLogSchema.index({ computer: 1 })
registryLogSchema.index({ user: 1 })
registryLogSchema.index({ registry_path: 1 })
registryLogSchema.index({ severity: 1 })
registryLogSchema.index({ 'raw.action': 1 })

const RegistryLog = mongoose.model('RegistryLog', registryLogSchema)

export default RegistryLog
