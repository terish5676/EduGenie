/**
 * EduGenie — Dashboard JavaScript
 * All AI tools, UI switching, response rendering
 */
import api from './api.js';
import {
  showToast, initTheme, toggleTheme, requireAuth, getStoredUser,
  getGreeting, getInitials, renderMarkdown, copyToClipboard,
  animateCounter, formatDate, timeAgo, TOOL_COLORS,
  initSidebar, initNotifications, addNotification, clearNotifications, renderNotifications
} from './main.js';

// ─── State ────────────────────────────────────────────────
let currentTool = 'explain';
let currentUser = null;
let quizState = { questions: [], current: 0, score: 0, answers: [] };
let roadmapData = null;

const TOOLS = {
  qa: {
    label: 'INTELLIGENT Q&A', placeholder: 'Ask any educational question (e.g., What is photosynthesis?)',
    maxChars: 2000, icon: 'message-square', color: '#5B8DFF',
  },
  explain: {
    label: 'CONCEPT EXPLANATION', placeholder: 'Enter the topic or concept to explain (e.g., Database Management Systems, OSI Model)',
    maxChars: 2000, icon: 'book-open', color: '#5B8DFF',
  },
  quiz: {
    label: 'GENERATIVE TESTING', placeholder: 'Enter the topic to generate a quiz (e.g., World War II, Python basics)',
    maxChars: 500, icon: 'check-square', color: '#5B8DFF',
  },
  summarize: {
    label: 'TEXT SUMMARIZER', placeholder: 'Paste your text or notes here to summarize...',
    maxChars: 20000, icon: 'align-left', color: '#5B8DFF',
  },
  roadmap: {
    label: 'ADAPTIVE ROADMAPS', placeholder: 'Enter the skill or topic (e.g., Machine Learning, Web Development)',
    maxChars: 500, icon: 'map', color: '#5B8DFF',
  },
};

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initTheme();
  await loadUser();
  initSidebar();
  initSearch();
  initNavbar();
  initTools();
  initToolSection();
  initNotifications();
  await loadStats();
  await loadDashboardData();
  initStudyTimer();
  renderScheduledQuizzes();
});

// ─── Study Timer ──────────────────────────────────────────
function initStudyTimer() {
  // Add 1 minute to study time every 60 seconds
  const updateTimer = () => {
    const today = new Date().toISOString().split('T')[0];
    const activity = JSON.parse(localStorage.getItem('edugenie_activity') || '{}');
    if(!activity[today]) activity[today] = { time: 0, quizzes: [], actions: 0 };
    activity[today].time += 1;
    localStorage.setItem('edugenie_activity', JSON.stringify(activity));
    
    // Update the study time stat card if it exists
    const studyTimeEl = document.getElementById('stat-study-time');
    if (studyTimeEl) {
      const totalToday = activity[today].time;
      const hrs = Math.floor(totalToday / 60);
      const mins = totalToday % 60;
      studyTimeEl.textContent = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    }
    
    // Refresh the learning activity widget
    renderLearningActivity();
  };
  
  // Run immediately once to populate, then every 60s
  updateTimer();
  setInterval(updateTimer, 60000);
}

// ─── User ─────────────────────────────────────────────────
async function loadUser() {
  currentUser = getStoredUser();
  try {
    const data = await api.getMe();
    currentUser = data.user;
    // Store updated user
    localStorage.setItem('edugenie_user', JSON.stringify(currentUser));
  } catch {}
  renderUserInfo();
}

function renderUserInfo() {
  if (!currentUser) return;
  const name = currentUser.name || 'Scholar';
  const initials = getInitials(name);
  const greeting = getGreeting();

  // Greeting
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = name);
  document.querySelectorAll('[data-greeting]').forEach(el => el.textContent = `${greeting}, Scholar`);
  document.querySelectorAll('[data-banner-name]').forEach(el => el.textContent = name);

  // Avatars with initials
  const savedAvatar = localStorage.getItem('edugenie_user_avatar');
  document.querySelectorAll('[data-user-initials]').forEach(el => {
    if (savedAvatar) {
      el.style.backgroundImage = `url(${savedAvatar})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
    } else {
      el.textContent = initials;
    }
  });
  // Profile info
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = currentUser.email);
  document.querySelectorAll('[data-user-plan]').forEach(el => el.textContent = currentUser.plan || 'Standard Plan');
  document.querySelectorAll('[data-profile-name]').forEach(el => el.textContent = name);
}

// ─── Stats & Dashboard Data ───────────────────────────────
async function loadStats() {
  try {
    const data = await api.getProgress();
    const p = data.progress;
    updateStatCard('streak', p.streak, 'days');
    updateStatCard('focus', p.focus_score, '%');
    updateStatCard('sessions', p.sessions_completed, '');
    updateStatCard('goal', `${p.weekly_completed} / ${p.weekly_goal}`, '');
    
    // Render weekly streak in sidebar
    renderWeeklyStreak(p);

    // Pass progress data to render learning activity chart
    renderLearningActivity(p);
  } catch (err) {
    console.warn('Stats load error:', err);
  }
}

function renderWeeklyStreak(p) {
  const container = document.getElementById('sidebar-weekly-streak');
  if (!container) return;

  const activity = p.daily_activity || [];
  // Get last 7 days (the API returns 30 days ending with today)
  const last7 = activity.slice(-7);
  
  let html = '';
  const daysMap = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  last7.forEach((day, index) => {
    // day.date is YYYY-MM-DD
    const dateObj = new Date(day.date + 'T00:00:00'); // Prevent timezone shift
    const dayName = daysMap[dateObj.getDay()];
    const isActive = day.sessions > 0;
    const isToday = index === 6;

    if (isToday) {
      // Today
      html += `
        <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
          <div style="width:24px; height:24px; border-radius:50%; background:${isActive ? '#F97316' : 'var(--bg)'}; border:${isActive ? 'none' : '1px solid var(--border)'}; color:${isActive ? 'white' : 'var(--text-tertiary)'}; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; ${isActive ? 'box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);' : ''}">
            ${isActive ? '<i data-lucide="flame" style="width:12px;"></i>' : ''}
          </div>
          <span style="font-size:0.65rem; color:${isActive ? '#F97316' : 'var(--text-tertiary)'}; font-weight:700;">${dayName}</span>
        </div>
      `;
    } else if (isActive) {
      // Active past day
      html += `
        <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
          <div style="width:24px; height:24px; border-radius:50%; background:#F97316; color:white; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700;"><i data-lucide="check" style="width:12px;"></i></div>
          <span style="font-size:0.65rem; color:var(--text-sec); font-weight:600;">${dayName}</span>
        </div>
      `;
    } else {
      // Inactive past day
      html += `
        <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
          <div style="width:24px; height:24px; border-radius:50%; background:var(--bg); border:1px solid var(--border); display:flex; align-items:center; justify-content:center;"></div>
          <span style="font-size:0.65rem; color:var(--text-tertiary); font-weight:600;">${dayName}</span>
        </div>
      `;
    }
  });

  container.innerHTML = html;
  
  const streakText = document.getElementById('sidebar-streak-text');
  if (streakText) {
    streakText.innerHTML = `You're on a <span style="color:#F97316; font-weight:700;">${p.streak}-day</span> streak!`;
  }
  if (window.lucide) window.lucide.createIcons();
}

async function renderLearningActivity() {
  const chartEl = document.getElementById('learning-activity-chart');
  const totalTimeEl = document.getElementById('learning-total-time');
  const trendEl = document.getElementById('learning-trend');
  if (!chartEl) return;

  const localActivity = JSON.parse(localStorage.getItem('edugenie_activity') || '{}');
  let weeklyData = [];
  let totalMins = 0;
  
  const today = new Date();
  for(let i=6; i>=0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = localActivity[dateStr] || { time: 0, actions: 0 };
    weeklyData.push(dayData.actions);
    totalMins += dayData.time || 0;
  }

  // Update total time
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if(totalTimeEl) totalTimeEl.textContent = `${hrs}h ${mins}m`;
  if(trendEl) trendEl.innerHTML = `<i data-lucide="trending-up" style="width:14px;vertical-align:middle;"></i> Active today`;

  // Draw simple beautiful bars
  const maxActions = Math.max(...weeklyData, 1);
  chartEl.innerHTML = weeklyData.map((actions, i) => {
    const height = (actions / maxActions) * 100;
    const isToday = i === 6;
    return `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; height: 100%;">
        <div style="width: 100%; max-width: 20px; height: ${height}%; background: ${isToday ? 'var(--primary)' : 'rgba(91,141,255,0.3)'}; border-radius: 4px; transition: height 0.5s ease;"></div>
      </div>
    `;
  }).join('');
  
  if(window.lucide) window.lucide.createIcons();
}

async function loadDashboardData() {
  try {
    // Recent Activity
    const historyData = await api.getHistory('', '', 5);
    renderRecentActivity(historyData.history || []);
    
    // Continue Learning
    loadContinueLearning();
    
    // Sidebar elements
    initTodaysGoals();
    initUpcomingQuizzes();
    initAIRecommendations(historyData.history || []);
  } catch(err) {
    console.error('Failed to load dashboard dynamic data', err);
  }
}

function renderRecentActivity(history) {
  const listEl = document.getElementById('recent-activity-list');
  if(!listEl) return;
  listEl.innerHTML = '';
  if (history.length === 0) {
    listEl.innerHTML = '<div style="font-size:0.85rem; color:var(--text-sec); text-align:center; padding: 20px 0;">No activity yet. Use the AI tools above!</div>';
    return;
  }
  
  history.slice(0, 3).forEach(h => {
    const toolConf = TOOLS[h.tool] || { icon: 'zap', color: 'var(--primary)' };
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; max-width:80%;">
        <div style="width:32px; height:32px; border-radius:8px; background:var(--surface-alt); display:flex; align-items:center; justify-content:center; color:${toolConf.color};">
          <i data-lucide="${toolConf.icon}" style="width:16px;"></i>
        </div>
        <div style="font-size:0.95rem; font-weight:500; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${h.prompt || 'Action completed'}</div>
      </div>
      <div style="font-size:0.8rem; color:var(--text-sec);">${timeAgo(h.created_at)}</div>
    `;
    listEl.appendChild(div);
  });
  if(window.lucide) window.lucide.createIcons();
}

async function loadContinueLearning() {
  const contentEl = document.getElementById('continue-learning-content');
  if(!contentEl) return;
  try {
    const data = await api.getNotes('', '');
    const notes = data.notes || [];
    if(notes.length > 0) {
      const note = notes[0];
      contentEl.innerHTML = `
        <div style="background:var(--primary-soft); color:var(--primary); font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:8px;">Recently Edited</div>
        <div style="font-weight:700; color:var(--text-main); font-size:1.1rem; line-height:1.3; margin-bottom:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${note.title}</div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:0.8rem; color:var(--text-sec); display:flex; align-items:center; gap:4px;"><i data-lucide="clock" style="width:14px;"></i> ${timeAgo(note.updated_at)}</div>
          <button onclick="window.location.href='/notes'" style="background:none; border:none; color:var(--primary); font-weight:600; font-size:0.9rem; cursor:pointer;">Continue &rarr;</button>
        </div>
      `;
    } else {
      contentEl.innerHTML = `<div style="font-size:0.85rem; color:var(--text-sec);">No notes found. Start learning to see suggestions here!</div>`;
    }
    if(window.lucide) window.lucide.createIcons();
  } catch(err) {
    contentEl.innerHTML = '';
  }
}

function initTodaysGoals() {
  const listEl = document.getElementById('todays-goals-list');
  const editBtn = document.getElementById('edit-goals-btn');
  let isEditingGoals = false;

  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isEditingGoals = !isEditingGoals;
      editBtn.textContent = isEditingGoals ? 'Done' : 'Edit';
      renderGoals();
    });
  }
  const inputEl = document.getElementById('new-goal-input');
  const addBtn = document.getElementById('add-goal-btn');
  const textEl = document.getElementById('goals-progress-text');
  const percentEl = document.getElementById('goals-progress-percent');
  const barEl = document.getElementById('goals-progress-bar');
  
  if(!listEl) return;

  const defaultGoals = [
    { id: 1, text: 'Review OSI Model', done: false },
    { id: 2, text: 'Generate DB Quiz', done: false },
    { id: 3, text: 'Summarize Chapter 4', done: false }
  ];
  let goals = JSON.parse(localStorage.getItem('edugenie_goals') || JSON.stringify(defaultGoals));

  const renderGoals = () => {
    listEl.innerHTML = '';
    let completed = 0;
    goals.forEach(g => {
      if(g.done) completed++;
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '12px';
      div.style.marginBottom = '12px';
      
      let rightIcon = g.done ? '<i data-lucide="check-circle-2" style="width:16px; color:#10B981;"></i>' : '<div style="width:16px; height:16px; border:2px solid var(--border); border-radius:50%;"></div>';
      let content = `<span style="font-size:0.95rem; color:${g.done ? 'var(--text-sec)' : 'var(--text-main)'}; text-decoration:${g.done ? 'line-through' : 'none'}; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${g.text}</span>`;
      
      if (isEditingGoals) {
        rightIcon = `<button data-delete-id="${g.id}" style="background:none; border:none; color:#EF4444; cursor:pointer; padding:0; display:flex; align-items:center;"><i data-lucide="trash-2" style="width:16px;"></i></button>`;
        content = `<input type="text" data-edit-id="${g.id}" value="${g.text.replace(/"/g, '&quot;')}" style="flex:1; padding: 4px 8px; font-size: 0.95rem; border: 1px solid var(--primary-soft); border-radius: var(--radius-sm); background: var(--bg); color: var(--text-main); outline: none;">`;
      }
      div.innerHTML = `
        <input type="checkbox" ${g.done ? 'checked' : ''} data-id="${g.id}" style="width:18px;height:18px;accent-color:var(--primary); cursor:pointer; ${isEditingGoals ? 'display:none;' : ''}">
        ${content}
        ${rightIcon}
      `;
      listEl.appendChild(div);
    });
    
    listEl.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = parseInt(e.target.dataset.id);
        const goal = goals.find(x => x.id === id);
        if(goal) {
          goal.done = e.target.checked;
          localStorage.setItem('edugenie_goals', JSON.stringify(goals));
          renderGoals();
        }
      });
    });

    listEl.querySelectorAll('button[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.deleteId);
        goals = goals.filter(x => x.id !== id);
        localStorage.setItem('edugenie_goals', JSON.stringify(goals));
        renderGoals();
      });
    });

    listEl.querySelectorAll('input[data-edit-id]').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = parseInt(e.target.dataset.editId);
        const goal = goals.find(x => x.id === id);
        if (goal) {
          goal.text = e.target.value;
          localStorage.setItem('edugenie_goals', JSON.stringify(goals));
        }
      });
    });

    const total = Math.max(goals.length, 1);
    const pct = Math.round((completed / total) * 100);
    if(textEl) textEl.textContent = `${completed} / ${goals.length} Completed`;
    if(percentEl) percentEl.textContent = `${pct}%`;
    if(barEl) barEl.style.width = `${pct}%`;
    if(window.lucide) window.lucide.createIcons();
  };

  if(addBtn && inputEl) {
    addBtn.addEventListener('click', () => {
      const text = inputEl.value.trim();
      if(text) {
        goals.push({ id: Date.now(), text, done: false });
        localStorage.setItem('edugenie_goals', JSON.stringify(goals));
        inputEl.value = '';
        renderGoals();
      }
    });
    inputEl.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') addBtn.click();
    });
  }
  renderGoals();
}

function initUpcomingQuizzes() {
  const listEl = document.getElementById('upcoming-quizzes-list');
  const addBtn = document.getElementById('schedule-quiz-btn');
  const modal = document.getElementById('schedule-modal');
  const saveBtn = document.getElementById('save-schedule-btn');
  const topicInput = document.getElementById('schedule-topic-input');
  const timeInput = document.getElementById('schedule-time-input');

  if(!listEl) return;
  
  let quizzes = JSON.parse(localStorage.getItem('edugenie_quizzes') || '[]');
  
  const renderQuizzes = () => {
    listEl.innerHTML = '';
    // Clean up past quizzes older than 1 day
    quizzes = quizzes.filter(q => Date.now() - q.timestamp < 86400000);
    localStorage.setItem('edugenie_quizzes', JSON.stringify(quizzes));

    if(quizzes.length === 0) {
      listEl.innerHTML = '<div style="font-size:0.85rem; color:var(--text-sec); margin-bottom:8px;">No scheduled quizzes.</div>';
    }
    quizzes.forEach(q => {
      const timeStr = new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const div = document.createElement('div');
      div.style.background = 'var(--surface)';
      div.style.border = '1px solid var(--border)';
      div.style.padding = '12px';
      div.style.borderRadius = 'var(--radius-lg)';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.style.marginBottom = '8px';
      div.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; border-radius:8px; background:var(--surface-alt); display:flex; align-items:center; justify-content:center; color:var(--text-sec);"><i data-lucide="calendar" style="width:16px;"></i></div>
          <div>
            <div style="font-size:0.9rem; font-weight:600; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;">${escapeHtml(q.title)}</div>
            <div style="font-size:0.75rem; color:var(--text-sec); display:flex; align-items:center; gap:4px;"><i data-lucide="clock" style="width:10px;"></i> ${timeStr}</div>
          </div>
        </div>
        <button class="btn btn-secondary quick-action-btn" data-tool="quiz" data-topic="${escapeHtml(q.title)}" style="padding:4px 12px; font-size:0.8rem;">Start</button>
      `;
      listEl.appendChild(div);
    });
    
    listEl.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        selectTool('quiz');
        document.getElementById('tool-textarea').value = btn.dataset.topic;
      });
    });
    if(window.lucide) window.lucide.createIcons();
  };
  
  if(addBtn && modal && saveBtn) {
    addBtn.addEventListener('click', () => {
      topicInput.value = '';
      timeInput.value = '';
      modal.style.display = 'flex';
    });

    saveBtn.addEventListener('click', () => {
      const title = topicInput.value.trim();
      const timeVal = timeInput.value;
      if(title && timeVal) {
        const [hours, minutes] = timeVal.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        quizzes.push({ id: Date.now(), title, timestamp: date.getTime(), notified: false });
        quizzes.sort((a,b) => a.timestamp - b.timestamp);
        localStorage.setItem('edugenie_quizzes', JSON.stringify(quizzes));
        renderQuizzes();
        modal.style.display = 'none';
        showToast('Quiz scheduled!', 'success');
      } else {
        showToast('Please enter both topic and time.', 'warning');
      }
    });
  }

  // Notification checker
  setInterval(() => {
    let changed = false;
    quizzes.forEach(q => {
      if (!q.notified && Date.now() >= q.timestamp) {
        q.notified = true;
        changed = true;
        addNotification(
          `Quiz Time: ${q.title}`,
          `Your scheduled quiz is ready! Click to start.`,
          'quiz'
        );
      }
    });
    if (changed) {
      localStorage.setItem('edugenie_quizzes', JSON.stringify(quizzes));
    }
  }, 10000);

  renderQuizzes();
}

function initAIRecommendations(history) {
  const contentEl = document.getElementById('ai-recs-content');
  if(!contentEl) return;
  const usesQuiz = history.some(h => h.tool === 'quiz');
  if(usesQuiz) {
    contentEl.innerHTML = `
      <div style="font-size:0.95rem; color:var(--text-main); margin-bottom:12px;">You've been testing your knowledge! Try creating a Roadmap to structure your learning.</div>
      <a href="#" class="quick-action-btn" data-tool="roadmap" style="font-size:0.9rem; color:var(--primary); font-weight:600; text-decoration:none;">Generate Roadmap &rarr;</a>
    `;
  } else {
    contentEl.innerHTML = `
      <div style="font-size:0.95rem; color:var(--text-main); margin-bottom:12px;">Strengthen your skills with practice quizzes. AI can generate them instantly.</div>
      <a href="#" class="quick-action-btn" data-tool="quiz" style="font-size:0.9rem; color:var(--primary); font-weight:600; text-decoration:none;">Start Quiz &rarr;</a>
    `;
  }
  const btn = contentEl.querySelector('.quick-action-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      selectTool(e.target.dataset.tool);
    });
  }
}

function updateStatCard(id, value, suffix) {
  const el = document.getElementById(`stat-${id}`);
  if (!el) return;
  el.textContent = (typeof value === 'number' ? value.toLocaleString() : value) + suffix;
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

// ─── Sidebar ──────────────────────────────────────────────
function initSearch() {
  const searchInput = document.getElementById('dash-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if (val) {
          if (val.endsWith('?')) {
            document.querySelector('[data-tool="qa"]')?.click();
            setTimeout(() => { document.getElementById('tool-textarea').value = val; document.getElementById('generate-btn').click(); }, 100);
          } else {
            document.querySelector('[data-tool="explain"]')?.click();
            setTimeout(() => { document.getElementById('tool-textarea').value = val; document.getElementById('generate-btn').click(); }, 100);
          }
        }
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      searchInput?.focus();
    }
  });
}

// ─── Top Navbar ───────────────────────────────────────────
function initNavbar() {
  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const updateIcon = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      themeBtn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
      if(window.lucide) lucide.createIcons();
    };
    updateIcon();
    themeBtn.addEventListener('click', () => { toggleTheme(); updateIcon(); });
  }

  // Profile dropdown
  const avatarBtn = document.getElementById('user-avatar-btn');
  const dropdown = document.getElementById('profile-dropdown');
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => api.logout());
}



// ─── Tool Cards ───────────────────────────────────────────
function initTools() {
  document.querySelectorAll('.ai-tool-card, .quick-action-btn').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const tool = card.dataset.tool;
      if (tool) selectTool(tool);
    });
  });
}

function selectTool(tool) {
  currentTool = tool;
  
  // Track learning activity actions (but not time, which is handled by timer)
  const today = new Date().toISOString().split('T')[0];
  const activity = JSON.parse(localStorage.getItem('edugenie_activity') || '{}');
  if(!activity[today]) activity[today] = { time: 0, quizzes: [], actions: 0 };
  activity[today].actions += 1;
  localStorage.setItem('edugenie_activity', JSON.stringify(activity));

  // Update active card
  document.querySelectorAll('.ai-tool-card').forEach(c => {
    c.classList.toggle('active', c.dataset.tool === tool);
  });
  // Update tool section
  const config = TOOLS[tool];
  if (!config) return;

  const titleEl = document.getElementById('tool-title');
  const textareaEl = document.getElementById('tool-textarea');
  const sectionEl = document.getElementById('tool-section');
  const optionsEl = document.getElementById('tool-options');
  const fileZoneEl = document.getElementById('file-drop-zone');
  const responseAreaEl = document.getElementById('response-area');

  if (titleEl) {
    titleEl.innerHTML = `<i data-lucide="${config.icon}" style="color:var(--primary);width:20px;height:20px;"></i> ${config.label}`;
    if (window.lucide) window.lucide.createIcons();
  }
  if (textareaEl) {
    textareaEl.placeholder = config.placeholder;
    textareaEl.maxLength = config.maxChars;
    updateCharCount();
  }
  if (responseAreaEl) responseAreaEl.classList.remove('show');

  // Show/hide file upload for summarizer
  if (fileZoneEl) fileZoneEl.style.display = tool === 'summarize' ? 'block' : 'none';

  // Render tool-specific options
  if (optionsEl) renderToolOptions(tool, optionsEl);

  // Show/hide schedule container
  const scheduleContainer = document.getElementById('schedule-container');
  if (scheduleContainer) scheduleContainer.style.display = tool === 'quiz' ? 'flex' : 'none';

  // Scroll tool section into view
  if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderToolOptions(tool, container) {
  container.innerHTML = '';
  const options = getToolOptions(tool);
  options.forEach(({ key, label, group }) => {
    const btn = document.createElement('button');
    btn.className = 'tool-option-btn';
    btn.textContent = label;
    btn.style.padding = '6px 16px';
    btn.style.fontSize = '0.85rem';
    btn.style.fontWeight = '600';
    btn.style.borderRadius = '20px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.2s';
    
    // Default inactive style
    btn.style.background = 'var(--surface-alt)';
    btn.style.color = 'var(--text-sec)';
    
    btn.dataset.group = group;
    btn.dataset.value = key;
    
    btn.addEventListener('click', () => {
      container.querySelectorAll(`[data-group="${group}"]`).forEach(b => {
        b.classList.remove('active');
        b.style.background = 'var(--surface-alt)';
        b.style.color = 'var(--text-sec)';
      });
      btn.classList.add('active');
      btn.style.background = 'var(--primary)';
      btn.style.color = '#fff';
    });
    
    container.appendChild(btn);
    
    if (btn.dataset.value === getDefaultOption(tool, group)) {
      btn.classList.add('active');
      btn.style.background = 'var(--primary)';
      btn.style.color = '#fff';
    }
  });
}

function getToolOptions(tool) {
  switch (tool) {
    case 'explain': return [
      { key: 'beginner', label: 'Beginner', group: 'level' },
      { key: 'intermediate', label: 'Intermediate', group: 'level' },
      { key: 'advanced', label: 'Advanced', group: 'level' },
      { key: 'detailed', label: 'Detailed', group: 'style' },
      { key: 'simple', label: 'Simple', group: 'style' },
      { key: 'examples', label: 'With Examples', group: 'style' },
      { key: 'analogy', label: 'Analogy', group: 'style' },
    ];
    case 'quiz': return [
      { key: 'easy', label: 'Easy', group: 'difficulty' },
      { key: 'medium', label: 'Medium', group: 'difficulty' },
      { key: 'hard', label: 'Hard', group: 'difficulty' },
      { key: 'mcq', label: 'MCQ', group: 'type' },
      { key: 'true_false', label: 'True/False', group: 'type' },
      { key: 'fill_blank', label: 'Fill Blank', group: 'type' },
      { key: 'short_answer', label: 'Short Answer', group: 'type' },
      { key: '5', label: '5 Qs', group: 'count' },
      { key: '10', label: '10 Qs', group: 'count' },
    ];
    case 'summarize': return [
      { key: 'short', label: 'Short Summary', group: 'mode' },
      { key: 'detailed', label: 'Detailed', group: 'mode' },
      { key: 'bullets', label: 'Bullet Points', group: 'mode' },
      { key: 'takeaways', label: 'Key Takeaways', group: 'mode' },
      { key: 'terms', label: 'Key Terms', group: 'mode' },
    ];
    case 'roadmap': return [
      { key: 'beginner', label: 'Beginner', group: 'level' },
      { key: 'intermediate', label: 'Intermediate', group: 'level' },
      { key: 'advanced', label: 'Advanced', group: 'level' },
      { key: '1 month', label: '1 Month', group: 'duration' },
      { key: '3 months', label: '3 Months', group: 'duration' },
      { key: '6 months', label: '6 Months', group: 'duration' },
    ];
    default: return [];
  }
}

function getDefaultOption(tool, group) {
  const defaults = {
    explain: { level: 'intermediate', style: 'detailed' },
    quiz: { difficulty: 'medium', type: 'mcq', count: '5' },
    summarize: { mode: 'detailed' },
    roadmap: { level: 'beginner', duration: '3 months' },
  };
  return defaults[tool]?.[group];
}

function getSelectedOption(group) {
  const btn = document.querySelector(`[data-group="${group}"].active`);
  return btn?.dataset.value;
}

// ─── Tool Input Section ───────────────────────────────────
function initToolSection() {
  const textarea = document.getElementById('tool-textarea');
  const charCountEl = document.getElementById('char-count');
  const generateBtn = document.getElementById('generate-btn');
  const clearBtn = document.getElementById('clear-btn');
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('file-drop-zone');

  if (textarea) {
    textarea.addEventListener('input', updateCharCount);
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (textarea) textarea.value = '';
      updateCharCount();
      document.getElementById('response-area')?.classList.remove('show');
    });
  }
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerate);
  }
  
  const scheduleBtn = document.getElementById('schedule-btn');
  if (scheduleBtn) {
    scheduleBtn.addEventListener('click', scheduleQuiz);
  }

  // File drag and drop
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    });
    fileInput.addEventListener('change', e => {
      const f = e.target.files[0];
      if (f) handleFileSelect(f);
    });
  }

  // Copy response button
  document.getElementById('copy-response')?.addEventListener('click', () => {
    const body = document.getElementById('response-body');
    if (body) copyToClipboard(body.innerText);
  });

  // Bookmark response
  document.getElementById('bookmark-response')?.addEventListener('click', bookmarkCurrentResponse);

  // Regenerate
  document.getElementById('regenerate-btn')?.addEventListener('click', handleGenerate);

  // Select explain tool by default
  selectTool('explain');
}

function updateCharCount() {
  const textarea = document.getElementById('tool-textarea');
  const el = document.getElementById('char-count');
  if (!textarea || !el) return;
  const len = textarea.value.length;
  const max = parseInt(textarea.maxLength) || 2000;
  el.textContent = `${len}/${max} chars | ${textarea.value.split(/\s+/).filter(Boolean).length} words`;
}

// ─── Generate Handler ─────────────────────────────────────
async function handleGenerate() {
  const textarea = document.getElementById('tool-textarea');
  const generateBtn = document.getElementById('generate-btn');
  const responseArea = document.getElementById('response-area');

  const text = textarea?.value.trim();
  if (!text) { showToast('Please enter your question or topic', 'warning'); return; }

  setGenerating(true);
  try {
    let result;
    switch (currentTool) {
      case 'qa':
        result = await api.askQuestion(text);
        renderMarkdownResponse(result.result);
        break;
      case 'explain':
        result = await api.explainConcept(
          text,
          getSelectedOption('level') || 'intermediate',
          getSelectedOption('style') || 'detailed'
        );
        renderExplainResponse(result.result, getSelectedOption('level') || 'intermediate', text);
        break;
      case 'quiz':
        result = await api.generateQuiz(
          text,
          getSelectedOption('difficulty') || 'medium',
          parseInt(getSelectedOption('count')) || 5,
          getSelectedOption('type') || 'mcq'
        );
        renderQuiz(result.result);
        break;
      case 'summarize':
        result = await api.summarizeText(text, getSelectedOption('mode') || 'detailed');
        renderMarkdownResponse(result.result);
        break;
      case 'roadmap':
        result = await api.generateRoadmap(
          text,
          getSelectedOption('level') || 'beginner',
          getSelectedOption('duration') || '3 months'
        );
        renderRoadmap(result.result);
        break;
    }
    responseArea?.classList.add('show');
    responseArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    console.error(err);
  } finally {
    setGenerating(false);
  }
}

let selectedFile = null;
function handleFileSelect(file) {
  selectedFile = file;
  const label = document.getElementById('file-label');
  if (label) label.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  showToast(`File selected: ${file.name}`, 'success', 2000);
}

// ─── Render Responses ─────────────────────────────────────
function renderMarkdownResponse(text) {
  const body = document.getElementById('response-body');
  if (!body) return;
  body.innerHTML = `<div class="markdown-output" style="padding:var(--space-lg); background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-xl); box-shadow:var(--shadow-sm);">${renderMarkdown(text)}</div>`;
}

function renderExplainResponse(text, level, topic) {
  const body = document.getElementById('response-body');
  if (!body) return;

  const readingTime = Math.max(1, Math.ceil(text.split(' ').length / 200));

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) 180px; gap: var(--space-xl); align-items: start;">
      <!-- Left Column: Content -->
      <div class="explain-content" style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-xl); padding:var(--space-xl); box-shadow:var(--shadow-md);">
        <div style="margin-bottom: var(--space-2xl); border-bottom: 1px solid var(--border); padding-bottom: var(--space-xl);">
          <h1 style="font-size: 2.2rem; font-weight: 800; color: var(--text-main); margin-bottom: 16px; letter-spacing:-0.02em; line-height: 1.2;">${escapeHtml(topic)}</h1>
          <div style="display:flex; gap:16px; font-size:1rem; color:var(--text-sec); font-weight:600; flex-wrap: wrap;">
            <span style="display:flex;align-items:center;gap:6px;"><i data-lucide="bar-chart" style="width:16px;"></i> ${level.charAt(0).toUpperCase() + level.slice(1)}</span>
            <span style="display:flex;align-items:center;gap:6px;"><i data-lucide="clock" style="width:16px;"></i> ~${readingTime} min read</span>
          </div>
        </div>
        <div class="markdown-output" style="font-size: 1.05rem; line-height: 1.9; color: var(--text-main); letter-spacing: 0.01em;">
          ${renderMarkdown(text)}
        </div>
      </div>

      <!-- Right Column: Sticky Sidebar -->
      <div style="position: sticky; top: 100px; display:flex; flex-direction:column; gap:var(--space-md);">
        
        <div class="card" style="padding: var(--space-md) var(--space-lg); box-shadow:var(--shadow-sm); border-radius: var(--radius-lg);">
          <div style="font-weight:700; color:var(--text-sec); margin-bottom: 12px; font-size:0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Quick Actions</div>
          <button class="btn btn-secondary" style="width:100%; margin-bottom:8px; justify-content:flex-start; padding: 8px 12px; font-size:0.9rem;" onclick="document.querySelector('[data-tool=\\'quiz\\']').click(); document.getElementById('tool-textarea').value = decodeURIComponent('${encodeURIComponent(topic)}'); document.getElementById('generate-btn').click();">
            <i data-lucide="check-square" style="width:16px; color: var(--primary);"></i> Test Knowledge
          </button>
          <button class="btn btn-secondary" style="width:100%; margin-bottom:8px; justify-content:flex-start; padding: 8px 12px; font-size:0.9rem;" onclick="window.print()">
            <i data-lucide="download" style="width:16px; color: #10B981;"></i> Export to PDF
          </button>
          <button class="btn btn-secondary" style="width:100%; justify-content:flex-start; padding: 8px 12px; font-size:0.9rem;">
            <i data-lucide="share-2" style="width:16px; color: #F59E0B;"></i> Share Link
          </button>
        </div>

        <div class="card" style="padding: var(--space-md) var(--space-lg); background: var(--primary-soft); border-color: var(--primary-hover); box-shadow:var(--shadow-sm); border-radius: var(--radius-lg);">
          <div style="font-weight:800; color:var(--primary); margin-bottom: 6px; font-size:0.95rem; letter-spacing:-0.01em;">Next Step</div>
          <div style="font-size:0.85rem; color:var(--text-main); margin-bottom: 12px; line-height: 1.4;">Ready to master this? Generate a quick quiz to lock it in.</div>
          <button class="btn btn-primary" style="width:100%; justify-content:center; padding: 8px 12px; font-size:0.9rem;" onclick="document.querySelector('[data-tool=\\'quiz\\']').click(); document.getElementById('tool-textarea').value = decodeURIComponent('${encodeURIComponent(topic)}');"><i data-lucide="zap" style="width:16px;"></i> Setup Quiz</button>
        </div>

      </div>
    </div>
  `;
  if(window.lucide) lucide.createIcons();
}

function renderQuiz(data) {
  if (!data?.questions) { renderMarkdownResponse('Could not generate quiz. Please try again.'); return; }
  quizState = { questions: data.questions, current: 0, score: 0, answers: [] };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const body = document.getElementById('response-body');
  if (!body) return;
  const q = quizState.questions[quizState.current];
  if (!q) { renderQuizResults(); return; }

  const answered = quizState.answers[quizState.current];

  body.innerHTML = `
    <div class="quiz-container" style="max-width: 700px; margin: 0 auto; padding: var(--space-2xl); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);">
      <div class="quiz-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2xl); padding-bottom: var(--space-lg); border-bottom: 1px solid var(--border);">
        <span class="quiz-title" style="font-size: 1.1rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 8px;"><i data-lucide="book-open" style="width: 18px;"></i> ${escapeHtml(quizState.questions[0]?.topic || 'Quiz')}</span>
        <span class="quiz-meta" style="font-size: 0.9rem; font-weight: 600; color: var(--text-sec); background: var(--bg); padding: 4px 12px; border-radius: var(--radius-full);">Question ${quizState.current + 1} / ${quizState.questions.length}</span>
      </div>
      <div class="quiz-question" style="margin-bottom: var(--space-2xl);">
        <div class="question-text" style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); line-height: 1.5; margin-bottom: var(--space-xl);">${quizState.current + 1}. ${escapeHtml(q.question)}</div>
        <div class="question-options" id="quiz-options" style="display: flex; flex-direction: column; gap: 12px;">
          ${q.options ? Object.entries(q.options).map(([key, val]) => `
            <button class="option-btn ${answered ? (key === q.correct ? 'correct' : (key === answered ? 'wrong' : '')) : ''}"
                    data-key="${key}" ${answered ? 'disabled' : ''} onclick="window.selectQuizOption('${key}')"
                    style="display: flex; align-items: center; width: 100%; text-align: left; padding: 16px; border: 2px solid ${answered && key === q.correct ? '#10B981' : answered && key === answered ? '#EF4444' : 'var(--border)'}; border-radius: var(--radius-lg); background: ${answered && key === q.correct ? 'rgba(16, 185, 129, 0.1)' : answered && key === answered ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-alt)'}; color: var(--text-main); font-size: 1rem; font-weight: 500; cursor: ${answered ? 'default' : 'pointer'}; transition: all 0.2s ease;">
              <span class="option-label" style="font-weight: 700; margin-right: 12px; color: ${answered && key === q.correct ? '#10B981' : answered && key === answered ? '#EF4444' : 'var(--text-sec)'};">${key}.</span> 
              <span style="flex: 1;">${escapeHtml(val)}</span>
              ${answered && key === q.correct ? '<i data-lucide="check-circle" style="color: #10B981; width: 20px;"></i>' : ''}
              ${answered && key === answered && key !== q.correct ? '<i data-lucide="x-circle" style="color: #EF4444; width: 20px;"></i>' : ''}
            </button>
          `).join('') : `<div class="form-input">${escapeHtml(q.correct)}</div>`}
        </div>
        ${answered && q.explanation ? `<div style="margin-top: 24px; padding: 16px; background: rgba(91, 141, 255, 0.1); border-left: 4px solid var(--primary); border-radius: 0 var(--radius-md) var(--radius-md) 0; font-size: 0.95rem; color: var(--text-main); line-height: 1.5; display: flex; gap: 12px;"><i data-lucide="lightbulb" style="color: var(--primary); width: 24px; flex-shrink: 0;"></i> <div>${escapeHtml(q.explanation)}</div></div>` : ''}
      </div>
      <div class="quiz-nav" style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-xl); padding-top: var(--space-xl); border-top: 1px solid var(--border);">
        <button class="btn btn-secondary" onclick="window.prevQuizQuestion()" ${quizState.current === 0 ? 'disabled' : ''} style="display: flex; align-items: center; gap: 8px;"><i data-lucide="arrow-left" style="width: 16px;"></i> Prev</button>
        <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">Score: <span style="color: var(--primary);">${quizState.score}</span> / ${quizState.current + (answered ? 1 : 0)}</span>
        <button class="btn btn-primary" onclick="window.nextQuizQuestion()" style="display: flex; align-items: center; gap: 8px;">
          ${quizState.current === quizState.questions.length - 1 ? 'Finish Quiz <i data-lucide="flag" style="width: 16px;"></i>' : 'Next Question <i data-lucide="arrow-right" style="width: 16px;"></i>'}
        </button>
      </div>
    </div>
  `;
  if(window.lucide) window.lucide.createIcons();
}

window.selectQuizOption = function(key) {
  const q = quizState.questions[quizState.current];
  if (quizState.answers[quizState.current]) return;
  quizState.answers[quizState.current] = key;
  if (key === q.correct) quizState.score++;
  renderQuizQuestion();
};
window.nextQuizQuestion = function() {
  if (quizState.current < quizState.questions.length - 1) { quizState.current++; renderQuizQuestion(); }
  else renderQuizResults();
};
window.prevQuizQuestion = function() {
  if (quizState.current > 0) { quizState.current--; renderQuizQuestion(); }
};

function renderQuizResults() {
  const body = document.getElementById('response-body');
  const pct = Math.round((quizState.score / quizState.questions.length) * 100);
  
  // Track quiz score in local storage
  const today = new Date().toISOString().split('T')[0];
  const activity = JSON.parse(localStorage.getItem('edugenie_activity') || '{}');
  if(!activity[today]) activity[today] = { time: 0, quizzes: [], actions: 0 };
  activity[today].quizzes.push(pct);
  localStorage.setItem('edugenie_activity', JSON.stringify(activity));

  body.innerHTML = `
    <div style="text-align:center; padding: 48px 32px; max-width: 600px; margin: 0 auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);">
      <div style="margin-bottom: 24px; display: inline-flex; justify-content: center; align-items: center; width: 96px; height: 96px; border-radius: 50%; background: ${pct >= 80 ? 'rgba(16, 185, 129, 0.1)' : pct >= 60 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.1)'};">
        ${pct >= 80 ? '<i data-lucide="award" style="width: 48px; height: 48px; color: #10B981;"></i>' : pct >= 60 ? '<i data-lucide="thumbs-up" style="width: 48px; height: 48px; color: #F59E0B;"></i>' : '<i data-lucide="book-open" style="width: 48px; height: 48px; color: #64748B;"></i>'}
      </div>
      <div class="quiz-score" style="margin-bottom: 16px;">
        <div class="quiz-score-value" style="font-size: 3rem; font-weight: 800; color: var(--text-main); line-height: 1;">${pct}%</div>
        <div class="quiz-score-label" style="font-size: 1.1rem; font-weight: 600; color: var(--text-sec); margin-top: 8px;">${quizState.score} / ${quizState.questions.length} correct</div>
      </div>
      <p style="font-size: 1.1rem; color: var(--text-main); line-height: 1.6; margin-bottom: 32px; max-width: 400px; margin-left: auto; margin-right: auto;">
        ${pct >= 80 ? 'Excellent work! You have truly mastered this topic.' : pct >= 60 ? 'Good job! You have a solid grasp, but a little review could help.' : 'Keep studying! Practice makes perfect.'}
      </p>
      <button class="btn btn-primary" style="padding: 12px 32px; font-size: 1rem; border-radius: var(--radius-full); display: inline-flex; align-items: center; gap: 8px; font-weight: 700; box-shadow: var(--shadow-md);" onclick="window.retakeQuiz()">
        <i data-lucide="rotate-ccw" style="width: 18px;"></i> Retake Quiz
      </button>
    </div>
  `;
  if(window.lucide) window.lucide.createIcons();
}
window.retakeQuiz = function() {
  quizState = { ...quizState, current: 0, score: 0, answers: [] };
  renderQuizQuestion();
};

function renderRoadmap(data) {
  if (!data?.phases) { renderMarkdownResponse('Could not generate roadmap. Please try again.'); return; }
  roadmapData = data;
  const body = document.getElementById('response-body');
  body.innerHTML = `
    <div class="roadmap-container">
      <div style="margin-bottom:16px">
        <h2 style="font-size:1.2rem">${data.topic} Roadmap</h2>
        <p style="color:var(--text-secondary);font-size:0.875rem">${data.overview || ''}</p>
        <div style="display:flex;gap:12px;margin-top:8px">
          <span class="badge">📅 ${data.duration}</span>
          <span class="badge">📊 ${data.level}</span>
        </div>
      </div>
      ${data.phases.map((phase, pi) => `
        <div class="roadmap-phase">
          <div class="phase-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            <div class="phase-number">${phase.phase}</div>
            <div class="phase-title">${phase.title}</div>
            <div class="phase-duration">${phase.duration}</div>
          </div>
          <div class="phase-body">
            <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:16px">${phase.description}</p>
            ${phase.milestones.map((m, mi) => `
              <div class="milestone-item">
                <div class="milestone-checkbox" id="ms-${pi}-${mi}" onclick="window.toggleMilestone('${pi}','${mi}')"></div>
                <div class="milestone-info">
                  <div class="milestone-title">${m.title}</div>
                  <div class="milestone-desc">${m.description}</div>
                  <div class="milestone-resources">
                    ${(m.resources || []).map(r => `<span class="resource-tag">📎 ${r.title}</span>`).join('')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
      ${data.tips?.length ? `
        <div style="background:var(--primary-soft);border-radius:var(--radius-lg);padding:var(--space-lg);margin-bottom:var(--space-xl);">
          <strong style="display: flex; align-items: center; gap: 8px; color: var(--primary);"><i data-lucide="lightbulb" style="width: 18px;"></i> Tips:</strong><ul style="margin-top:8px;padding-left:16px">
            ${data.tips.map(t => `<li style="font-size:0.875rem;margin-bottom:4px">${t}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}
window.toggleMilestone = function(pi, mi) {
  const el = document.getElementById(`ms-${pi}-${mi}`);
  if (!el) return;
  el.classList.toggle('done');
  el.textContent = el.classList.contains('done') ? '✓' : '';
};

// ─── File Summarize ───────────────────────────────────────
async function handleFileSummarize() {
  if (!selectedFile) { showToast('Please select a file first', 'warning'); return; }
  const mode = getSelectedOption('mode') || 'detailed';
  setGenerating(true);
  try {
    const result = await api.summarizeFile(selectedFile, mode);
    renderMarkdownResponse(result.result);
    document.getElementById('response-area')?.classList.add('show');
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    setGenerating(false);
  }
}

// ─── Bookmark Response ────────────────────────────────────
async function bookmarkCurrentResponse() {
  const body = document.getElementById('response-body');
  const textarea = document.getElementById('tool-textarea');
  if (!body || !textarea?.value) return;
  const title = textarea.value.slice(0, 60) + '...';
  const content = body.innerText.slice(0, 500);
  try {
    await api.createBookmark(title, content, TOOL_COLORS[currentTool] ? currentTool : 'General', currentTool);
    showToast('Response bookmarked!', 'success');
  } catch (err) {
    showToast(`Bookmark failed: ${err.message}`, 'error');
  }
}

// ─── Loading State ────────────────────────────────────────
function setGenerating(loading) {
  const btn = document.getElementById('generate-btn');
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.classList.add('generating-zoom');
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;border-color:rgba(255,255,255,.4);border-top-color:#fff"></span> Generating...';
  } else {
    btn.classList.remove('generating-zoom');
    btn.innerHTML = '<i data-lucide="sparkles" style="width:18px;"></i> Generate Answer';
    if(window.lucide) window.lucide.createIcons();
  }
}

// ─── Scheduled Quizzes ────────────────────────────────────
function scheduleQuiz() {
  const timeInput = document.getElementById('schedule-time');
  const textarea = document.getElementById('tool-textarea');
  if (!timeInput || !textarea) return;

  const scheduledTime = new Date(timeInput.value).getTime();
  const now = Date.now();

  if (!timeInput.value || scheduledTime <= now) {
    showToast('Please select a valid future date and time for the quiz.', 'warning');
    return;
  }

  const text = textarea.value.trim();
  if (!text) {
    showToast('Please enter a topic for the quiz.', 'warning');
    return;
  }

  const payload = {
    prompt: text,
    difficulty: getSelectedOption('difficulty') || 'medium',
    type: getSelectedOption('type') || 'mcq',
    count: parseInt(getSelectedOption('count')) || 5
  };

  const newQuiz = {
    id: Date.now().toString(),
    scheduledTime,
    payload,
    isReady: false
  };

  let scheduledQuizzes = JSON.parse(localStorage.getItem('edugenie_scheduled_quizzes') || '[]');
  scheduledQuizzes.push(newQuiz);
  localStorage.setItem('edugenie_scheduled_quizzes', JSON.stringify(scheduledQuizzes));

  showToast('Quiz scheduled successfully!', 'success');
  timeInput.value = '';
  renderScheduledQuizzes();
}

window.takeScheduledQuiz = function(id) {
  let scheduledQuizzes = JSON.parse(localStorage.getItem('edugenie_scheduled_quizzes') || '[]');
  const quizIndex = scheduledQuizzes.findIndex(q => q.id === id);
  if (quizIndex === -1) return;

  const quiz = scheduledQuizzes[quizIndex];
  if (!quiz.isReady && Date.now() < quiz.scheduledTime) {
    showToast(`Not time yet! Quiz opens at ${new Date(quiz.scheduledTime).toLocaleString()}`, 'warning');
    return;
  }

  // Set UI to the quiz prompt and run generation
  const textarea = document.getElementById('tool-textarea');
  if (textarea) textarea.value = quiz.payload.prompt;

  // Run generation
  setGenerating(true);
  api.generate('quiz', quiz.payload)
    .then(data => {
      quizState.questions = data.result || [];
      quizState.current = 0;
      quizState.score = 0;
      quizState.answers = {};
      renderQuizQuestion();
      document.getElementById('response-area')?.classList.add('show');
      
      // Remove from scheduled list since it's attempted
      scheduledQuizzes.splice(quizIndex, 1);
      localStorage.setItem('edugenie_scheduled_quizzes', JSON.stringify(scheduledQuizzes));
      renderScheduledQuizzes();
    })
    .catch(err => showToast(`Error: ${err.message}`, 'error'))
    .finally(() => setGenerating(false));
};

function renderScheduledQuizzes() {
  const container = document.getElementById('scheduled-quizzes-container');
  const list = document.getElementById('scheduled-quizzes-list');
  if (!container || !list) return;

  const scheduledQuizzes = JSON.parse(localStorage.getItem('edugenie_scheduled_quizzes') || '[]');
  if (scheduledQuizzes.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  list.innerHTML = scheduledQuizzes.map(quiz => {
    const timeStr = new Date(quiz.scheduledTime).toLocaleString();
    const isReady = quiz.isReady || Date.now() >= quiz.scheduledTime;
    
    return `
      <div style="background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Topic: ${escapeHtml(quiz.payload.prompt)}</div>
          <div style="font-size: 0.85rem; color: var(--text-sec); display: flex; align-items: center; gap: 4px;">
            <i data-lucide="clock" style="width: 14px;"></i> Scheduled for: ${timeStr}
          </div>
        </div>
        <button class="btn btn-primary" style="padding: 6px 16px; border-radius: var(--radius-md); font-size: 0.85rem; ${!isReady ? 'opacity: 0.5;' : ''}" onclick="takeScheduledQuiz('${quiz.id}')">
          ${isReady ? 'Take Quiz' : 'Waiting...'}
        </button>
      </div>
    `;
  }).join('');
  if (window.lucide) window.lucide.createIcons();
}
window.renderScheduledQuizzes = renderScheduledQuizzes;
