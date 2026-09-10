/* ===== XSS Protection Utilities ===== */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;')
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
    // Convert __text__ to <strong>text</strong>
    sanitized = sanitized.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Convert _text_ to <em>text</em>
    sanitized = sanitized.replace(/_(.+?)_/g, '<em>$1</em>');
    // Convert `code` to <code>code</code>
    sanitized = sanitized.replace(/`(.+?)`/g, '<code>$1</code>');
  }
  
  return sanitized;
}

/**
 * Sanitize text for safe display (no HTML allowed)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return escapeHtml(str);
}

/**
 * Sanitize email for safe display
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  // Basic email format validation + escape
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return '';
  return escapeHtml(email);
}

/**
 * Sanitize profile object for safe storage
 * @param {Object} profile - Profile object
 * @returns {Object} Sanitized profile
 */
export function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return {};
  
  const sanitized = {};
  for (const [key, value] of Object.entries(profile)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => typeof v === 'string' ? sanitizeText(v) : v);
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeProfile(value);
    }
  }
  return sanitized;
}

/**
 * Escape string for safe use in HTML attribute
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtmlAttr(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

/**
 * Create safe innerHTML by sanitizing untrusted content
 * @param {string} html - HTML string to sanitize
 * @param {string[]} allowedTags - List of allowed tags
 * @returns {string} Sanitized HTML
 */
export function setSafeInnerHTML(html, allowedTags = ['b', 'i', 'em', 'strong', 'code', 'span', 'div', 'p', 'br', 'a']) {
  if (typeof html !== 'string') return '';
  
  // Very basic tag filtering - only allow whitelisted tags
  // This is a simple implementation; for production consider DOMPurify
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  return html.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match;
    }
    return '';
  });
}

/**
 * Validate and sanitize URL for safe navigation
 * @param {string} url - URL to validate
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function setSafeContent(element, content, options = {}) {
  if (!element) return;
  if (typeof content !== 'string') content = '';
  element.textContent = content;
}

export function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    // Basic XSS prevention - reject javascript: and data: URLs
    if (parsed.href.startsWith('javascript:') || parsed.href.startsWith('data:')) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
