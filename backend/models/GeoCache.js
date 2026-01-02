import mongoose from 'mongoose'

const geoCacheSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  geo_data: {
    ip: String,
    country: String,
    country_code: String,
    city: String,
    latitude: Number,
    longitude: Number,
    asn: String,
    isp: String,
    is_vpn: Boolean,
    is_proxy: Boolean,
    is_tor: Boolean,
    source: String // 'ipwho.is', 'ipapi.co', 'private_mapping', 'default'
  },
  cached_at: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 2592000 // Auto-delete after 30 days
  }
}, { timestamps: true })

// Index for cleanup queries
geoCacheSchema.index({ cached_at: 1 }, { expireAfterSeconds: 2592000 })

const GeoCache = mongoose.model('GeoCache', geoCacheSchema)

export default GeoCache
