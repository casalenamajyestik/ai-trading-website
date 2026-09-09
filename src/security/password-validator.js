/**
 * Password Strength Validator
 * Enforces strong password policies
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  // Common special characters allowed
  allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  // Check against common passwords
  checkCommonPasswords: true,
  // Check against user info (email, name)
  checkUserInfo: true
};

// Common weak passwords (top 1000 most common)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'hello',
  'freedom', 'whatever', 'qazwsx', 'trustno1', '654321', 'jordan23',
  'harley', 'robert', 'matthew', 'jordan', 'asshole', 'daniel', 'andrew',
  // Add more as needed - in production load from file
]);

/**
 * Check password strength and return detailed result
 * @param {string} password - Password to check
 * @param {Object} userInfo - Optional user info to check against (email, name)
 * @returns {Object} { score: number, feedback: string[], isValid: boolean, requirements: Object }
 */
export function validatePassword(password, userInfo = {}) {
  const feedback = [];
  let score = 0;
  const requirements = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    notCommon: false,
    notUserInfo: false
  };

  if (!password) {
    return {
      score: 0,
      feedback: ['Kata sandi tidak boleh kosong'],
      isValid: false,
      requirements
    };
  }

  // Length check
  if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
    requirements.minLength = true;
    score += 20;
  } else {
    feedback.push(`Minimal ${PASSWORD_REQUIREMENTS.minLength} karakter`);
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    feedback.push(`Maksimal ${PASSWORD_REQUIREMENTS.maxLength} karakter`);
    score = Math.max(0, score - 10);
  }

  // Character variety checks
  if (/[A-Z]/.test(password)) {
    requirements.hasUppercase = true;
    score += 15;
  } else if (PASSWORD_REQUIREMENTS.requireUppercase) {
    feedback.push('Harus mengandung huruf besar (A-Z)');
  }

  if (/[a-z]/.test(password)) {
    requirements.hasLowercase = true;
    score += 15;
  } else if (PASSWORD_REQUIREMENTS.requireLowercase) {
    feedback.push('Harus mengandung huruf kecil (a-z)');
  }

  if (/[0-9]/.test(password)) {
    requirements.hasNumber = true;
    score += 15;
  } else if (PASSWORD_REQUIREMENTS.requireNumbers) {
    feedback.push('Harus mengandung angka (0-9)');
  }

  const specialChars = PASSWORD_REQUIREMENTS.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const specialCharRegex = new RegExp(`[${specialChars}]`);
  if (specialCharRegex.test(password)) {
    requirements.hasSpecialChar = true;
    score += 20;
  } else if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    feedback.push(`Harus mengandung karakter khusus (${PASSWORD_REQUIREMENTS.allowedSpecialChars})`);
  }

  // Check against common passwords
  if (PASSWORD_REQUIREMENTS.checkCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (!COMMON_PASSWORDS.has(lowerPassword)) {
      requirements.notCommon = true;
      score += 15;
    } else {
      feedback.push('Kata sandi terlalu umum, pilih yang lebih unik');
      score = Math.max(0, score - 30);
    }
  }

  // Check against user info
  if (PASSWORD_REQUIREMENTS.checkUserInfo && userInfo) {
    const userStrings = [
      userInfo.email?.split('@')[0]?.toLowerCase(),
      userInfo.name?.toLowerCase().replace(/\s+/g, ''),
      userInfo.name?.toLowerCase().split(' ')[0]
    ].filter(Boolean);

    let containsUserInfo = false;
    for (const str of userStrings) {
      if (str && str.length >= 3 && password.toLowerCase().includes(str)) {
        containsUserInfo = true;
        break;
      }
    }

    if (!containsUserInfo) {
      requirements.notUserInfo = true;
      score += 10;
    } else {
      feedback.push('Kata sandi tidak boleh mengandung nama atau email Anda');
      score = Math.max(0, score - 20);
    }
  }

  // Bonus for extra length
  if (password.length >= 16) score += 5;
  if (password.length >= 20) score += 5;

  // Cap score at 100
  score = Math.min(100, score);

  const isValid = requirements.minLength && 
                  (!PASSWORD_REQUIREMENTS.requireUppercase || requirements.hasUppercase) &&
                  (!PASSWORD_REQUIREMENTS.requireLowercase || requirements.hasLowercase) &&
                  (!PASSWORD_REQUIREMENTS.requireNumbers || requirements.hasNumber) &&
                  (!PASSWORD_REQUIREMENTS.requireSpecialChars || requirements.hasSpecialChar) &&
                  requirements.notCommon &&
                  requirements.notUserInfo;

  return {
    score,
    feedback,
    isValid,
    requirements
  };
}

/**
 * Get password strength label
 * @param {number} score - Password score (0-100)
 * @returns {Object} { label: string, color: string, className: string }
 */
export function getPasswordStrengthLabel(score) {
  if (score < 30) return { label: 'Sangat Lemah', color: '#f04e4e', className: 'strength-very-weak' };
  if (score < 50) return { label: 'Lemah', color: '#f97316', className: 'strength-weak' };
  if (score < 70) return { label: 'Sedang', color: '#f5a623', className: 'strength-medium' };
  if (score < 85) return { label: 'Kuat', color: '#22d3a7', className: 'strength-strong' };
  return { label: 'Sangat Kuat', color: '#22d3a7', className: 'strength-very-strong' };
}

/**
 * Create password strength meter UI
 * @param {HTMLInputElement} passwordInput - Password input element
 * @param {Object} userInfo - Optional user info
 * @returns {Object} { meter: HTMLElement, update: Function }
 */
export function createPasswordStrengthMeter(passwordInput, userInfo = {}) {
  const container = document.createElement('div');
  container.className = 'password-strength-meter';
  container.style.cssText = 'margin-top: 0.5rem;';
  
  const barContainer = document.createElement('div');
  barContainer.style.cssText = 'height: 4px; background: var(--bg-input); border-radius: 2px; overflow: hidden;';
  
  const bar = document.createElement('div');
  bar.style.cssText = 'height: 100%; width: 0%; transition: width 0.3s ease, background-color 0.3s ease; border-radius: 2px;';
  barContainer.appendChild(bar);
  
  const label = document.createElement('div');
  label.style.cssText = 'font-size: 0.7rem; margin-top: 0.25rem; color: var(--text-muted);';
  
  const requirementsList = document.createElement('ul');
  requirementsList.style.cssText = 'font-size: 0.65rem; color: var(--text-muted); margin-top: 0.5rem; padding-left: 1rem; display: none;';
  
  container.appendChild(barContainer);
  container.appendChild(label);
  container.appendChild(requirementsList);
  
  // Insert after password input
  passwordInput.parentNode.insertBefore(container, passwordInput.nextSibling);
  
  const update = (password) => {
    const result = validatePassword(password, userInfo);
    const strength = getPasswordStrengthLabel(result.score);
    
    bar.style.width = `${result.score}%`;
    bar.style.backgroundColor = strength.color;
    label.textContent = `Kekuatan: ${strength.label}`;
    label.style.color = strength.color;
    
    // Update requirements list
    requirementsList.innerHTML = '';
    const reqs = [
      { key: 'minLength', text: `Minimal ${PASSWORD_REQUIREMENTS.minLength} karakter` },
      { key: 'hasUppercase', text: 'Huruf besar (A-Z)' },
      { key: 'hasLowercase', text: 'Huruf kecil (a-z)' },
      { key: 'hasNumber', text: 'Angka (0-9)' },
      { key: 'hasSpecialChar', text: `Karakter khusus (${PASSWORD_REQUIREMENTS.allowedSpecialChars})` },
      { key: 'notCommon', text: 'Bukan kata sandi umum' },
      { key: 'notUserInfo', text: 'Tidak mengandung info pribadi' }
    ];
    
    reqs.forEach(req => {
      const li = document.createElement('li');
      li.textContent = req.text;
      li.style.color = result.requirements[req.key] ? 'var(--accent-secondary)' : 'var(--accent-danger)';
      li.style.listStyle = result.requirements[req.key] ? 'none' : 'disc';
      if (result.requirements[req.key]) {
        li.innerHTML = '✓ ' + req.text;
      }
      requirementsList.appendChild(li);
    });
    
    // Show requirements on focus
    passwordInput.addEventListener('focus', () => {
      requirementsList.style.display = 'block';
    }, { once: true });
  };
  
  passwordInput.addEventListener('input', (e) => update(e.target.value));
  
  return { meter: container, update };
}