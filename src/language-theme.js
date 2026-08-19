/* ===== Shared Language & Theme Management ===== */
// Used by both main.js (landing page) and dashboard.js (dashboard page)

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
let themeToggle = null;
const html = document.documentElement;

export function getPreferredTheme() {
  return localStorage.getItem('theme') || 'dark';
}

export function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'false' : 'true');
  }
}

export function initTheme(toggleSelector = '#themeToggle') {
  themeToggle = document.querySelector(toggleSelector);
  if (themeToggle) {
    setTheme(getPreferredTheme());
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
}

// ============ Language Management ============
let langToggle = null;
let langDropdown = null;
let langFlag = null;
let langText = null;
let isLanguageInitialized = false;

function getDropdownItems() {
  return langDropdown ? langDropdown.querySelectorAll('.lang-dropdown-item') : [];
}

export function setLanguage(lang) {
  i18next.changeLanguage(lang).then(() => {
    localStorage.setItem('i18next', lang);
    
    // Update toggle button
    if (langFlag && langText) {
      langFlag.textContent = lang === 'id' ? '🇮🇩' : '🇺🇸';
      langText.textContent = lang === 'id' ? 'ID' : 'EN';
    }
    
    // Update dropdown items (query fresh each time)
    getDropdownItems().forEach(item => {
      const isActive = item.dataset.lang === lang;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    
    // Update all translated content on the page
    updateDynamicI18n();
    
    // Close dropdown
    if (langDropdown) langDropdown.classList.remove('show');
    if (langToggle) langToggle.classList.remove('active');
  });
}

export function initLanguage(selectorConfig = {}) {
  // Prevent double initialization (HMR safety)
  if (isLanguageInitialized) return;
  
  const {
    toggleSelector = '.lang-btn.lang-toggle',
    dropdownSelector = '.lang-dropdown',
    itemSelector = '.lang-dropdown-item'
  } = selectorConfig;
  
  langToggle = document.querySelector(toggleSelector);
  langDropdown = document.querySelector(dropdownSelector);
  
  if (!langToggle || !langDropdown) {
    // Language selector not present on this page
    return;
  }
  
  langFlag = langToggle.querySelector('.lang-flag');
  langText = langToggle.querySelector('.lang-text');
  
  // Toggle dropdown
  langToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = langDropdown.classList.toggle('show');
    langToggle.classList.toggle('active', isOpen);
  });
  
  // Dropdown item clicks - use event delegation on dropdown container
  langDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.lang-dropdown-item');
    if (item) {
      setLanguage(item.dataset.lang);
    }
  });
  
  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (langDropdown && langToggle && !langToggle.contains(e.target) && !langDropdown.contains(e.target)) {
      langDropdown.classList.remove('show');
      langToggle.classList.remove('active');
    }
  });
  
  // Initialize language from localStorage
  const savedLang = localStorage.getItem('i18next') || 'id';
  setLanguage(savedLang);
  
  isLanguageInitialized = true;
}

// ============ Update i18n for Dynamic Content ============
export function updateDynamicI18n() {
  if (typeof i18next === 'undefined') return;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const parts = key.split('.');
    let text = translations[i18next.language]?.[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      text = text?.[parts[i]];
    }
    if (text) el.textContent = text;
  });
}

// Export i18next instance for direct access if needed
export { i18next };