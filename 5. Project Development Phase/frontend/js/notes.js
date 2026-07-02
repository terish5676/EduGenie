/**
 * EduGenie — Notes Page JavaScript
 */
import api from './api.js';
import { showToast, initTheme, requireAuth, formatDate, debounce, initSidebar, initNotifications } from './main.js';

let currentFolder = '';
let editingNoteId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initSidebar();
  initNotifications();
  await loadFolders();
  await loadNotes();
  initNewNote();
  initSearch();
});


async function loadFolders() {
  try {
    const data = await api.getFolders();
    const list = document.getElementById('folder-list');
    if (!list) return;
    const allCount = await api.getNotes();
    list.innerHTML = `
      <div class="folder-item active" data-folder="" onclick="filterFolder('')" style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="folder" style="width:16px;"></i> All Notes <span class="folder-count">${allCount.total}</span>
      </div>
      ${data.folders.map(f => `
        <div class="folder-item" data-folder="${f}" onclick="filterFolder('${f}')" style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="folder" style="width:16px;"></i> ${escapeHtml(f)}
        </div>
      `).join('')}
    `;
    if (window.lucide) setTimeout(() => window.lucide.createIcons(), 0);
  } catch {}
}

async function loadNotes(search = '', folder = '') {
  const grid = document.getElementById('notes-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="skeleton" style="height:140px;border-radius:12px"></div>'.repeat(4);
  try {
    const data = await api.getNotes(search, folder);
    if (!data.notes.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon"><i data-lucide="file-text" style="width: 48px; height: 48px; color: var(--primary);"></i></div>
          <h3>No notes yet</h3>
          <p>Create your first note to get started</p>
          <button class="btn btn-primary btn-sm" onclick="openNewNote()">+ New Note</button>
        </div>`;
      if (window.lucide) setTimeout(() => window.lucide.createIcons(), 0);
      return;
    }
    grid.innerHTML = data.notes.map(note => `
      <div class="note-card" style="display: flex; flex-direction: column; height: 280px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: var(--space-xl); box-shadow: var(--shadow-sm); transition: all 0.2s ease; cursor: pointer;" onclick="openNote('${note.id}')" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-sm)';">
        <div class="note-card-top" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div class="note-title" style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(note.title)}</div>
          <button class="icon-btn" style="color: var(--text-tertiary); transition: color 0.2s; padding: 4px; margin: -4px;" onclick="event.stopPropagation();deleteNoteConfirm('${note.id}')" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--text-tertiary)'"><i data-lucide="trash-2" style="width:16px;"></i></button>
        </div>
        <div class="note-preview" style="flex: 1; font-size: 0.95rem; color: var(--text-sec); line-height: 1.6; overflow: hidden; position: relative; margin-bottom: 16px;">
          <div style="display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHtml(note.content).replace(/\n/g, '<br>') || '<em style="color:var(--text-muted)">Empty note</em>'}
          </div>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 40px; background: linear-gradient(transparent, var(--surface));"></div>
        </div>
        <div class="note-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border);">
          <span class="note-folder-tag" style="font-size: 0.8rem; font-weight: 700; color: var(--primary); background: rgba(91,141,255,0.1); padding: 4px 10px; border-radius: var(--radius-full); display:flex; align-items:center; gap:4px;"><i data-lucide="folder" style="width:12px;"></i> ${escapeHtml(note.folder)}</span>
          <span class="note-date" style="font-size: 0.8rem; font-weight: 600; color: var(--text-tertiary);">${formatDate(note.updated_at)}</span>
        </div>
      </div>
    `).join('');
    if (window.lucide) setTimeout(() => window.lucide.createIcons(), 0);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Failed to load notes: ${err.message}</p></div>`;
  }
}

function initNewNote() {
  document.getElementById('new-note-btn')?.addEventListener('click', openNewNote);
  document.getElementById('close-modal')?.addEventListener('click', closeModal);
  document.getElementById('note-modal')?.addEventListener('click', e => { if (e.target.id === 'note-modal') closeModal(); });
  document.getElementById('save-note-btn')?.addEventListener('click', saveNote);

  // Autosave
  const textarea = document.getElementById('note-content');
  if (textarea) {
    textarea.addEventListener('input', debounce(async () => {
      if (editingNoteId) {
        try {
          await api.updateNote(editingNoteId, {
            content: textarea.value,
            title: document.getElementById('note-title-input').value,
          });
        } catch {}
      }
    }, 1500));
  }
}

window.openNote = async function(id) {
  const data = await api.getNotes();
  const note = data.notes.find(n => n.id === id);
  if (!note) return;
  editingNoteId = id;
  document.getElementById('note-title-input').value = note.title;
  document.getElementById('note-content').value = note.content;
  document.getElementById('note-folder-input').value = note.folder;
  document.getElementById('modal-title').textContent = 'Edit Note';
  document.getElementById('note-modal').classList.add('open');
};

function openNewNote() {
  editingNoteId = null;
  document.getElementById('note-title-input').value = '';
  document.getElementById('note-content').value = '';
  document.getElementById('note-folder-input').value = 'General';
  document.getElementById('modal-title').textContent = 'New Note';
  document.getElementById('note-modal').classList.add('open');
  document.getElementById('note-title-input').focus();
}
window.openNewNote = openNewNote;

function closeModal() {
  document.getElementById('note-modal').classList.remove('open');
  editingNoteId = null;
}

async function saveNote() {
  const title = document.getElementById('note-title-input').value.trim();
  const content = document.getElementById('note-content').value;
  const folder = document.getElementById('note-folder-input').value.trim() || 'General';
  if (!title) { showToast('Please enter a title', 'warning'); return; }
  try {
    if (editingNoteId) {
      await api.updateNote(editingNoteId, { title, content, folder });
      showToast('Note saved', 'success', 2000);
    } else {
      await api.createNote(title, content, folder);
      showToast('Note created', 'success', 2000);
    }
    closeModal();
    await loadNotes(document.getElementById('notes-search').value, currentFolder);
    await loadFolders();
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
  }
}

window.deleteNoteConfirm = async function(id) {
  if (!confirm('Delete this note?')) return;
  try {
    await api.deleteNote(id);
    showToast('Note deleted', 'success', 2000);
    await loadNotes('', currentFolder);
    await loadFolders();
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
};

window.filterFolder = function(folder) {
  currentFolder = folder;
  document.querySelectorAll('.folder-item').forEach(el => {
    el.classList.toggle('active', el.dataset.folder === folder);
  });
  loadNotes(document.getElementById('notes-search')?.value || '', folder);
};

function initSearch() {
  const searchEl = document.getElementById('notes-search');
  if (!searchEl) return;
  searchEl.addEventListener('input', debounce(e => loadNotes(e.target.value, currentFolder), 400));
}


function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
