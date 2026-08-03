/* ===== AI Trading Platform — Main JavaScript ===== */

import './styles.css';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './i18n.js';

// ============ i18n Init ============
i18next.use(LanguageDetector).init({
  resources: { id: { translation: translations.id }, en: { translation: translations.en } },
  fallbackLng: 'id',
  detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  interpolation: { escapeValue: false }
});

// ============ Theme Management ============
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function getPreferredTheme() {
  return localStorage.getItem('theme') || 'dark';
}

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'false' : 'true');
}

setTheme(getPreferredTheme());

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// ============ Language Management ============
const langToggle = document.querySelector('.lang-btn.lang-toggle');
const langDropdown = document.querySelector('.lang-dropdown');
const langDropdownItems = document.querySelectorAll('.lang-dropdown-item');
const langFlag = langToggle?.querySelector('.lang-flag');
const langText = langToggle?.querySelector('.lang-text');

function setLanguage(lang) {
  i18next.changeLanguage(lang);
  localStorage.setItem('i18next', lang);
  
  // Update toggle button
  if (langFlag && langText) {
    langFlag.textContent = lang === 'id' ? '🇮🇩' : '🇺🇸';
    langText.textContent = lang === 'id' ? 'ID' : 'EN';
  }
  
  // Update dropdown items
  langDropdownItems.forEach(item => {
    const isActive = item.dataset.lang === lang;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  
  // Close dropdown
  if (langDropdown) langDropdown.classList.remove('show');
  if (langToggle) langToggle.classList.remove('active');
}

// Toggle dropdown
if (langToggle && langDropdown) {
  langToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = langDropdown.classList.toggle('show');
    langToggle.classList.toggle('active', isOpen);
  });
}

// Dropdown item clicks
langDropdownItems.forEach(item => {
  item.addEventListener('click', () => setLanguage(item.dataset.lang));
});

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (langDropdown && langToggle && !langToggle.contains(e.target)) {
    langDropdown.classList.remove('show');
    langToggle.classList.remove('active');
  }
});

// Initialize language from localStorage
const savedLang = localStorage.getItem('i18next') || 'id';
setLanguage(savedLang);

// ============ Mobile Navigation ============
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close menu on link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ============ Nav Scroll Effect ============
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }
}, { passive: true });

// ============ Modal Management ============
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginLink = document.querySelector('.btn-login');
const modalClose = document.querySelector('.modal-close');
const modalBackdrop = document.querySelector('.modal-backdrop');
const openRegisterLink = document.getElementById('openRegisterLink');
const openLoginLink = document.getElementById('openLoginLink');

function openLogin() {
  if (registerModal && registerModal.open) registerModal.close();
  if (loginModal) loginModal.showModal();
}

function openRegister() {
  if (loginModal && loginModal.open) loginModal.close();
  if (registerModal) registerModal.showModal();
}

function closeAllModals() {
  if (loginModal && loginModal.open) loginModal.close();
  if (registerModal && registerModal.open) registerModal.close();
}

// Login modal triggers
if (loginLink) {
  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    openLogin();
  });
}

// Register link inside login modal
if (openRegisterLink) {
  openRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    openRegister();
  });
}

// Login link inside register modal
if (openLoginLink) {
  openLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    openLogin();
  });
}

// Close buttons (both modals)
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('dialog');
    if (modal) modal.close();
  });
});

// Backdrop click (close any open modal)
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (loginModal && loginModal.open) loginModal.close();
    if (registerModal && registerModal.open) registerModal.close();
    if (verificationModal && verificationModal.open) closeVerification();
  }
});

// ============ Social Login Buttons ============
document.querySelectorAll('.btn-social[data-provider]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const provider = btn.dataset.provider;
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/></svg>`;
    
    const { error } = await signInWithOAuth(provider);
    
    if (error) {
      showToast(error.message || `Gagal login dengan ${provider}`, 'error');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
    // Success handled by onAuthStateChange redirect
  });
});

// ============ CTA Register Button ============
const ctaRegisterBtn = document.querySelector('.hero-cta .btn[href="#register"]');
if (ctaRegisterBtn) {
  ctaRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openRegister();
  });
}

// ============ Login Form ============
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      showToast('Mohon isi semua field', 'error');
      return;
    }
    
    const btn = loginForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Masuk...';
    btn.disabled = true;
    
    // Real Supabase sign in
    const { data, error } = await signIn(email, password);
    
    if (error) {
      showToast(error.message || 'Login gagal', 'error');
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }
    
    showToast('Selamat datang! Login berhasil.', 'success');
    closeLogin();
    loginForm.reset();
    btn.textContent = originalText;
    btn.disabled = false;
    
    // Session will be set by onAuthStateChange listener
  });
}

// ============ Supabase Auth ============
import { signUp, signIn, signInWithOAuth, signOut, getSession as getSupabaseSession, getUser, onAuthStateChange, resendVerification } from './supabase.js';

// ============ Register Form (CTA inline) ============
const registerForm = document.getElementById('registerForm');

// Real-time validation
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const termsCheckbox = registerForm?.querySelector('[name="terms"]');
const submitBtn = registerForm?.querySelector('button[type="submit"]');

function validateField(input) {
  if (!input) return true;
  const value = input.value.trim();
  const isValid = value.length > 0;
  input.classList.toggle('invalid', !isValid && value.length === 0 && input !== document.activeElement);
  input.classList.toggle('valid', isValid);
  return isValid;
}

function validateForm() {
  const isNameValid = validateField(nameInput);
  const isEmailValid = validateField(emailInput);
  const isTermsValid = termsCheckbox ? termsCheckbox.checked : true;
  
  if (submitBtn) {
    submitBtn.disabled = !(isNameValid && isEmailValid && isTermsValid);
  }
}

if (nameInput) nameInput.addEventListener('input', validateForm);
if (emailInput) emailInput.addEventListener('input', validateForm);
if (termsCheckbox) termsCheckbox.addEventListener('change', validateForm);

// Initial state
validateForm();

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const terms = termsCheckbox ? termsCheckbox.checked : false;
    
    if (!name || !email) {
      showToast('Mohon isi nama dan email', 'error');
      return;
    }
    
    if (!terms) {
      showToast('Harap setujui Syarat & Ketentuan', 'error');
      return;
    }
    
    const btn = submitBtn;
    const originalText = btn ? btn.textContent : '';
    if (btn) {
      btn.textContent = 'Membuat Akun...';
      btn.disabled = true;
    }
    
    // Real Supabase sign up (password will be asked in verification step)
    // For CTA inline form, we create account with temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
    
    const { data, error } = await signUp(email, tempPassword, {
      full_name: name,
      experience: 'beginner'
    });
    
    if (error) {
      showToast(error.message || 'Gagal mendaftar', 'error');
      if (btn) {
        btn.textContent = originalText;
        btn.disabled = false;
      }
      return;
    }
    
    showToast('Akun berhasil dibuat! Cek email untuk verifikasi.', 'success');
    registerForm.reset();
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
    validateForm();
    
    // For inline form, we don't have password - user sets it via email link
    // Show verification info modal
    openVerification(email, name, true); // true = emailLinkSent
  });
}

// ============ Register Modal Form ============
const registerModalForm = document.getElementById('registerModalForm');

if (registerModalForm) {
  const modalNameInput = document.getElementById('regName');
  const modalEmailInput = document.getElementById('regEmail');
  const modalPasswordInput = document.getElementById('regPassword');
  const modalExperienceInput = document.getElementById('regExperience');
  const modalTermsCheckbox = registerModalForm.querySelector('[name="terms"]');
  const modalSubmitBtn = registerModalForm.querySelector('button[type="submit"]');
  
  function validateModalField(input) {
    if (!input) return true;
    const value = input.value.trim();
    const isValid = value.length > 0;
    input.classList.toggle('invalid', !isValid && value.length === 0 && input !== document.activeElement);
    input.classList.toggle('valid', isValid);
    return isValid;
  }
  
  function validateModalForm() {
    const isNameValid = validateModalField(modalNameInput);
    const isEmailValid = validateModalField(modalEmailInput);
    const isPasswordValid = validateModalField(modalPasswordInput);
    const isTermsValid = modalTermsCheckbox ? modalTermsCheckbox.checked : true;
    
    if (modalSubmitBtn) {
      modalSubmitBtn.disabled = !(isNameValid && isEmailValid && isPasswordValid && isTermsValid);
    }
  }
  
  if (modalNameInput) modalNameInput.addEventListener('input', validateModalForm);
  if (modalEmailInput) modalEmailInput.addEventListener('input', validateModalForm);
  if (modalPasswordInput) modalPasswordInput.addEventListener('input', validateModalForm);
  if (modalTermsCheckbox) modalTermsCheckbox.addEventListener('change', validateModalForm);
  
  // Initial state
  validateModalForm();
  
  registerModalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = modalNameInput ? modalNameInput.value.trim() : '';
    const email = modalEmailInput ? modalEmailInput.value.trim() : '';
    const password = modalPasswordInput ? modalPasswordInput.value : '';
    const experience = modalExperienceInput ? modalExperienceInput.value : '';
    const terms = modalTermsCheckbox ? modalTermsCheckbox.checked : false;
    
    if (!name || !email || !password) {
      showToast('Mohon isi semua field', 'error');
      return;
    }
    
    if (password.length < 6) {
      showToast('Kata sandi minimal 6 karakter', 'error');
      return;
    }
    
    if (!terms) {
      showToast('Harap setujui Syarat & Ketentuan', 'error');
      return;
    }
    
    const btn = modalSubmitBtn;
    const originalText = btn ? btn.textContent : '';
    if (btn) {
      btn.textContent = 'Membuat Akun...';
      btn.disabled = true;
    }
    
    // Real Supabase sign up
    const { data, error } = await signUp(email, password, {
      full_name: name,
      experience: experience || 'beginner'
    });
    
    if (error) {
      showToast(error.message || 'Gagal mendaftar', 'error');
      if (btn) {
        btn.textContent = originalText;
        btn.disabled = false;
      }
      return;
    }
    
    showToast('Akun berhasil dibuat! Cek email untuk verifikasi.', 'success');
    closeAllModals();
    registerModalForm.reset();
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
    validateModalForm();
    
    // Show verification info (email link sent)
    openVerification(email, name, true);
  });
}

// ============ Verification Modal ============
const verificationModal = document.getElementById('verificationModal');
const verificationForm = document.getElementById('verificationForm');
const verifyCodeInput = document.getElementById('verifyCode');
const verifyEmailDisplay = document.getElementById('verifyEmailDisplay');
const resendCodeBtn = document.getElementById('resendCodeBtn');
const resendContainer = document.getElementById('resendContainer');
const resendTimer = document.getElementById('resendTimer');

let verificationEmail = '';
let verificationName = '';
let resendCountdown = 0;
let resendInterval = null;

function openVerification(email, name, emailLinkSent = false) {
  verificationEmail = email;
  verificationName = name;
  
  if (verifyEmailDisplay) verifyEmailDisplay.textContent = email;
  if (verifyCodeInput) verifyCodeInput.value = '';
  
  closeAllModals();
  if (verificationModal) verificationModal.showModal();
  
  if (emailLinkSent) {
    // Supabase sends magic link email, no code entry needed
    if (verificationForm) verificationForm.style.display = 'none';
    if (resendContainer) resendContainer.style.display = 'none';
    if (resendTimer) resendTimer.style.display = 'none';
    
    // Show info message
    const existingInfo = verificationModal.querySelector('.verification-info');
    if (existingInfo) existingInfo.remove();
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'verification-info';
    infoDiv.style.cssText = 'text-align:center;padding:1.5rem;color:var(--text-secondary);';
    infoDiv.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48" style="color:var(--accent-primary);margin-bottom:1rem;">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
      <h3 style="margin-bottom:0.5rem;">Cek Email Anda</h3>
      <p>Kami telah mengirimkan tautan verifikasi ke <strong>${email}</strong></p>
      <p style="font-size:0.85rem;margin-top:0.5rem;">Klik tautan di email untuk menyelesaikan pendaftaran.</p>
      <button type="button" class="btn-link" id="resendEmailLinkBtn" style="margin-top:1rem;" data-i18n="verification.resend">Kirim ulang email</button>
    `;
    verificationModal.querySelector('.modal-content').appendChild(infoDiv);
    
    // Re-attach resend handler
    const resendLinkBtn = document.getElementById('resendEmailLinkBtn');
    if (resendLinkBtn) {
      resendLinkBtn.addEventListener('click', async () => {
        const { error } = await resendVerification(email);
        if (error) showToast('Gagal kirim ulang: ' + error.message, 'error');
        else showToast('Email verifikasi dikirim ulang', 'success');
      });
    }
  } else {
    // Fallback for old code-based flow
    if (verificationForm) verificationForm.style.display = 'flex';
    if (resendContainer) resendContainer.style.display = 'inline';
    if (resendTimer) resendTimer.style.display = 'block';
    const existingInfo = verificationModal.querySelector('.verification-info');
    if (existingInfo) existingInfo.remove();
    startResendTimer();
    if (verifyCodeInput) setTimeout(() => verifyCodeInput.focus(), 100);
  }
}

function closeVerification() {
  if (verificationModal) verificationModal.close();
  if (resendInterval) {
    clearInterval(resendInterval);
    resendInterval = null;
  }
}

function startResendTimer() {
  resendCountdown = 60;
  if (resendContainer) resendContainer.style.display = 'none';
  if (resendTimer) resendTimer.style.display = 'block';
  updateResendTimer();
  
  if (resendInterval) clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    resendCountdown--;
    updateResendTimer();
    if (resendCountdown <= 0) {
      clearInterval(resendInterval);
      resendInterval = null;
      if (resendContainer) resendContainer.style.display = 'inline';
      if (resendTimer) resendTimer.style.display = 'none';
    }
  }, 1000);
}

function updateResendTimer() {
  if (resendTimer) {
    const t = i18next.t('verification.resend_timer', { seconds: resendCountdown });
    resendTimer.textContent = t || `Kirim ulang dalam ${resendCountdown} detik`;
  }
}

if (resendCodeBtn) {
  resendCodeBtn.addEventListener('click', () => {
    showToast('Kode verifikasi baru dikirim', 'info');
    startResendTimer();
  });
}

if (verificationForm) {
  verificationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = verifyCodeInput ? verifyCodeInput.value.trim() : '';
    
    if (!code || code.length !== 6) {
      showToast('Masukkan kode 6 digit', 'error');
      return;
    }
    
    const btn = verificationForm.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : '';
    if (btn) {
      btn.textContent = 'Memverifikasi...';
      btn.disabled = true;
    }
    
    // Mock verification - accept any 6-digit code
    setTimeout(() => {
      showToast(i18next.t('verification.success') || 'Email berhasil diverifikasi! Mengarahkan ke dashboard...', 'success');
      closeVerification();
      verificationForm.reset();
      if (btn) {
        btn.textContent = originalText;
        btn.disabled = false;
      }
      // Auto-login and redirect to dashboard
      autoLogin(verificationEmail, verificationName);
    }, 1500);
  });
}

// Close verification modal on backdrop click / escape
if (verificationModal) {
  verificationModal.addEventListener('click', (e) => {
    if (e.target === verificationModal) closeVerification();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && verificationModal && verificationModal.open) closeVerification();
});

// ============ Toast Notification ============
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    padding: '1rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    color: 'white',
    fontWeight: '500',
    fontSize: '0.9rem',
    zIndex: '9999',
    boxShadow: 'var(--shadow-lg)',
    transform: 'translateY(100px)',
    opacity: '0',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  });
  
  if (type === 'success') toast.style.background = 'rgba(34, 211, 167, 0.92)';
  else if (type === 'error') toast.style.background = 'rgba(240, 78, 78, 0.92)';
  else toast.style.background = 'rgba(79, 142, 255, 0.92)';
  
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============ Global Data Flow Animation ============
class GlobalFlowAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.nodes = [];
    this.animFrame = null;
    this.resize();
    this.init();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
    // Listen for theme changes
    const observer = new MutationObserver(() => this.init());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  
  getThemeColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      return {
        primary: '#1d4ed8',
        warm: '#92400e',
        secondary: '#5b21b6',
        lineColor: 'rgba(29, 78, 216, 0.25)'
      };
    }
    return {
      primary: '#4f8eff',
      warm: '#f5a623',
      secondary: '#a78bfa',
      lineColor: 'rgba(79, 142, 255, 0.06)'
    };
  }
  
  getContainerCenter() {
    // Get the hero-visual-wrapper which contains the workstation visual
    const wrapper = document.querySelector('.hero-visual-wrapper');
    if (!wrapper) return { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    
    const canvasRect = this.canvas.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    
    // Calculate wrapper center relative to canvas
    const centerX = wrapperRect.left - canvasRect.left + wrapperRect.width / 2;
    const centerY = wrapperRect.top - canvasRect.top + wrapperRect.height / 2;
    
    return { x: centerX, y: centerY };
  }
  
  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.offsetWidth;
    this.canvas.height = container.offsetHeight;
  }
  
  init() {
    const colors = this.getThemeColors();
    const center = this.getContainerCenter();
    const centerX = center.x;
    const centerY = center.y;
    
    // Calculate region positions relative to wrapper center
    // Regions positioned around the workstation visual
    const regions = [
      { x: centerX - 180, y: centerY - 120, label: 'asia', color: colors.primary },
      { x: centerX + 220, y: centerY - 100, label: 'americas', color: colors.warm },
      { x: centerX, y: centerY + 200, label: 'emea', color: colors.secondary }
    ];
    
    this.nodes = regions.map(r => ({
      ...r,
      px: r.x,
      py: r.y
    }));
    
    for (let i = 0; i < 120; i++) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      this.particles.push({
        x: region.px + (Math.random() - 0.5) * 60,
        y: region.py + (Math.random() - 0.5) * 60,
        targetX: centerX + (Math.random() - 0.5) * 40,
        targetY: centerY + (Math.random() - 0.5) * 40,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        size: Math.max(1, 1.5 + Math.random() * 2),
        color: region.color,
        opacity: 0.3 + Math.random() * 0.7
      });
    }
  }
  
  animate() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    const center = this.getContainerCenter();
    const cx = center.x;
    const cy = center.y;
    const colors = this.getThemeColors();
    
    // Draw connection lines
    ctx.strokeStyle = colors.lineColor;
    ctx.lineWidth = 1;
    this.nodes.forEach(node => {
      ctx.beginPath();
      ctx.moveTo(node.px, node.py);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    });
    
    // Update and draw particles
    this.particles.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) {
        p.progress = 0;
        const region = this.nodes.find(n => n.color === p.color);
        if (region) {
          p.x = region.px + (Math.random() - 0.5) * 60;
          p.y = region.py + (Math.random() - 0.5) * 60;
        }
      }
      
      const x = p.x + (p.targetX - p.x) * p.progress;
      const y = p.y + (p.targetY - p.y) * p.progress;
      
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * (1 - p.progress * 0.5);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
    this.animFrame = requestAnimationFrame(() => this.animate());
  }
  
  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
}

// ============ Scroll Reveal ============
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  
  document.querySelectorAll('.reveal, .feature-card, .step').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

// ============ Animated Counters ============
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const isDecimal = target % 1 !== 0;
        const duration = 2000;
        const start = performance.now();
        
        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;
          
          if (isDecimal) {
            el.textContent = current.toFixed(1);
          } else {
            el.textContent = Math.floor(current).toLocaleString('id-ID');
          }
          
          if (progress < 1) requestAnimationFrame(update);
        }
        
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(c => observer.observe(c));
}

// ============ Smooth Scroll for Anchor Links ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Close mobile menu if open
      if (navLinks) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

// ============ Init ============
document.addEventListener('DOMContentLoaded', () => {
  // Init i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const parts = key.split('.');
    let text = translations[i18next.language]?.[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      text = text?.[parts[i]];
    }
    if (text) el.innerHTML = text;
  });

  // Init i18n placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const parts = key.split('.');
    let text = translations[i18next.language]?.[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      text = text?.[parts[i]];
    }
    if (text) el.placeholder = text;
  });

  // Init canvas animation
  const canvas = document.getElementById('globalFlowCanvas');
  if (canvas) new GlobalFlowAnimation(canvas);
  
  // Init scroll reveal
  initScrollReveal();
  
  // Init counters
  initCounters();
});

// Re-translate when language changes
i18next.on('languageChanged', (lng) => {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const parts = key.split('.');
    let text = translations[lng]?.[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      text = text?.[parts[i]];
    }
    if (text) el.innerHTML = text;
  });

  // Re-translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const parts = key.split('.');
    let text = translations[lng]?.[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      text = text?.[parts[i]];
    }
    if (text) el.placeholder = text;
  });
});

// ============ Supabase Auth ============
import { supabase } from './supabase.js';

// ============ Auth Session Management ============
function autoLogin(email, name) {
  const session = {
    user: {
      email: email,
      name: name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f8eff&color=fff&size=128`
    },
    token: 'mock-jwt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    isVerified: true
  };
  localStorage.setItem('auth_session', JSON.stringify(session));
  window.location.href = '/dashboard.html';
}

function getLocalSession() {
  try {
    const session = JSON.parse(localStorage.getItem('auth_session'));
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('auth_session');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function logout() {
  signOut().then(() => {
    localStorage.removeItem('auth_session');
    window.location.href = '/';
  });
}

function requireAuth() {
  const session = getLocalSession();
  if (!session) {
    window.location.href = '/';
    return null;
  }
  return session;
}

function updateNavbarForAuth(session) {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;
  
  if (session) {
    // Replace login button with user dropdown
    const loginBtn = navActions.querySelector('.btn-login');
    if (loginBtn) loginBtn.remove();
    
    // Check if dropdown already exists
    if (navActions.querySelector('.user-dropdown')) return;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
      <button class="user-avatar-btn" aria-label="User menu" aria-expanded="false" aria-haspopup="true">
        <img src="${session.user.avatar}" alt="" class="user-avatar" width="32" height="32">
        <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="user-dropdown-menu" role="menu" hidden>
        <div class="user-info">
          <img src="${session.user.avatar}" alt="" class="user-avatar-sm" width="40" height="40">
          <div>
            <span class="user-name">${session.user.name}</span>
            <span class="user-email">${session.user.email}</span>
          </div>
        </div>
        <hr class="dropdown-divider">
        <a href="/dashboard.html" class="dropdown-item" role="menuitem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span data-i18n="nav.dashboard">Dashboard</span>
        </a>
        <a href="/settings.html" class="dropdown-item" role="menuitem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 21.4a1.65 1.65 0 0 0-1.96.36l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.36-1.96l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.96-.36l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.96.36l-.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-.33 1.82V15a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-.36 1.96l-.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.36-1.96l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.36-1.96l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82-.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.96-.36l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0-.33-1.82V9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.36-1.96l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82-.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.96-.36l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0-.33-1.82V9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.36-1.96l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82-.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.96-.36l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0-.33-1.82V9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.36-1.96l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82-.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51"/></svg>
          <span data-i18n="nav.settings">Pengaturan</span>
        </a>
        <button class="dropdown-item btn-logout" role="menuitem" id="logoutBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span data-i18n="nav.logout">Keluar</span>
        </button>
      </div>
    `;
    navActions.insertBefore(dropdown, navActions.querySelector('.theme-toggle'));
    
    // Dropdown toggle
    const avatarBtn = dropdown.querySelector('.user-avatar-btn');
    const dropdownMenu = dropdown.querySelector('.user-dropdown-menu');
    
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.hidden = !dropdownMenu.hidden;
      avatarBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdownMenu.hidden = true;
        avatarBtn.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Logout button
    const logoutBtn = dropdown.querySelector('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logout();
      });
    }
    
    // Update i18n for new elements
    if (typeof i18next !== 'undefined') {
      dropdown.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const parts = key.split('.');
        let text = translations[i18next.language]?.[parts[0]];
        for (let i = 1; i < parts.length; i++) {
          text = text?.[parts[i]];
        }
        if (text) el.textContent = text;
      });
    }
  } else {
    // Not logged in - ensure login button exists
    if (!navActions.querySelector('.btn-login')) {
      const loginBtn = document.createElement('a');
      loginBtn.href = '#login';
      loginBtn.className = 'btn btn-primary btn-login';
      loginBtn.dataset.i18n = 'nav.login';
      loginBtn.textContent = 'Masuk';
      navActions.insertBefore(loginBtn, navActions.querySelector('.theme-toggle'));
      
      // Re-attach click handler
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openLogin();
      });
    }
    
    // Remove user dropdown if exists
    const dropdown = navActions.querySelector('.user-dropdown');
    if (dropdown) dropdown.remove();
  }
}

// Check auth on load
document.addEventListener('DOMContentLoaded', async () => {
  // Listen to Supabase auth state changes
  const { data: { subscription } } = onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // User signed in - update UI
      const userSession = {
        user: {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || session.user.email)}&background=4f8eff&color=fff&size=128`
        },
        token: session.access_token,
        expiresAt: Date.now() + session.expires_in * 1000,
        isVerified: session.user.email_confirmed_at !== null
      };
      localStorage.setItem('auth_session', JSON.stringify(userSession));
      updateNavbarForAuth(userSession);
      
      // Redirect to dashboard if on login/register page
      if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        window.location.href = '/dashboard.html';
      }
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('auth_session');
      updateNavbarForAuth(null);
      
      // Redirect to home if on dashboard
      if (window.location.pathname === '/dashboard.html') {
        window.location.href = '/';
      }
    }
  });
  
  // Check initial session
  const { data: { session } } = await getSupabaseSession();
  if (session) {
    const userSession = {
      user: {
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || session.user.email)}&background=4f8eff&color=fff&size=128`
      },
      token: session.access_token,
      expiresAt: Date.now() + session.expires_in * 1000,
      isVerified: session.user.email_confirmed_at !== null
    };
    localStorage.setItem('auth_session', JSON.stringify(userSession));
    updateNavbarForAuth(userSession);
  } else {
    const localSession = getLocalSession();
    updateNavbarForAuth(localSession);
  }
});
