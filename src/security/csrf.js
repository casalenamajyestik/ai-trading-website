/**
 * CSRF Protection Utility
 * Generates and validates CSRF tokens for state-changing operations
 * Uses double-submit cookie pattern with SameSite cookies
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure random token
 */
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token for the session
 */
export function getCsrfToken() {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = generateToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  }
  return token;
}

/**
 * Refresh CSRF token (e.g., after login)
 */
export function refreshCsrfToken() {
  const token = generateToken();
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
}

/**
 * Clear CSRF token (e.g., on logout)
 */
export function clearCsrfToken() {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * Add CSRF token to form as hidden input
 * @param {HTMLFormElement} form - Form element
 */
export function addCsrfToForm(form) {
  const token = getCsrfToken();
  
  // Remove existing CSRF input if present
  const existing = form.querySelector(`input[name="${CSRF_TOKEN_KEY}"]`);
  if (existing) existing.remove();
  
  // Add new hidden input
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = CSRF_TOKEN_KEY;
  input.value = token;
  form.appendChild(input);
}

/**
 * Get CSRF token for AJAX requests
 * @returns {Object} Headers object with CSRF token
 */
export function getCsrfHeaders() {
  return {
    [CSRF_HEADER_NAME]: getCsrfToken()
  };
}

/**
 * Validate CSRF token from form submission
 * @param {string} submittedToken - Token from form submission
 * @returns {boolean} True if valid
 */
export function validateCsrfToken(submittedToken) {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!storedToken || !submittedToken) return false;
  
  // Constant-time comparison to prevent timing attacks
  if (storedToken.length !== submittedToken.length) return false;
  
  let result = 0;
  for (let i = 0; i < storedToken.length; i++) {
    result |= storedToken.charCodeAt(i) ^ submittedToken.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Initialize CSRF protection for all forms on page
 * Call this after DOM is ready
 */
export function initCsrfProtection() {
  // Add CSRF token to all forms with data-csrf="true" or method="POST"
  document.querySelectorAll('form[data-csrf="true"], form[method="POST"], form[method="post"]').forEach(form => {
    addCsrfToForm(form);
    
    // Also add to forms that don't have method but are likely state-changing
    const action = form.getAttribute('action');
    if (!action || action.startsWith('#') || action.startsWith('/')) {
      addCsrfToForm(form);
    }
  });
}

/**
 * Middleware wrapper for fetch requests to add CSRF token
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function csrfFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set(CSRF_HEADER_NAME, getCsrfToken());
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Create CSRF-protected form data for submission
 * @param {HTMLFormElement} form - Form element
 * @returns {FormData} FormData with CSRF token
 */
export function createCsrfFormData(form) {
  const formData = new FormData(form);
  formData.append(CSRF_TOKEN_KEY, getCsrfToken());
  return formData;
}