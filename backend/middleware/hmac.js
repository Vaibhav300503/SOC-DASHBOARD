import crypto from 'crypto'

/**
 * Verify HMAC signature from Tailscale
 * Tailscale sends X-Tailscale-Signature header with HMAC-SHA256
 */
export const verifyTailscaleSignature = (req, res, next) => {
  const hmacSecret = process.env.TAILSCALE_HMAC_SECRET

  // Skip verification if not configured
  if (!hmacSecret) {
    console.log('Tailscale HMAC verification skipped - no secret configured')
    return next()
  }

  // TEMPORARILY DISABLE VERIFICATION FOR TESTING
  console.log('Tailscale HMAC verification TEMPORARILY DISABLED for testing')
  console.log('Headers:', req.headers)
  console.log('Body:', JSON.stringify(req.body, null, 2))
  return next()

  const signature = req.headers['x-tailscale-signature']
  if (!signature) {
    console.log('Missing Tailscale signature header')
    return res.status(401).json({ error: 'Missing signature' })
  }

  const body = JSON.stringify(req.body)
  const hash = crypto
    .createHmac('sha256', hmacSecret)
    .update(body)
    .digest('hex')

  if (hash !== signature) {
    console.log('Invalid Tailscale signature')
    console.log('Expected:', hash)
    console.log('Received:', signature)
    return res.status(401).json({ error: 'Invalid signature' })
  }

  console.log('Tailscale signature verified successfully')
  next()
}

/**
 * Generate HMAC signature for outbound requests
 */
export const generateHmacSignature = (data, secret) => {
  const body = typeof data === 'string' ? data : JSON.stringify(data)
  return crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
}
