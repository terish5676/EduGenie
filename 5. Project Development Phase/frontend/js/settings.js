/**
 * EduGenie — Settings Page JavaScript
 */
import api from './api.js';
import { showToast, initTheme, requireAuth, applyTheme, getStoredUser, storeUser, getInitials, initSidebar, initNotifications } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initTheme();
  initSidebar();
  initNotifications();
  initSettingsNav();
  await loadSettings();
  initForms();
});

async function loadSettings() {
  try {
    const data = await api.getSettings();
    const { profile, settings } = data;
    // Profile fields
    const nameInput = document.getElementById('profile-name-input');
    if (nameInput) nameInput.setAttribute('value', profile.name);
    const emailInput = document.getElementById('profile-email');
    if (emailInput) emailInput.setAttribute('value', profile.email);
    const nameEl = document.getElementById('display-name');
    if (nameEl) nameEl.textContent = profile.name;
    const planEl = document.getElementById('display-plan');
    if (planEl) planEl.textContent = profile.plan;
    
    const initialsEl = document.getElementById('display-initials-text');
    if (initialsEl) initialsEl.textContent = getInitials(profile.name);

    const savedAvatar = localStorage.getItem('edugenie_user_avatar');
    if (savedAvatar) {
      const avatarContainer = document.getElementById('display-initials');
      if (avatarContainer) {
        avatarContainer.style.backgroundImage = `url(${savedAvatar})`;
        if (initialsEl) initialsEl.style.display = 'none';
      }
    }

    // Settings
    if (settings.theme) {
      document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === settings.theme);
      });
    }
    const goalInput = document.getElementById('weekly-goal-input');
    if (goalInput && settings.weekly_goal) goalInput.value = settings.weekly_goal;

    const notifToggle = document.getElementById('notif-toggle');
    if (notifToggle) notifToggle.checked = settings.notifications !== false;
  } catch (err) {
    showToast(`Failed to load settings: ${err.message}`, 'error');
  }
}

function initForms() {
  // Profile picture upload
  const avatarContainer = document.getElementById('display-initials');
  const fileInput = document.getElementById('profile-pic-upload');
  
  if (avatarContainer && fileInput) {
    avatarContainer.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Str = e.target.result;
          avatarContainer.style.backgroundImage = `url(${base64Str})`;
          const initialsEl = document.getElementById('display-initials-text');
          if (initialsEl) initialsEl.style.display = 'none';
          localStorage.setItem('edugenie_user_avatar', base64Str);
          showToast('Profile picture updated!', 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Theme buttons
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const theme = btn.dataset.theme;
      document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyTheme(theme);
      try { await api.updateSettings({ theme }); showToast('Theme updated', 'success', 2000); }
      catch {}
    });
  });

  // Save profile
  document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('profile-name-input').value.trim();
    if (!name) { showToast('Name cannot be empty', 'warning'); return; }
    try {
      await api.updateSettings({ display_name: name });
      showToast('Profile updated', 'success');
      document.getElementById('display-name').textContent = name;
      const initialsEl = document.getElementById('display-initials-text');
      if (initialsEl) initialsEl.textContent = getInitials(name);
      
      const user = getStoredUser();
      if (user) {
        user.name = name;
        storeUser(user);
      }
    } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
  });

  // Change password
  document.getElementById('change-password-btn')?.addEventListener('click', async () => {
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-new-password').value;
    if (!current || !newPass) { showToast('Fill in all password fields', 'warning'); return; }
    if (newPass !== confirm) { showToast('Passwords do not match', 'error'); return; }
    if (newPass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    try {
      await api.changePassword(current, newPass);
      showToast('Password changed', 'success');
      ['current-password', 'new-password', 'confirm-new-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
  });

  // Weekly goal
  document.getElementById('save-goal-btn')?.addEventListener('click', async () => {
    const goal = parseInt(document.getElementById('weekly-goal-input').value);
    if (!goal || goal < 1) { showToast('Enter a valid goal', 'warning'); return; }
    try {
      await api.updateSettings({ weekly_goal: goal });
      showToast('Weekly goal updated', 'success', 2000);
    } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
  });

  // Notifications toggle
  document.getElementById('notif-toggle')?.addEventListener('change', async (e) => {
    try {
      await api.updateSettings({ notifications: e.target.checked });
    } catch {}
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => api.logout());
  document.getElementById('sidebar-logout')?.addEventListener('click', () => api.logout());


}

function initSettingsNav() {
  document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${section}`)?.classList.add('active');
    });
  });
}

