/**
 * Client-side Rate Limiter for Auth Endpoints
 * Provides protection against brute force and credential stuffing attacks
 * Uses localStorage with sliding window algorithm
 */

const RATE_LIMIT_CONFIG = {
  // Max attempts per window
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },      // 5 attempts per 15 minutes
  REGISTER: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },    // 3 attempts per hour
  FORGOT_PASSWORD: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  RESEND_VERIFICATION: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  RESET_PASSWORD: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  CHANGE_PASSWORD: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  OAUTH: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },      // 10 attempts per 15 minutes
};

const STORAGE_KEY = 'auth_rate_limit';

/**
 * Get the identifier for rate limiting (IP + user agent hash)
 * In production, this should be done server-side with real IP
 */
function getClientIdentifier() {
  // Create a fingerprint from available client info
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('rate-limit-fingerprint', 2, 2);
  const fingerprint = canvas.toDataURL().slice(-50);
  
  // Combine with screen info for better uniqueness
  const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return btoa(fingerprint + screenInfo + tz).slice(0, 32);
}

/**
 * Clean expired entries from storage
 */
function cleanupExpiredEntries(attempts, windowMs) {
  const now = Date.now();
  return attempts.filter(attempt => now - attempt.timestamp < windowMs);
}

/**
 * Check if rate limited for a specific action
 * @param {string} action - Action type (LOGIN, REGISTER, etc.)
 * @returns {Object} { allowed: boolean, remainingAttempts: number, retryAfterMs: number }
 */
export function checkRateLimit(action) {
  const config = RATE_LIMIT_CONFIG[action];
  if (!config) return { allowed: true, remainingAttempts: Infinity, retryAfterMs: 0 };

  const identifier = getClientIdentifier();
  const storageKey = `${STORAGE_KEY}_${action}_${identifier}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    let attempts = stored ? JSON.parse(stored) : [];
    
    // Clean expired entries
    attempts = cleanupExpiredEntries(attempts, config.windowMs);
    
    const attemptCount = attempts.length;
    const remainingAttempts = Math.max(0, config.maxAttempts - attemptCount);
    
    if (attemptCount >= config.maxAttempts) {
      // Find oldest attempt to calculate retry time
      const oldestAttempt = attempts.reduce((oldest, current) => 
        current.timestamp < oldest.timestamp ? current : oldest
      );
      const retryAfterMs = Math.max(0, config.windowMs - (Date.now() - oldestAttempt.timestamp));
      
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
      retryAfterMs: 0
    };
  } catch (err) {
    console.warn('Rate limit check failed:', err);
    // Fail open - allow request if storage fails
    return { allowed: true, remainingAttempts: config.maxAttempts, retryAfterMs: 0 };
  }
}

/**
 * Record an attempt for a specific action
 * @param {string} action - Action type
 * @param {boolean} success - Whether the attempt was successful
 */
export function recordAttempt(action, success = false) {
  const config = RATE_LIMIT_CONFIG[action];
  if (!config) return;

  const identifier = getClientIdentifier();
  const storageKey = `${STORAGE_KEY}_${action}_${identifier}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    let attempts = stored ? JSON.parse(stored) : [];
    
    // Clean expired entries
    attempts = cleanupExpiredEntries(attempts, config.windowMs);
    
    // Add new attempt
    attempts.push({
      timestamp: Date.now(),
      success
    });
    
    // If successful, clear the attempts (reset on success)
    if (success) {
      attempts = [];
    }
    
    localStorage.setItem(storageKey, JSON.stringify(attempts));
  } catch (err) {
    console.warn('Failed to record rate limit attempt:', err);
  }
}

/**
 * Clear rate limit for an action (e.g., after successful login)
 * @param {string} action - Action type
 */
export function clearRateLimit(action) {
  const identifier = getClientIdentifier();
  const storageKey = `${STORAGE_KEY}_${action}_${identifier}`;
  
  try {
    localStorage.removeItem(storageKey);
  } catch (err) {
    console.warn('Failed to clear rate limit:', err);
  }
}

/**
 * Get human-readable rate limit message
 * @param {Object} rateLimitResult - Result from checkRateLimit
 * @param {string} action - Action type
 * @returns {string} User-friendly message
 */
export function getRateLimitMessage(rateLimitResult, action) {
  const actionLabels = {
    LOGIN: 'login',
    REGISTER: 'pendaftaran',
    FORGOT_PASSWORD: 'permintaan reset kata sandi',
    RESEND_VERIFICATION: 'pengiriman ulang kode verifikasi',
    RESET_PASSWORD: 'reset kata sandi',
    CHANGE_PASSWORD: 'ubah kata sandi',
    OAUTH: 'login sosial'
  };
  
  const label = actionLabels[action] || action.toLowerCase();
  
  if (!rateLimitResult.allowed) {
    return `Terlalu banyak percobaan ${label}. Silakan coba lagi dalam ${rateLimitResult.retryAfterMinutes} menit.`;
  }
  
  if (rateLimitResult.remainingAttempts <= 2) {
    return `Peringatan: Anda memiliki ${rateLimitResult.remainingAttempts} percobaan ${label} tersisa sebelum diblokir sementara.`;
  }
  
  return '';
}

/**
 * Initialize rate limiter cleanup on page load
 * Run periodically to clean up old entries
 */
export function initRateLimiterCleanup() {
  // Clean up on load
  Object.keys(RATE_LIMIT_CONFIG).forEach(action => {
    const identifier = getClientIdentifier();
    const storageKey = `${STORAGE_KEY}_${action}_${identifier}`;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const attempts = JSON.parse(stored);
        const validAttempts = cleanupExpiredEntries(attempts, RATE_LIMIT_CONFIG[action].windowMs);
        if (validAttempts.length !== attempts.length) {
          localStorage.setItem(storageKey, JSON.stringify(validAttempts));
        }
        if (validAttempts.length === 0) {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (err) {
      localStorage.removeItem(storageKey);
    }
  });
  
  // Periodic cleanup every 5 minutes
  setInterval(() => {
    Object.keys(RATE_LIMIT_CONFIG).forEach(action => {
      const identifier = getClientIdentifier();
      const storageKey = `${STORAGE_KEY}_${action}_${identifier}`;
      
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const attempts = JSON.parse(stored);
          const validAttempts = cleanupExpiredEntries(attempts, RATE_LIMIT_CONFIG[action].windowMs);
          if (validAttempts.length === 0) {
            localStorage.removeItem(storageKey);
          } else if (validAttempts.length !== attempts.length) {
            localStorage.setItem(storageKey, JSON.stringify(validAttempts));
          }
        }
      } catch (err) {
        localStorage.removeItem(storageKey);
      }
    });
  }, 5 * 60 * 1000);
}