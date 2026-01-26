import crypto from 'crypto'

// Input validation and sanitization
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') return ''
  
  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength)
  
  // Remove potential XSS vectors
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
  
  return sanitized
}

// Validate user ID format (prevent path traversal)
export function validateUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') return false
  
  // Only allow alphanumeric, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9_-]+$/
  return validPattern.test(userId) && userId.length <= 100
}

// Generate secure user ID
export function generateSecureUserId(): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  return `user_${timestamp}_${random}`
}

// Validate email format
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email) && email.length <= 254
}

// Hash password or sensitive data
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

// Verify hashed data
export function verifyHash(data: string, hash: string): boolean {
  return hashData(data) === hash
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number, resetAt: number }>()

// Rate limiter
export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  // Clean up expired entries
  if (record && now >= record.resetAt) {
    rateLimitStore.delete(identifier)
  }

  const current = rateLimitStore.get(identifier)

  if (!current) {
    // First request in this window
    const resetAt = now + windowMs
    rateLimitStore.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (current.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }

  // Increment counter
  current.count++
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetAt: current.resetAt 
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now >= value.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

// Validate API key format
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false
  // API keys should be at least 20 characters
  return apiKey.length >= 20 && apiKey !== 'your_api_key_here'
}

// Sanitize file path to prevent directory traversal
export function sanitizeFilePath(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return 'default'
  
  // Remove any path traversal attempts
  return fileName
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Validate CSRF token
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  )
}
