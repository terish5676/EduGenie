/**
 * EduGenie — Authentication JavaScript
 * Handles login, signup, forgot password forms
 */
import api from './api.js';
import { showToast, initTheme, redirectIfAuth, storeUser } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const page = document.body.dataset.page;
  if (page === 'login') initLogin();
  else if (page === 'signup') initSignup();
  else if (page === 'forgot') initForgot();
});

// ─── Login ────────────────────────────────────────────────
function initLogin() {
  redirectIfAuth();
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const togglePass = document.getElementById('toggle-password');
  const rememberMe = document.getElementById('remember-me');

  // Prefill email if remembered
  const remembered = localStorage.getItem('edugenie_remember_email');
  if (remembered) { emailInput.value = remembered; if (rememberMe) rememberMe.checked = true; }

  // Password visibility toggle
  if (togglePass) {
    togglePass.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePass.innerHTML = isPass ? '<i data-lucide="eye-off" style="width:16px;"></i>' : '<i data-lucide="eye" style="width:16px;"></i>';
      lucide.createIcons();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passInput.value;
    if (!email || !password) { showError(errorEl, 'Please fill in all fields'); return; }
    setLoading(submitBtn, true);
    try {
      const data = await api.login(email, password);
      storeUser(data.user);
      if (rememberMe?.checked) { localStorage.setItem('edugenie_remember_email', email); }
      else { localStorage.removeItem('edugenie_remember_email'); }
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      setTimeout(() => window.location.href = '/dashboard', 800);
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ─── Signup ───────────────────────────────────────────────
function initSignup() {
  redirectIfAuth();
  const form = document.getElementById('signup-form');
  const errorEl = document.getElementById('signup-error');
  const submitBtn = document.getElementById('signup-submit');
  const passInput = document.getElementById('signup-password');
  const confirmPass = document.getElementById('signup-confirm-password');
  const strengthEl = document.getElementById('password-strength-fill');
  const strengthText = document.getElementById('strength-text');
  const togglePass = document.getElementById('toggle-password');
  const toggleConfirm = document.getElementById('toggle-confirm-password');

  // Password toggle
  setupPasswordToggle(togglePass, passInput);
  setupPasswordToggle(toggleConfirm, confirmPass);

  // Password strength
  if (passInput && strengthEl) {
    passInput.addEventListener('input', () => {
      const { score, label, color } = checkPasswordStrength(passInput.value);
      strengthEl.style.width = `${score * 25}%`;
      strengthEl.style.background = color;
      if (strengthText) { strengthText.textContent = label; strengthText.style.color = color; }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = passInput.value;
    const confirm = confirmPass?.value;

    if (!name || !email || !password) { showError(errorEl, 'Please fill in all fields'); return; }
    if (password.length < 6) { showError(errorEl, 'Password must be at least 6 characters'); return; }
    if (confirm && password !== confirm) { showError(errorEl, 'Passwords do not match'); return; }

    setLoading(submitBtn, true);
    try {
      const data = await api.register(name, email, password);
      storeUser(data.user);
      showToast(`Welcome to EduGenie, ${data.user.name}! 🎉`, 'success');
      setTimeout(() => window.location.href = '/dashboard', 800);
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ─── Forgot Password ──────────────────────────────────────
function initForgot() {
  const form = document.getElementById('forgot-form');
  const errorEl = document.getElementById('forgot-error');
  const successEl = document.getElementById('forgot-success');
  const submitBtn = document.getElementById('forgot-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { showError(errorEl, 'Please enter your email'); return; }
    setLoading(submitBtn, true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      errorEl.classList.remove('show');
      successEl.textContent = 'If an account exists, a reset link was sent to your email.';
      successEl.classList.add('show');
      form.reset();
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

function setLoading(btn, loading) {
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

function setupPasswordToggle(btn, input) {
  if (!btn || !input) return;
  btn.addEventListener('click', () => {
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass ? '<i data-lucide="eye-off" style="width:16px;"></i>' : '<i data-lucide="eye" style="width:16px;"></i>';
    if(window.lucide) lucide.createIcons();
  });
}

function checkPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  return { score: Math.min(score, 4), label: labels[score] || '', color: colors[score] || '' };
}
