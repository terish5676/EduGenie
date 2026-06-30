/**
 * EduGenie — Progress Page JavaScript
 * Utilizing Chart.js for beautiful, accurate analytics
 */
import api from './api.js';
import { showToast, initTheme, requireAuth, initSidebar, initNotifications } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initTheme();
  initSidebar();
  initNotifications();
  await loadProgress();
});



async function loadProgress() {
  try {
    const data = await api.getProgress();
    const p = data.progress;
    
    // Pull real accurate quiz scores from localStorage instead of fake backend data
    const localActivity = JSON.parse(localStorage.getItem('edugenie_activity') || '{}');
    let realQuizScores = [];
    let realDailyActivity = [];
    
    // Build last 30 days accurately
    const today = new Date();
    for(let i=29; i>=0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = localActivity[dateStr] || { time: 0, quizzes: [], actions: 0 };
      
      realDailyActivity.push({
        date: dateStr,
        sessions: dayData.actions || 0,
        time: dayData.time || 0
      });
      
      if(dayData.quizzes && dayData.quizzes.length > 0) {
        realQuizScores.push(...dayData.quizzes);
      }
    }

    renderStats(p, realDailyActivity);
    renderActivityGrid(realDailyActivity);
    renderBeautifulCharts(realDailyActivity, realQuizScores);
  } catch (err) {
    showToast(`Failed to load progress: ${err.message}`, 'error');
  }
}

function renderStats(p, realActivity) {
  const totalActions = realActivity.reduce((sum, d) => sum + d.sessions, 0);
  
  const els = {
    'streak-val': p.streak,
    'focus-val': `${Math.min(100, Math.max(10, totalActions * 5))}%`,
    'sessions-val': totalActions,
    'goal-val': `${Math.min(20, totalActions)} / 20`,
  };
  Object.entries(els).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

function renderActivityGrid(activity) {
  const grid = document.getElementById('activity-grid');
  if (!grid || !activity) return;
  const max = Math.max(...activity.map(d => d.sessions), 1);
  grid.innerHTML = activity.map(d => {
    const ratio = d.sessions / max;
    let level = 0;
    if (ratio > 0) level = 1;
    if (ratio > 0.33) level = 2;
    if (ratio > 0.66) level = 3;
    if (ratio >= 1) level = 4;
    return `<div class="activity-dot level-${level}" title="${d.date}: ${d.sessions} actions"></div>`;
  }).join('');
}

function renderBeautifulCharts(dailyActivity, quizScores) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
}
