import Joi from 'joi';

const normalizeDeviceOs = (os) => {
  if (!os) return 'unknown'

  const value = String(os).trim().toLowerCase()

  const osMap = {
    win: 'windows',
    windows: 'windows',
    mac: 'macos',
    macos: 'macos',
    darwin: 'macos',
    ios: 'ios',
    ipad: 'ios',
    iphone: 'ios',
    android: 'android',
    linux: 'linux',
    freebsd: 'linux'
  }

  if (osMap[value]) return osMap[value]

  if (['unknown', 'custom', 'other'].includes(value)) {
    return 'unknown'
  }

  return 'unknown'
}

// Device data validation schema - allows extra Tailscale API fields
const deviceSchema = Joi.object({
  id: Joi.string().required().pattern(/^[a-zA-Z0-9_-]+$/),
  name: Joi.string().required().min(1).max(255),
  user: Joi.string().required().email(),
  hostname: Joi.string().optional().max(255),
  os: Joi.string().optional().valid('linux', 'windows', 'macos', 'android', 'ios', 'unknown'),
  created: Joi.date().required(),
  lastSeen: Joi.date().required(),
  addresses: Joi.array().items(
    Joi.string().ip({ version: ['ipv4', 'ipv6'] })
  ).optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  authorized: Joi.boolean().required(),
  isExternal: Joi.boolean().required(),
  expires: Joi.date().optional().allow(null),
  clientVersion: Joi.string().optional().max(50)
}).unknown(true); // Allow unknown fields from Tailscale API

// Validate device data before processing
export const validateDeviceData = (device) => {
  const sanitizedDevice = {
    ...device,
    os: normalizeDeviceOs(device?.os)
  }

  const { error, value } = deviceSchema.validate(sanitizedDevice, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    console.error(`Device validation failed for ${device?.id}:`, error.details);
    return { isValid: false, errors: error.details, data: null };
  }
  
  return { isValid: true, errors: null, data: value };
};

// Batch validation for multiple devices
export const validateDeviceBatch = (devices) => {
  const results = devices.map(device => {
    const result = validateDeviceData(device)
    if (!result.isValid) {
      result.originalData = device
    }
    return result
  });
  const validDevices = results
    .filter(r => r.isValid)
    .map(r => r.data);
  const invalidDevices = results
    .filter(r => !r.isValid)
    .map(r => ({ errors: r.errors, originalData: r.originalData }));
    
  return {
    validDevices,
    invalidDevices,
    totalProcessed: devices.length,
    validCount: validDevices.length,
    invalidCount: invalidDevices.length
  };
};
