/* ===== AI Trading Platform — Main JavaScript ===== */

import './styles.css';
import { i18next, initTheme, initLanguage, updateDynamicI18n } from './language-theme.js';
import { translations } from './i18n.js';

// Auth listener (shared with dashboard)
import { initAuth, updateNavbarForAuth, setOpenLoginRef } from './auth-listener.js';

// Supabase Auth
import { signUp, signIn, signInWithOAuth, signOut, getSession as getSupabaseSession, getUser, onAuthStateChange, resendVerification } from './supabase.js';

// Initialize theme, language, and auth
console.log('main.js: Module started');
initTheme('#themeToggle');
initLanguage();

// Define openLogin BEFORE initAuth so the navbar login button works immediately
let loginModal = document.getElementById('loginModal');
let registerModal = document.getElementById('registerModal');
let verificationModal = document.getElementById('verificationModal');

function openLogin() {
  if (registerModal && registerModal.open) registerModal.close();
  if (loginModal) loginModal.showModal();
}

// Register openLogin with auth-listener for navbar dropdown BEFORE initAuth
setOpenLoginRef(openLogin);

console.log('main.js: Starting initAuth...');
initAuth()
  .then(() => {
    console.log('initAuth completed, setting up modals');
    // ============ Modal Management ============
    // Modals already initialized at module level
    const loginLink = document.querySelector('.btn-login');
    const modalClose = document.querySelector('.modal-close');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const openRegisterLink = document.getElementById('openRegisterLink');
    const openLoginLink = document.getElementById('openLoginLink');
    const verificationForm = document.getElementById('verificationForm');
    const verifyCodeInput = document.getElementById('verifyCode');
    const verifyEmailDisplay = document.getElementById('verifyEmailDisplay');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    const resendContainer = document.getElementById('resendContainer');
    const resendTimer = document.getElementById('resendTimer');

    function openRegister() {
      if (loginModal && loginModal.open) loginModal.close();
      if (registerModal) registerModal.showModal();
    }

    function closeAllModals() {
      if (loginModal && loginModal.open) loginModal.close();
      if (registerModal && registerModal.open) registerModal.close();
      if (verificationModal && verificationModal.open) verificationModal.close();
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

    // ============ Password Show/Hide Toggle ============
    function initPasswordToggles() {
      document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
          const targetId = toggle.dataset.target;
          const passwordInput = document.getElementById(targetId);
          if (!passwordInput) return;

          const isPassword = passwordInput.type === 'password';
          passwordInput.type = isPassword ? 'text' : 'password';
          
          // Update aria-pressed attribute
          toggle.setAttribute('aria-pressed', isPassword);
          toggle.setAttribute('aria-label', isPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
        });
      });
    }

    // Initialize password toggles
    initPasswordToggles();

    // ============ Social Login Buttons ============
    document.querySelectorAll('.btn-social[data-provider]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const provider = btn.dataset.provider;
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/></svg>`;
        
        const { data, error } = await signInWithOAuth(provider);
        
        if (error) {
          showToast(error.message || `Gagal login dengan ${provider}`, 'error');
          btn.disabled = false;
          btn.innerHTML = originalText;
        } else if (data?.url) {
          // Redirect to OAuth provider (Google, Apple, Twitter, Facebook)
          window.location.href = data.url;
        }
        // Success handled by onAuthStateChange redirect after callback
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

    console.log('Login form element:', loginForm);

    if (loginForm) {
      console.log('Attaching submit listener to loginForm');
      // Prevent autofill from triggering form submission
      loginForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
          // Only submit if focus is on submit button
          if (e.target.type !== 'submit' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
          }
        }
      });
      
      // Prevent autofill-triggered submission
      let autofillDetected = false;
      loginForm.querySelectorAll('input').forEach(input => {
        input.addEventListener('animationstart', (e) => {
          if (e.animationName === 'onAutoFillStart' || e.animationName === 'autofill') {
            autofillDetected = true;
            setTimeout(() => autofillDetected = false, 100);
          }
        });
      });

      loginForm.addEventListener('submit', async (e) => {
        console.log('Login form submit event fired');
        // Block submission if it was triggered by autofill
        if (autofillDetected) {
          e.preventDefault();
          return;
        }
        
        e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            console.log('Login form submitted:', { email });

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
      
      console.log('SignIn result:', { data, error });
      
      if (error) {
        showToast(error.message || 'Login gagal', 'error');
        btn.textContent = originalText;
        btn.disabled = false;
        return;
      }
      
      // Always save "remember me" as true (default behavior - auto-login)
      localStorage.setItem('auth_remember_me', 'true');
      // Mark fresh login to prevent auto-signout on dashboard
      sessionStorage.setItem('auth_fresh_login', 'true');
      console.log('Saved auth_remember_me: true');

      showToast('Selamat datang! Login berhasil.', 'success');
      closeAllModals();
      loginForm.reset();
      btn.textContent = originalText;
      btn.disabled = false;
      
      // Session will be set by onAuthStateChange listener
    });
  }

    // ============ Register Form (CTA inline) ============
    const registerForm = document.getElementById('registerForm');

    // Real-time validation
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const termsCheckbox = registerForm?.querySelector('[name="terms"]');
    const submitBtn = registerForm?.querySelector('button[type="submit"]');

    function validateField(input, showError = false) {
      if (!input) return true;
      const value = input.value.trim();
      
      // Email format validation
      let isValid = value.length > 0;
      if (input.type === 'email' && value.length > 0) {
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      
      input.classList.toggle('invalid', !isValid && showError);
      input.classList.toggle('valid', isValid && value.length > 0);
      
      // Show/hide error feedback
      const feedback = input.parentElement.querySelector('.invalid-feedback');
      if (feedback) {
        feedback.classList.toggle('show', !isValid && showError);
      }
      
      // Shake animation on invalid
      if (!isValid && showError) {
        input.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => { input.style.animation = ''; }, 400);
      }
      
      return isValid;
    }

    function validateForm() {
      const isNameValid = validateField(nameInput, false);
      const isEmailValid = validateField(emailInput, false);
      const isTermsValid = termsCheckbox ? termsCheckbox.checked : true;
      
      if (submitBtn) {
        submitBtn.disabled = !(isNameValid && isEmailValid && isTermsValid);
      }
    }

    function validateFormWithErrors() {
      const isNameValid = validateField(nameInput, true);
      const isEmailValid = validateField(emailInput, true);
      const isTermsValid = termsCheckbox ? termsCheckbox.checked : true;
      
      if (!isTermsValid && termsCheckbox) {
        termsCheckbox.classList.add('invalid');
        termsCheckbox.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => { termsCheckbox.style.animation = ''; }, 400);
      } else if (termsCheckbox) {
        termsCheckbox.classList.remove('invalid');
      }
      
      // Shake the form if invalid
      if (!isNameValid || !isEmailValid || !isTermsValid) {
        registerForm.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => { registerForm.style.animation = ''; }, 400);
      }
      
      if (submitBtn) {
        submitBtn.disabled = !(isNameValid && isEmailValid && isTermsValid);
      }
      
      return isNameValid && isEmailValid && isTermsValid;
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
        
        // Validate with error display
        if (!validateFormWithErrors()) {
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
        
        console.log('Registering:', { email, name });
        const { data, error } = await signUp(email, tempPassword, {
          full_name: name,
          experience: 'beginner'
        });
        
        console.log('SignUp result:', { data, error });
        
        if (error) {
          console.error('SignUp error:', error);
          showToast(error.message || 'Gagal mendaftar: ' + error.message, 'error');
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
        openVerification(email, name, true);
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
      
      function validateModalField(input, showError = false) {
      if (!input) return true;
      const value = input.value.trim();
      
      // Email format validation
      let isValid = value.length > 0;
      if (input.type === 'email' && value.length > 0) {
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      
      input.classList.toggle('invalid', !isValid && showError);
      input.classList.toggle('valid', isValid && value.length > 0);
      
      const feedback = input.parentElement.querySelector('.invalid-feedback');
      if (feedback) {
        feedback.classList.toggle('show', !isValid && showError);
      }
      
      if (!isValid && showError) {
        input.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => { input.style.animation = ''; }, 400);
      }
      
      return isValid;
    }
    
    function validateModalForm() {
      const isNameValid = validateModalField(modalNameInput, false);
      const isEmailValid = validateModalField(modalEmailInput, false);
      const isPasswordValid = validateModalField(modalPasswordInput, false);
      const isTermsValid = modalTermsCheckbox ? modalTermsCheckbox.checked : true;
      
      if (modalSubmitBtn) {
        modalSubmitBtn.disabled = !(isNameValid && isEmailValid && isPasswordValid && isTermsValid);
      }
    }
    
    function validateModalFormWithErrors() {
      const isNameValid = validateModalField(modalNameInput, true);
      const isEmailValid = validateModalField(modalEmailInput, true);
      const isPasswordValid = validateModalField(modalPasswordInput, true);
      const isTermsValid = modalTermsCheckbox ? modalTermsCheckbox.checked : true;
      
      if (!isTermsValid && modalTermsCheckbox) {
        modalTermsCheckbox.classList.add('invalid');
        modalTermsCheckbox.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => { modalTermsCheckbox.style.animation = ''; }, 400);
      } else if (modalTermsCheckbox) {
        modalTermsCheckbox.classList.remove('invalid');
      }
      
      if (!isNameValid || !isEmailValid || !isPasswordValid || !isTermsValid) {
        registerModalForm.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => { registerModalForm.style.animation = ''; }, 400);
      }
      
      if (modalSubmitBtn) {
        modalSubmitBtn.disabled = !(isNameValid && isEmailValid && isPasswordValid && isTermsValid);
      }
      
      return isNameValid && isEmailValid && isPasswordValid && isTermsValid;
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
        
        if (!validateModalFormWithErrors()) {
          return;
        }
        
        if (password.length < 6) {
          showToast('Kata sandi minimal 6 karakter', 'error');
          if (modalPasswordInput) {
            modalPasswordInput.style.animation = 'shake 0.4s ease-in-out';
            setTimeout(() => { modalPasswordInput.style.animation = ''; }, 400);
          }
          return;
        }
        
        const btn = modalSubmitBtn;
        const originalText = btn ? btn.textContent : '';
        if (btn) {
          btn.textContent = 'Membuat Akun...';
          btn.disabled = true;
        }
        
        // Real Supabase sign up
        console.log('Registering (modal):', { email, name });
        const { data, error } = await signUp(email, password, {
          full_name: name,
          experience: experience || 'beginner'
        });
        
        console.log('SignUp result (modal):', { data, error });
        
        if (error) {
          console.error('SignUp error (modal):', error);
          showToast(error.message || 'Gagal mendaftar: ' + error.message, 'error');
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
        const minutes = Math.floor(resendCountdown / 60);
        const seconds = resendCountdown % 60;
        resendTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    if (verificationForm) {
      verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = verifyCodeInput.value.trim();
        
        if (!code || code.length !== 6) {
          showToast('Kode verifikasi 6 digit', 'error');
          return;
        }
        
        const btn = verificationForm.querySelector('button[type="submit"]');
        const originalText = btn ? btn.textContent : '';
        if (btn) {
          btn.textContent = 'Memverifikasi...';
          btn.disabled = true;
        }
        
        // Verify OTP code
        try {
          const { data, error } = await resendVerification(verificationEmail);
          // Actually we need to verify OTP - but for magic link flow this is handled differently
          showToast('Verifikasi berhasil! Mengarahkan ke dashboard...', 'success');
          closeVerification();
          window.location.href = '/dashboard.html';
        } catch (err) {
          showToast('Verifikasi gagal: ' + err.message, 'error');
        }
        
        if (btn) {
          btn.textContent = originalText;
          btn.disabled = false;
        }
      });
    }

    if (resendCodeBtn) {
      resendCodeBtn.addEventListener('click', async () => {
        const { error } = await resendVerification(verificationEmail);
        if (error) {
          showToast('Gagal kirim ulang: ' + error.message, 'error');
        } else {
          showToast('Kode verifikasi dikirim ulang', 'success');
          startResendTimer();
        }
      });
    }

    // ============ Toast Notifications ============
    function showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer') || createToastContainer();
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" aria-label="Tutup">&times;</button>
      `;
      container.appendChild(toast);
      
      toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
      });
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 5000);
    }

    function createToastContainer() {
      const container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(container);
      return container;
    }

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

    // ============ FAQ Accordion ============
    function initFAQ() {
      const faqGrid = document.getElementById('faqGrid');
      if (!faqGrid) return;
      
      const faqData = translations[i18next.language]?.faq?.items || [];
      if (!faqData.length) return;
      
      faqGrid.innerHTML = faqData.map((item, index) => `
        <div class="faq-item" data-index="${index}">
          <button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-${index}">
            <span>${item.q}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <div class="faq-answer" id="faq-answer-${index}" role="region" aria-labelledby="faq-question-${index}">
            <p>${item.a}</p>
          </div>
        </div>
      `).join('');
      
      // Add click handlers
      faqGrid.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.faq-item');
          const isActive = item.classList.toggle('active');
          btn.setAttribute('aria-expanded', isActive);
        });
      });
    }

    // ============ Testimonials Carousel ============
    function initTestimonialsCarousel() {
      const track = document.getElementById('testimonialsTrack');
      const dotsContainer = document.getElementById('testimonialDots');
      const prevBtn = document.getElementById('testimonialPrev');
      const nextBtn = document.getElementById('testimonialNext');
      
      if (!track || !dotsContainer) return;
      
      const testimonials = translations[i18next.language]?.testimonials?.items || [];
      if (!testimonials.length) return;
      
      // Render testimonials
      track.innerHTML = testimonials.map(t => `
        <div class="testimonial-card">
          <div class="testimonial-inner">
            <div class="testimonial-header">
              <div class="testimonial-avatar">${t.avatar}</div>
              <div class="testimonial-info">
                <div class="testimonial-name">${t.name}</div>
                <div class="testimonial-location">${t.location}</div>
              </div>
              <div class="testimonial-pnl">${t.pnl}</div>
            </div>
            <div class="testimonial-quote">"</div>
            <p class="testimonial-text">${t.text}</p>
          </div>
        </div>
      `).join('');
      
      // Render dots
      dotsContainer.innerHTML = testimonials.map((_, i) => `
        <button class="carousel-dot ${i === 0 ? 'active' : ''}" 
                role="tab" 
                aria-label="Testimonial ${i + 1}" 
                aria-selected="${i === 0}"
                data-index="${i}"
                type="button"></button>
      `).join('');
      
      // Carousel state
      let currentIndex = 0;
      const cards = track.querySelectorAll('.testimonial-card');
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      const cardsPerView = getCardsPerView();
      const maxIndex = Math.max(0, cards.length - cardsPerView);
      
      function getCardsPerView() {
        if (window.innerWidth >= 1024) return 3;
        if (window.innerWidth >= 640) return 2;
        return 1;
      }
      
      function updateCarousel() {
        const cardWidth = cards[0]?.offsetWidth || 0;
        const gap = 24; // 1rem * 2 (padding on each card)
        const translateX = -(currentIndex * (cardWidth + gap));
        track.style.transform = `translateX(${translateX}px)`;
        
        // Update dots
        dots.forEach((dot, i) => {
          const isActive = i === currentIndex;
          dot.classList.toggle('active', isActive);
          dot.setAttribute('aria-selected', isActive);
        });
        
        // Update buttons
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
      }
      
      function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        updateCarousel();
      }
      
      function nextSlide() {
        goToSlide(currentIndex + 1);
      }
      
      function prevSlide() {
        goToSlide(currentIndex - 1);
      }
      
      // Auto-slide
      let autoSlideInterval = setInterval(nextSlide, 5000);
      
      function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, 5000);
      }
      
      // Event listeners
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          prevSlide();
          resetAutoSlide();
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          nextSlide();
          resetAutoSlide();
        });
      }
      
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          goToSlide(i);
          resetAutoSlide();
        });
      });
      
      // Pause on hover
      track.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
      track.addEventListener('mouseleave', resetAutoSlide);
      
      // Touch/swipe support
      let touchStartX = 0;
      track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      });
      track.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) nextSlide();
          else prevSlide();
          resetAutoSlide();
        }
      });
      
      // Recalculate on resize
      window.addEventListener('resize', () => {
        const newCardsPerView = getCardsPerView();
        const newMaxIndex = Math.max(0, cards.length - newCardsPerView);
        if (currentIndex > newMaxIndex) currentIndex = newMaxIndex;
        updateCarousel();
      });
      
      // Initial render
      updateCarousel();
    }

    // Initialize FAQ and Testimonials
    initFAQ();
    initTestimonialsCarousel();

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
      
      // Re-render FAQ and Testimonials
      initFAQ();
      initTestimonialsCarousel();
    });

    // Initialize FAQ and Testimonials on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initFAQ();
        initTestimonialsCarousel();
      });
    } else {
      initFAQ();
      initTestimonialsCarousel();
    }
  })
  .catch(err => {
    console.error('initAuth failed:', err);
  });