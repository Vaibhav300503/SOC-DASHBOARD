import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password_hash: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'analyst', 'viewer'],
    default: 'analyst',
    index: true
  },
  avatar: {
    type: String,
    default: null
  },
  department: {
    type: String,
    default: 'Security Operations'
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  last_login: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  preferences: {
    theme: {
      type: String,
      enum: ['dark', 'light', 'auto'],
      default: 'dark'
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      alerts: { type: Boolean, default: true }
    },
    dashboard: {
      defaultView: { type: String, enum: ['overview', 'logs', 'network'], default: 'overview' },
      itemsPerPage: { type: Number, default: 20 }
    }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    lastPasswordChange: { type: Date, default: Date.now },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null }
  },
  activity: {
    loginsViewed: { type: Number, default: 0 },
    alertsCreated: { type: Number, default: 0 },
    reportsGenerated: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password_hash = await bcrypt.hash(this.password_hash, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
userSchema.methods.comparePassword = async function(plainPassword) {
  return await bcrypt.compare(plainPassword, this.password_hash)
}

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.lastName && this.lastName.trim()) {
    return `${this.firstName} ${this.lastName}`
  }
  return this.firstName
})

// Virtual for profile completion
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0
  const fields = ['firstName', 'email', 'department', 'bio']
  // Only count lastName if it has a value
  if (this.lastName && this.lastName.trim()) {
    fields.push('lastName')
  }
  fields.forEach(field => {
    if (this[field] && this[field].toString().trim()) completion += 100 / fields.length
  })
  return Math.round(completion)
})

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.last_login = new Date()
  this.loginCount += 1
  this.activity.lastActivity = new Date()
  return this.save()
}

// Method to record activity
userSchema.methods.recordActivity = function(type, count = 1) {
  if (this.activity[type] !== undefined) {
    this.activity[type] += count
    this.activity.lastActivity = new Date()
  }
  return this.save()
}

// Method to get safe user data (without password)
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password_hash
  return user
}

export default mongoose.model('User', userSchema)
