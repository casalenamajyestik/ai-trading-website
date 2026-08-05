// Shared auth state listener & utils — load on BOTH index.html and dashboard.html
import { onAuthStateChange, getSession as getSupabaseSession, signOut, getProfile } from './supabase.js';
import i18next from 'i18next';
import { translations } from './i18n.js';

// ============ Shared Utils ============
export function getLocalSession() {
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

export function logout() {
  signOut().then(() => {
    localStorage.removeItem('auth_session');
    window.location.href = '/';
  });
}

export function requireAuth() {
  const session = getLocalSession();
  if (!session) {
    window.location.href = '/';
    return null;
  }
  return session;
}

export function updateNavbarForAuth(session) {
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 21.4a1.65 1.65 0 0 0-1.96.36l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.36-1.96l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.96-.36l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.96.36l-.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-.33 1.82V15a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-.36 1.96l-.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.36-1.96l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82-.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.96-.36l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0-.33-1.82V9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.36-1.96l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82-.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.96-.36l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l-.06-.... [truncated]
          <span data-i18n="nav.settings">Pengaturan</span>
        </a>
        <button class="dropdown-item btn-logout" role="menuitem" id="logoutBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span data-i18n="nav.logout">Keluar</span>
        </button>
      </div>
    `;
    navActions.insertBefore(dropdown, navActions.querySelector('.theme-toggle'));
    
    // Dropdown elements
    const avatarBtn = dropdown.querySelector('.user-avatar-btn');
    const dropdownMenu = dropdown.querySelector('.user-dropdown-menu');
    
    // Dropdown toggle - with touch support for mobile
    const toggleDropdown = (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.hidden = !dropdownMenu.hidden;
      avatarBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };
    
    avatarBtn.addEventListener('click', toggleDropdown);
    avatarBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      toggleDropdown(e);
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

// Need openLogin reference - will be set by main.js
let openLoginRef = null;
export function setOpenLoginRef(fn) { openLoginRef = fn; }
function openLogin() { if (openLoginRef) openLoginRef(); }

// ============ Auth State Listener ============
const { data: { subscription } } = onAuthStateChange(async (event, session) => {
  console.log('[AUTH STATE CHANGE]', event, session ? 'session exists' : 'no session');
  if (event === 'SIGNED_IN' && session) {
    // Fetch profile from Supabase database
    let profile = null;
    try {
      const { data: profileData } = await getProfile(session.user.id);
      profile = profileData;
    } catch (err) {
      console.warn('Failed to fetch profile:', err);
    }
    
    const userSession = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || session.user.email)}&background=4f8eff&color=fff&size=128`,
        // Merge profile data from database
        whatsappCountry: profile?.whatsapp_country || 'ID',
        whatsapp: profile?.whatsapp || '',
        telegram: profile?.telegram || '',
        notification: profile?.notification || 'telegram'
      },
      token: session.access_token,
      expiresAt: Date.now() + session.expires_in * 1000,
      isVerified: session.user.email_confirmed_at !== null
    };
    localStorage.setItem('auth_session', JSON.stringify(userSession));
    updateNavbarForAuth(userSession);
    
    // Redirect to dashboard if on login/register page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      console.log('[AUTH] Redirecting to dashboard...');
      window.location.href = '/dashboard.html';
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('[AUTH] Signed out');
    localStorage.removeItem('auth_session');
    updateNavbarForAuth(null);
    
    // Redirect to home if on dashboard
    if (window.location.pathname === '/dashboard.html') {
      window.location.href = '/';
    }
  }
});

// Check initial session (for page refresh on dashboard)
export async function initAuth() {
  let session = null;
  try {
    const sessionPromise = getSupabaseSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout')), 5000)
    );
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    session = result.data?.session;
  } catch (err) {
    console.warn('Supabase session check failed/timed out:', err);
    session = null;
  }
  
  if (session) {
    // Fetch profile from Supabase database
    let profile = null;
    try {
      const { data: profileData } = await getProfile(session.user.id);
      profile = profileData;
    } catch (err) {
      console.warn('Failed to fetch profile:', err);
    }
    
    const userSession = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || session.user.email)}&background=4f8eff&color=fff&size=128`,
        // Merge profile data from database
        whatsappCountry: profile?.whatsapp_country || 'ID',
        whatsapp: profile?.whatsapp || '',
        telegram: profile?.telegram || '',
        notification: profile?.notification || 'telegram'
      },
      token: session.access_token,
      expiresAt: Date.now() + session.expires_in * 1000,
      isVerified: session.user.email_confirmed_at !== null
    };
    localStorage.setItem('auth_session', JSON.stringify(userSession));
    updateNavbarForAuth(userSession);
    
    // If on home page, redirect to dashboard
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      window.location.href = '/dashboard.html';
    }
  } else {
    const localSession = getLocalSession();
    updateNavbarForAuth(localSession);
  }
}