import mongoose from 'mongoose';

const tailscaleDeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  user: { type: String, required: true },
  hostname: { type: String },
  os: String,
  created: Date,
  lastSeen: Date,
  ipAddresses: [String],
  tags: [String],
  nodeKey: String,
  addresses: [String],
  apiVersion: Number,
  clientVersion: String,
  updateAvailable: Boolean,
  authorized: Boolean,
  isExternal: Boolean,
  blocksIncomingConnections: Boolean,
  keyExpiryDisabled: Boolean,
  expires: Date,
  enabledRoutes: [String],
  advertisedRoutes: [String],
  clientConnectivity: {
    online: Boolean,
    derpRegion: String,
    relayLocation: String,
    connectedNodes: Number,
    lastSeen: Date
  },
  location: {
    country: String,
    country_code: String,
    city: String,
    region: String,
    latitude: Number,
    longitude: Number
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'unknown'],
    default: 'unknown'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  collection: 'tailscale_devices'
});

// Index for faster queries
tailscaleDeviceSchema.index({ deviceId: 1 });
tailscaleDeviceSchema.index({ user: 1 });
tailscaleDeviceSchema.index({ status: 1 });
tailscaleDeviceSchema.index({ lastSeen: -1 });

export default mongoose.model('TailscaleDevice', tailscaleDeviceSchema);
