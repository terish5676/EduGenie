/**
 * EduGenie — Shared Utilities
 * Toast, theme, auth guard, markdown, scroll reveal
 */

// ─── Toast Notification ───────────────────────────────────
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '<i data-lucide="check-circle-2" style="width:18px;"></i>', error: '<i data-lucide="alert-circle" style="width:18px;"></i>', warning: '<i data-lucide="alert-triangle" style="width:18px;"></i>', info: '<i data-lucide="info" style="width:18px;"></i>' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ─── Theme Management ─────────────────────────────────────
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('edugenie_theme', theme);
}

export function initTheme() {
  const saved = localStorage.getItem('edugenie_theme') || 'light';
  applyTheme(saved);
  return saved;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}

// ─── Auth Guard ───────────────────────────────────────────
export function requireAuth() {
  const token = localStorage.getItem('edugenie_token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  return token;
}

export function redirectIfAuth() {
  const token = localStorage.getItem('edugenie_token');
  if (token) {
    window.location.href = '/dashboard';
    return true;
  }
  return false;
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('edugenie_user')) || null;
  } catch { return null; }
}

export function storeUser(user) {
  localStorage.setItem('edugenie_user', JSON.stringify(user));
}

// ─── Get User Initials ────────────────────────────────────
export function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Time of Day ──────────────────────────────────────────
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Format Date ─────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

// ─── Scroll Reveal ────────────────────────────────────────
export function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── Simple Markdown Renderer ─────────────────────────────
export function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bullet lists
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newline
    .replace(/\n/g, '<br>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/gs, m => `<ul>${m}</ul>`);
  html = `<p>${html}</p>`;
  return html;
}

// ─── Copy to Clipboard ────────────────────────────────────
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success', 2000);
  } catch {
    showToast('Copy failed', 'error');
  }
}

// ─── Debounce ─────────────────────────────────────────────
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Counter Animation ────────────────────────────────────
export function animateCounter(el, target, duration = 1500) {
  const start = parseInt(el.textContent) || 0;
  const range = target - start;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    el.textContent = Math.round(start + range * ease).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── Tool Color Map ───────────────────────────────────────
export const TOOL_COLORS = {
  qa:        { bg: '#FFFFFF', color: '#5B8DFF', icon: 'message-square' },
  explain:   { bg: '#FFFFFF', color: '#5B8DFF', icon: 'book-open' },
  quiz:      { bg: '#FFFFFF', color: '#5B8DFF', icon: 'check-square' },
  summarize: { bg: '#FFFFFF', color: '#5B8DFF', icon: 'align-left' },
  roadmap:   { bg: '#FFFFFF', color: '#5B8DFF', icon: 'map' },
};

// ─── Shared Sidebar Logic ─────────────────────────────────
export function initSidebar() {
  // Mobile sidebar toggle
  const menuBtn = document.querySelector('.dash-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  // Active nav item
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('href') === currentPath);
  });
  
  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('edugenie_token');
    window.location.href = '/login';
  });
}

// ─── Global Notifications ─────────────────────────────────
export let notifications = JSON.parse(localStorage.getItem('edugenie_notifications') || '[]');

export function addNotification(title, body, type='info') {
  notifications.unshift({ id: Date.now(), title, body, type, read: false, time: new Date().toISOString() });
  if (notifications.length > 20) notifications = notifications.slice(0, 20);
  localStorage.setItem('edugenie_notifications', JSON.stringify(notifications));
  renderNotifications();
}

export function clearNotifications() {
  notifications = [];
  localStorage.setItem('edugenie_notifications', JSON.stringify(notifications));
  renderNotifications();
}

window.clearNotifications = clearNotifications;

export function renderNotifications() {
  const listEl = document.getElementById('notif-list');
  const badge = document.getElementById('notif-badge');
  if (!listEl) return;

  const unread = notifications.filter(n => !n.read).length;
  if (badge) badge.style.display = unread > 0 ? 'block' : 'none';

  if (notifications.length === 0) {
    listEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-sec);font-size:0.9rem;">
      <i data-lucide="bell-off" style="width:32px;height:32px;display:block;margin:0 auto 8px;"></i>No notifications yet
    </div>`;
    if(window.lucide) window.lucide.createIcons();
    return;
  }

  const iconMap = { quiz:'calendar-check', streak:'flame', tip:'lightbulb', info:'info' };
  const colorMap = { quiz:'#3B82F6', streak:'#F97316', tip:'#10B981', info:'var(--primary)' };

  listEl.innerHTML = notifications.map(n => `
    <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start;background:${n.read?'transparent':'var(--primary-soft)'};cursor:pointer;" onclick="markRead(${n.id})">
      <div style="width:34px;height:34px;border-radius:9px;background:${colorMap[n.type]||'var(--primary)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <i data-lucide="${iconMap[n.type]||'bell'}" style="width:16px;color:white;"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.88rem;font-weight:700;color:var(--text-main);margin-bottom:2px;">${escapeHtml(n.title)}</div>
        <div style="font-size:0.8rem;color:var(--text-sec);line-height:1.4;">${escapeHtml(n.body)}</div>
        <div style="font-size:0.72rem;color:var(--text-tertiary);margin-top:4px;">${timeAgo(n.time)}</div>
      </div>
    </div>
  `).join('');
  if(window.lucide) window.lucide.createIcons();
}

window.markRead = function(id) {
  const n = notifications.find(x => x.id === id);
  if (n) { 
    n.read = true; 
    localStorage.setItem('edugenie_notifications', JSON.stringify(notifications)); 
    renderNotifications(); 
  }
};

export function initNotifications() {
  const notifBtn = document.getElementById('notif-btn');
  const notifPanel = document.getElementById('notif-panel');
  if (!notifBtn || !notifPanel) return;
  
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = notifPanel.style.display === 'block';
    notifPanel.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
      setTimeout(() => {
        notifications.forEach(n => n.read = true);
        localStorage.setItem('edugenie_notifications', JSON.stringify(notifications));
        renderNotifications();
      }, 2000);
    }
  });
  
  document.addEventListener('click', (e) => {
    if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
      notifPanel.style.display = 'none';
    }
  });

  renderNotifications();
  
  if (notifications.length === 0) {
    addNotification('Welcome to EduGenie! 👋', 'Start by asking a question or generating a quiz.', 'info');
    addNotification('Study Tip 💡', 'Consistency beats intensity. Try studying for 25 minutes daily!', 'tip');
  }

  // Poll for scheduled quizzes
  setInterval(() => {
    let scheduledQuizzes = JSON.parse(localStorage.getItem('edugenie_scheduled_quizzes') || '[]');
    let changed = false;
    const now = Date.now();
    
    scheduledQuizzes.forEach(quiz => {
      if (!quiz.isReady && now >= quiz.scheduledTime) {
        quiz.isReady = true;
        changed = true;
        addNotification(
          'Scheduled Quiz Ready!', 
          `Your scheduled quiz on "${quiz.payload.prompt}" is now ready. Go to the dashboard to take it!`, 
          'quiz'
        );
      }
    });

    if (changed) {
      localStorage.setItem('edugenie_scheduled_quizzes', JSON.stringify(scheduledQuizzes));
      if (window.renderScheduledQuizzes) {
        window.renderScheduledQuizzes();
      }
    }
  }, 10000); // check every 10 seconds
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
