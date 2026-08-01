/* ===== AI Trading Platform — Main JavaScript ===== */

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

// ============ Login Modal ============
const loginModal = document.getElementById('loginModal');
const loginLink = document.querySelector('.btn-login');
const modalClose = document.querySelector('.modal-close');
const modalBackdrop = document.querySelector('.modal-backdrop');

function openLogin() {
  loginModal.showModal();
}

function closeLogin() {
  loginModal.close();
}

loginLink.addEventListener('click', (e) => {
  e.preventDefault();
  openLogin();
});

modalClose.addEventListener('click', closeLogin);
modalBackdrop.addEventListener('click', closeLogin);

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && loginModal.open) closeLogin();
});

// ============ Login Form ============
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  // Simulate login
  const btn = loginForm.querySelector('button[type="submit"]');
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  
  setTimeout(() => {
    showToast('Welcome back! Login successful.', 'success');
    closeLogin();
    loginForm.reset();
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }, 1500);
});

// ============ Register Form ============
const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const terms = registerForm.querySelector('[name="terms"]');
  
  if (!name || !email) {
    showToast('Please fill in your name and email', 'error');
    return;
  }
  
  if (!terms.checked) {
    showToast('Please agree to the Terms of Service', 'error');
    return;
  }
  
  const btn = registerForm.querySelector('button[type="submit"]');
  btn.textContent = 'Creating Account...';
  btn.disabled = true;
  
  setTimeout(() => {
    showToast('Account created! Welcome aboard. 🎉', 'success');
    registerForm.reset();
    btn.textContent = 'Daftar Gratis Sekarang';
    btn.disabled = false;
  }, 2000);
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
    transition: 'all 0.3s ease'
  });
  
  if (type === 'success') toast.style.background = 'var(--accent-secondary)';
  else if (type === 'error') toast.style.background = 'var(--accent-danger)';
  else toast.style.background = 'var(--accent-primary)';
  
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
  }
  
  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.offsetWidth;
    this.canvas.height = container.offsetHeight;
  }
  
  init() {
    // Create region nodes
    const regions = [
      { x: 0.2, y: 0.3, label: 'asia', color: '#3b82f6' },
      { x: 0.7, y: 0.25, label: 'americas', color: '#f59e0b' },
      { x: 0.5, y: 0.7, label: 'emea', color: '#a78bfa' }
    ];
    
    this.nodes = regions.map(r => ({
      ...r,
      px: r.x * this.canvas.width,
      py: r.y * this.canvas.height
    }));
    
    // Create particles flowing from nodes to center
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
    
    // Draw connection lines
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.06)';
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
});