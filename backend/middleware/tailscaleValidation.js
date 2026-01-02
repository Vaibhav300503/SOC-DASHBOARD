import Joi from 'joi';

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
  const { error, value } = deviceSchema.validate(device, {
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
  const results = devices.map(device => validateDeviceData(device));
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
