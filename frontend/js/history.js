/**
 * EduGenie — History Page JavaScript
 */
import api from './api.js';
import { showToast, initTheme, requireAuth, timeAgo, TOOL_COLORS, renderMarkdown, debounce, initSidebar, initNotifications } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initTheme();
  initSidebar();
  initNotifications();
  await loadHistory();
  initFilters();
  document.getElementById('clear-history-btn')?.addEventListener('click', clearHistory);
});


async function loadHistory(search = '', tool = '') {
  const list = document.getElementById('history-list');
  if (!list) return;
  list.innerHTML = '<div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:8px"></div>'.repeat(5);
  try {
    const data = await api.getHistory(search, tool);
    if (!data.history.length) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="clock" style="width: 48px; height: 48px; color: var(--primary);"></i></div>
        <h3>No history yet</h3>
        <p>Your AI interactions will appear here</p>
      </div>`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    const toolInfo = {
      qa: { label: 'Q&A', icon: '<i data-lucide="message-square" style="width:14px;display:inline;"></i>' },
      explain: { label: 'Concept', icon: '<i data-lucide="book-open" style="width:14px;display:inline;"></i>' },
      quiz: { label: 'Quiz', icon: '<i data-lucide="check-square" style="width:14px;display:inline;"></i>' },
      summarize: { label: 'Summary', icon: '<i data-lucide="align-left" style="width:14px;display:inline;"></i>' },
      roadmap: { label: 'Roadmap', icon: '<i data-lucide="map" style="width:14px;display:inline;"></i>' },
    };
      list.innerHTML = data.history.map(h => {
      const ti = toolInfo[h.tool] || { label: h.tool, icon: '<i data-lucide="cpu" style="width:20px;display:inline;"></i>' };
      const tc = TOOL_COLORS[h.tool] || { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
      
      // Clean up JSON previews for quizzes or structured data
      let previewText = h.response || '';
      if (previewText.trim().startsWith('{') || previewText.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(previewText);
          if (parsed.questions) previewText = `${parsed.questions.length} questions generated on this topic.`;
          else previewText = 'Structured data generated.';
        } catch {
          previewText = previewText.slice(0, 150) + '...';
        }
      } else {
        previewText = previewText.slice(0, 150) + '...';
      }

      return `
        <div class="history-item" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: var(--space-xl); margin-bottom: var(--space-lg); box-shadow: var(--shadow-sm); transition: all 0.2s ease;">
          <div style="display: flex; gap: var(--space-lg);">
            <div class="history-tool-icon" style="background:${tc.bg}; color: ${tc.color}; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${ti.icon}</div>
            <div class="history-content" style="flex: 1; min-width: 0;">
              <div class="history-tool-label" style="color:${tc.color}; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">${ti.label}</div>
              <div class="history-prompt" style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(h.prompt)}</div>
              <div class="history-preview" style="font-size: 0.95rem; color: var(--text-sec); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(previewText)}</div>
              
              <div class="history-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
                <span class="history-date" style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 600; display: flex; align-items: center; gap: 4px;"><i data-lucide="clock" style="width: 14px;"></i> ${timeAgo(h.created_at)}</span>
                <div class="history-actions" style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" style="padding: 6px 16px; border-radius: var(--radius-full); font-weight: 600; display: flex; align-items: center; gap: 6px;" onclick="viewResponse('${h.id}', \`${escapeHtml(h.response || '').replace(/`/g, "'")}\`)"><i data-lucide="eye" style="width:16px;"></i> View</button>
                  <button class="btn btn-secondary btn-sm" style="padding: 6px 12px; border-radius: var(--radius-full); color: var(--red); display: flex; align-items: center; justify-content: center;" onclick="deleteHistoryItem('${h.id}')"><i data-lucide="trash-2" style="width:16px;"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    if (window.lucide) setTimeout(() => window.lucide.createIcons(), 0);
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>Failed to load history</p></div>`;
  }
}

window.viewResponse = function(id, response) {
  const modal = document.getElementById('view-modal');
  const body = document.getElementById('view-modal-body');
  if (!modal || !body) return;
  body.innerHTML = `<div class="markdown-output">${renderMarkdown(response)}</div>`;
  modal.classList.add('open');
};

window.deleteHistoryItem = async function(id) {
  if (!confirm('Delete this history item?')) return;
  try {
    await api.request('DELETE', `/history/${id}`);
    showToast('Deleted', 'success', 2000);
    loadHistory();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
};

async function clearHistory() {
  if (!confirm('Clear ALL history? This cannot be undone.')) return;
  try {
    await api.clearHistory();
    showToast('History cleared', 'success');
    loadHistory();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

function initFilters() {
  const searchEl = document.getElementById('history-search');
  const toolEl = document.getElementById('tool-filter');
  const handler = () => loadHistory(searchEl?.value || '', toolEl?.value || '');
  searchEl?.addEventListener('input', debounce(handler, 400));
  toolEl?.addEventListener('change', handler);

  document.getElementById('close-view-modal')?.addEventListener('click', () => {
    document.getElementById('view-modal')?.classList.remove('open');
  });
}


function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g, '&quot;');
}
