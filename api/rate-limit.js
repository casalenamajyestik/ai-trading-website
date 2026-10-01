/**
 * Server-side Rate Limiter for Vercel Functions
 * Protects auth endpoints against brute force and credential stuffing
 * Uses in-memory store (for Vercel) with IP-based tracking
 */

// In-memory store (resets on cold start - acceptable for rate limiting)
const rateLimitStore = new Map();

// Rate limit configurations
const RATE_LIMIT_CONFIG = {
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },       // 5 per 15 min
  REGISTER: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },     // 3 per hour
  FORGOT_PASSWORD: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  RESEND_VERIFICATION: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  RESET_PASSWORD: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  CHANGE_PASSWORD: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  OAUTH: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },        // 10 per 15 min
};

/**
 * Extract client IP from request headers
 * Handles Vercel's x-forwarded-for and other proxy headers
 */
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  // Fallback - Vercel doesn't expose direct IP easily
  return 'unknown';
}

/**
 * Create a unique key for rate limiting
 */
function createRateLimitKey(action, identifier) {
  return `ratelimit:${action}:${identifier}`;
}

/**
 * Clean expired entries from store
 */
function cleanupExpiredEntries(store, windowMs) {
  const now = Date.now();
  for (const [key, attempts] of store.entries()) {
    const validAttempts = attempts.filter(attempt => now - attempt.timestamp < windowMs);
    if (validAttempts.length === 0) {
      store.delete(key);
    } else if (validAttempts.length !== attempts.length) {
      store.set(key, validAttempts);
    }
  }
}

/**
 * Check rate limit for an action
 * @param {string} action - Action type (LOGIN, REGISTER, etc.)
 * @param {string} identifier - Client identifier (IP)
 * @returns {Object} { allowed: boolean, remainingAttempts: number, retryAfterMs: number, retryAfterMinutes: number }
 */
export function checkRateLimit(action, identifier) {
  const config = RATE_LIMIT_CONFIG[action];
  if (!config) return { allowed: true, remainingAttempts: Infinity, retryAfterMs: 0, retryAfterMinutes: 0 };

  const key = createRateLimitKey(action, identifier);
  const now = Date.now();

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    cleanupExpiredEntries(rateLimitStore, config.windowMs);
  }

  let attempts = rateLimitStore.get(key) || [];
  
  // Filter expired attempts
  attempts = attempts.filter(attempt => now - attempt.timestamp < config.windowMs);

  const attemptCount = attempts.length;
  const remainingAttempts = Math.max(0, config.maxAttempts - attemptCount);

  if (attemptCount >= config.maxAttempts) {
    // Find oldest attempt to calculate retry time
    const oldestAttempt = attempts.reduce((oldest, current) => 
      current.timestamp < oldest.timestamp ? current : oldest
    );
    const retryAfterMs = Math.max(0, config.windowMs - (now - oldestAttempt.timestamp));
    
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      retryAfterMs,
      retryAfterMinutes: Math.ceil(retryAfterMs / 60000)
    };
  }

  return { 
    allowed: true, 
    remainingAttempts,
    retryAfterMs: 0,
    retryAfterMinutes: 0
  };
}

/**
 * Record an attempt
 * @param {string} action - Action type
 * @param {string} identifier - Client identifier
 * @param {boolean} success - Whether attempt was successful
 */
export function recordAttempt(action, identifier, success = false) {
  const config = RATE_LIMIT_CONFIG[action];
  if (!config) return;

  const key = createRateLimitKey(action, identifier);
  const now = Date.now();

  let attempts = rateLimitStore.get(key) || [];
  
  // Filter expired attempts
  attempts = attempts.filter(attempt => now - attempt.timestamp < config.windowMs);

  // Add new attempt
  attempts.push({
    timestamp: now,
    success
  });

  // If successful, clear the attempts (reset on success)
  if (success) {
    attempts = [];
  }

  if (attempts.length > 0) {
    rateLimitStore.set(key, attempts);
  } else {
    rateLimitStore.delete(key);
  }
}

/**
 * Clear rate limit for an action (e.g., after successful login)
 * @param {string} action - Action type
 * @param {string} identifier - Client identifier
 */
export function clearRateLimit(action, identifier) {
  const key = createRateLimitKey(action, identifier);
  rateLimitStore.delete(key);
}

/**
 * Middleware wrapper for Vercel API routes
 * Usage: export default withRateLimit(LOGIN, handler)
 */
export function withRateLimit(action, handler) {
  return async (request, response) => {
    const identifier = getClientIp(request);
    const rateLimit = checkRateLimit(action, identifier);

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG[action]?.maxAttempts || 0);
    response.setHeader('X-RateLimit-Remaining', rateLimit.remainingAttempts);
    response.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + rateLimit.retryAfterMs) / 1000));

    if (!rateLimit.allowed) {
      response.setHeader('Retry-After', rateLimit.retryAfterMinutes * 60);
      return response.status(429).json({
        error: 'Too Many Requests',
        message: `Terlalu banyak percobaan. Silakan coba lagi dalam ${rateLimit.retryAfterMinutes} menit.`,
        retryAfterMinutes: rateLimit.retryAfterMinutes
      });
    }

    // Wrap response to record attempt on completion
    const originalJson = response.json.bind(response);
    response.json = async (data) => {
      const isSuccess = response.statusCode < 400;
      recordAttempt(action, identifier, isSuccess);
      return originalJson(data);
    };

    return handler(request, response);
  };
}

/**
 * Get rate limit status without incrementing (for UI display)
 */
export function getRateLimitStatus(action, identifier) {
  return checkRateLimit(action, identifier);
}

export { RATE_LIMIT_CONFIG };