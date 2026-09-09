/**
 * XSS Protection Utilities
 * Sanitizes user input to prevent Cross-Site Scripting attacks
 */

// Allowed HTML tags and attributes for rich text (if needed)
const ALLOWED_TAGS = [];
const ALLOWED_ATTRIBUTES = {};

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, ''')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize string for safe display in HTML content
 * @param {string} str - String to sanitize
 * @param {Object} options - Options
 * @param {boolean} options.allowBasicFormatting - Allow basic formatting like <b>, <i>, <em>, <strong>
 * @returns {string} Sanitized string
 */
export function sanitizeHtml(str, options = {}) {
  if (typeof str !== 'string') return '';
  
  // First escape all HTML
  let sanitized = escapeHtml(str);
  
  // If basic formatting is allowed, convert safe markdown-like syntax
  if (options.allowBasicFormatting) {
    // Convert **text** to <strong>text</strong>
    sanitized = sanitized.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Convert *text* to <em>text</em>
    sanitized = sanitized.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Convert `code` to <code>code</code>
    sanitized = sanitized.replace(/`(.+?)`/g, '<code>$1</code>');
  }
  
  return sanitized;
}

/**
 * Sanitize text for safe use in textContent (no HTML)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string safe for textContent
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  // Remove null bytes and control characters except newline/tab
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize string for safe use in HTML attributes
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeAttribute(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/"/g, '"')
    .replace(/'/g, ''')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&/g, '&');
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 * @param {string} url - URL to sanitize
 * @param {string[]} allowedProtocols - Allowed protocols (default: https, http)
 * @returns {string} Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url, allowedProtocols = ['https:', 'http:']) {
  if (typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url.trim());
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }
    // Additional checks
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:' || parsed.protocol === 'vbscript:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  // Basic email sanitization - remove dangerous characters
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>\"'&]/g, '')
    .slice(0, 254); // RFC 5321 limit
}

/**
 * Sanitize filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== 'string') return '';
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .slice(0, 255);
}

/**
 * Create a safe DOM element from HTML string
 * Uses DOMParser for safe parsing
 * @param {string} html - HTML string
 * @param {Object} options - Sanitization options
 * @returns {DocumentFragment} Safe document fragment
 */
export function createSafeFragment(html, options = {}) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Remove scripts
  doc.querySelectorAll('script').forEach(el => el.remove());
  
  // Remove event handlers
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove all on* attributes
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
      // Remove javascript: URLs
      if (attr.name === 'href' || attr.name === 'src') {
        const sanitized = sanitizeUrl(attr.value);
        if (!sanitized) {
          el.removeAttribute(attr.name);
        } else {
          el.setAttribute(attr.name, sanitized);
        }
      }
    });
  });
  
  return doc.body.firstChild ? doc.body : document.createDocumentFragment();
}

/**
 * Safe setter for element content
 * Use instead of innerHTML
 * @param {HTMLElement} element - Target element
 * @param {string} content - Content to set
 * @param {boolean} allowHtml - Whether to allow basic HTML (default: false)
 */
export function setSafeContent(element, content, allowHtml = false) {
  if (!element) return;
  
  if (allowHtml) {
    const fragment = createSafeFragment(content);
    element.innerHTML = '';
    element.appendChild(fragment);
  } else {
    element.textContent = sanitizeText(content);
  }
}

/**
 * Safe setter for element attribute
 * @param {HTMLElement} element - Target element
 * @param {string} attr - Attribute name
 * @param {string} value - Attribute value
 */
export function setSafeAttribute(element, attr, value) {
  if (!element) return;
  element.setAttribute(attr, sanitizeAttribute(value));
}

/**
 * Sanitize user profile data for display
 * @param {Object} profile - User profile object
 * @returns {Object} Sanitized profile
 */
export function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return {};
  
  return {
    full_name: sanitizeText(profile.full_name || ''),
    whatsapp_country: sanitizeText(profile.whatsapp_country || 'ID'),
    whatsapp: sanitizeText(profile.whatsapp || ''),
    telegram: sanitizeText(profile.telegram || ''),
    notification: sanitizeText(profile.notification || 'telegram'),
    // Don't sanitize ID, email (handled separately)
    id: profile.id,
    email: sanitizeEmail(profile.email)
  };
}