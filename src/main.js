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
const langBtns = document.querySelectorAll('.lang-btn');

function setLanguage(lang) {
  i18next.changeLanguage(lang);
  localStorage.setItem('i18next', lang);
  langBtns.forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

langBtns.forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

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

// ============ Login Modal ============
const loginModal = document.getElementById('loginModal');
const loginLink = document.querySelector('.btn-login');
const modalClose = document.querySelector('.modal-close');
const modalBackdrop = document.querySelector('.modal-backdrop');

function openLogin() {
  if (loginModal) loginModal.showModal();
}

function closeLogin() {
  if (loginModal) loginModal.close();
}

if (loginLink) {
  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    openLogin();
  });
}

if (modalClose) modalClose.addEventListener('click', closeLogin);
if (modalBackdrop) modalBackdrop.addEventListener('click', closeLogin);

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && loginModal && loginModal.open) closeLogin();
});

// ============ Login Form ============
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
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
    
    setTimeout(() => {
      showToast('Selamat datang! Login berhasil.', 'success');
      closeLogin();
      loginForm.reset();
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1500);
  });
}

// ============ Register Form ============
const registerForm = document.getElementById('registerForm');

if (registerForm) {
  // Real-time validation
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const termsCheckbox = registerForm.querySelector('[name="terms"]');
  const submitBtn = registerForm.querySelector('button[type="submit"]');

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

  registerForm.addEventListener('submit', (e) => {
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
    
    setTimeout(() => {
      showToast('Akun berhasil dibuat! Selamat bergabung 🎉', 'success');
      registerForm.reset();
      if (btn) {
        btn.textContent = originalText;
        btn.disabled = false;
      }
      validateForm();
    }, 2000);
  });
}

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
  
  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.offsetWidth;
    this.canvas.height = container.offsetHeight;
  }
  
  init() {
    const colors = this.getThemeColors();
    const regions = [
      { x: 0.2, y: 0.3, label: 'asia', color: colors.primary },
      { x: 0.7, y: 0.25, label: 'americas', color: colors.warm },
      { x: 0.5, y: 0.7, label: 'emea', color: colors.secondary }
    ];
    
    this.nodes = regions.map(r => ({
      ...r,
      px: r.x * this.canvas.width,
      py: r.y * this.canvas.height
    }));
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
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
    
    const cx = w / 2;
    const cy = h / 2;
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
