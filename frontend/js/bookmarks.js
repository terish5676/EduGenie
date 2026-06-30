/**
 * EduGenie — Bookmarks Page JavaScript
 */
import api from './api.js';
import { showToast, initTheme, requireAuth, formatDate, debounce, initSidebar, initNotifications } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initTheme();
  initSidebar();
  initNotifications();
  await loadBookmarks();
  initSearch();
});

async function loadBookmarks(search = '', category = '') {
  const grid = document.getElementById('bookmarks-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="skeleton" style="height:160px;border-radius:12px"></div>'.repeat(4);
  try {
    const data = await api.getBookmarks(search, category);
    if (!data.bookmarks.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon"><i data-lucide="bookmark" style="width: 48px; height: 48px; color: var(--primary);"></i></div>
        <h3>No bookmarks found</h3>
        <p>Save AI responses from the dashboard to bookmark them here</p>
      </div>`;
      return;
    }
    const toolColors = {
      qa: { bg: '#EDE9FE', color: '#7C3AED' },
      explain: { bg: '#EDE9FE', color: '#7C3AED' },
      quiz: { bg: '#FEF3C7', color: '#D97706' },
      summarize: { bg: '#DBEAFE', color: '#2563EB' },
      roadmap: { bg: '#FCE7F3', color: '#DB2777' },
    };
    grid.innerHTML = data.bookmarks.map(bm => {
      const tc = toolColors[bm.source_tool] || { bg: '#F3F4F6', color: '#6B7280' };
      return `
        <div class="bookmark-card">
          <div class="bookmark-card-top">
            <div class="bookmark-title">${escapeHtml(bm.title)}</div>
            <button class="icon-btn" onclick="deleteBookmark('${bm.id}')"><i data-lucide="trash-2" style="width:14px;"></i></button>
          </div>
          <div class="bookmark-preview">${escapeHtml(bm.content)}</div>
          <div class="bookmark-footer">
            <span class="bookmark-category">${bm.category}</span>
            <span class="bookmark-tool" style="background:${tc.bg};color:${tc.color};padding:2px 8px;border-radius:999px;font-size:0.75rem">
              ${bm.source_tool || 'General'}
            </span>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:8px">${formatDate(bm.created_at)}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Failed to load bookmarks</p></div>`;
  }
}

window.deleteBookmark = async function(id) {
  if (!confirm('Remove this bookmark?')) return;
  try {
    await api.deleteBookmark(id);
    showToast('Bookmark removed', 'success', 2000);
    loadBookmarks();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
};

function initSearch() {
  const searchEl = document.getElementById('bookmarks-search');
  if (searchEl) searchEl.addEventListener('input', debounce(e => loadBookmarks(e.target.value), 400));
  const filterEl = document.getElementById('category-filter');
  if (filterEl) filterEl.addEventListener('change', e => loadBookmarks(searchEl?.value || '', e.target.value));
}


function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
