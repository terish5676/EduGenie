/**
 * EduGenie — Achievements Page JavaScript
 */
import { initTheme, requireAuth, initSidebar, initNotifications } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initTheme();
  initSidebar();
  initNotifications();
  loadAchievements();
});

const ACHIEVEMENTS = [
  { id: 'first_login', title: 'First Steps', desc: 'Log in to EduGenie for the first time.', icon: 'footprints', color: '#3B82F6', unlocked: true },
  { id: 'first_quiz', title: 'Quiz Whiz', desc: 'Complete your first generated quiz.', icon: 'check-circle', color: '#10B981', condition: (activity) => getTotalQuizzes(activity) > 0 },
  { id: 'streak_3', title: 'On a Roll', desc: 'Maintain a study streak of 3 days.', icon: 'flame', color: '#F97316', condition: (activity, streak) => streak >= 3 },
  { id: 'streak_7', title: 'Unstoppable', desc: 'Maintain a study streak of 7 days.', icon: 'star', color: '#EAB308', condition: (activity, streak) => streak >= 7 },
  { id: 'power_user', title: 'Power User', desc: 'Perform 50 or more actions in EduGenie.', icon: 'zap', color: '#8B5CF6', condition: (activity) => getTotalActions(activity) >= 50 },
  { id: 'explorer', title: 'Curious Mind', desc: 'Ask 10 questions using Intelligent Q&A.', icon: 'search', color: '#EC4899', condition: () => false }, // Placeholder
  { id: 'master', title: 'EduGenie Master', desc: 'Complete 100 quizzes.', icon: 'crown', color: '#F59E0B', condition: (activity) => getTotalQuizzes(activity) >= 100 }
];

function getTotalQuizzes(activity) {
  let count = 0;
  for (const date in activity) {
    if (activity[date].quizzes) count += activity[date].quizzes.length;
  }
  return count;
}

function getTotalActions(activity) {
  let count = 0;
  for (const date in activity) {
    if (activity[date].actions) count += activity[date].actions;
  }
  return count;
}

async function loadAchievements() {
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;
  
  // Calculate stats from local storage
  const activity = JSON.parse(localStorage.getItem('edugenie_activity') || '{}');
  
  // Quick streak calculation
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (activity[dateStr] && activity[dateStr].actions > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Determine unlocked
  const mapped = ACHIEVEMENTS.map(ach => {
    let unlocked = ach.unlocked;
    if (ach.condition && !unlocked) {
      unlocked = ach.condition(activity, streak);
    }
    return { ...ach, unlocked };
  });

  // Render
  grid.innerHTML = mapped.map(ach => `
    <div style="
      background: var(--surface); 
      border: 1px solid var(--border); 
      border-radius: var(--radius-xl); 
      padding: var(--space-xl); 
      display: flex; 
      gap: var(--space-md);
      align-items: center;
      transition: all 0.3s;
      opacity: ${ach.unlocked ? '1' : '0.6'};
      filter: ${ach.unlocked ? 'none' : 'grayscale(1)'};
      box-shadow: ${ach.unlocked ? 'var(--shadow-sm)' : 'none'};
    ">
      <div style="
        width: 64px; height: 64px; 
        border-radius: 50%; 
        background: ${ach.unlocked ? ach.color + '20' : 'var(--surface-alt)'}; 
        color: ${ach.unlocked ? ach.color : 'var(--text-tertiary)'}; 
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      ">
        <i data-lucide="${ach.unlocked ? ach.icon : 'lock'}" style="width: 32px; height: 32px;"></i>
      </div>
      <div>
        <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;">
          ${ach.title}
        </div>
        <div style="font-size: 0.9rem; color: var(--text-sec); line-height: 1.4;">
          ${ach.desc}
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}
