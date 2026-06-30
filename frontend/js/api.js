/**
 * EduGenie — Centralized API Client
 * All HTTP calls to the FastAPI backend
 */

const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('edugenie_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('edugenie_token', token);
    } else {
      localStorage.removeItem('edugenie_token');
    }
  }

  getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async request(method, path, body = null, isFormData = false) {
    const options = {
      method,
      headers: this.getHeaders(isFormData),
    };
    if (body) {
      options.body = isFormData ? body : JSON.stringify(body);
    }
    try {
      const res = await fetch(`${API_BASE}${path}`, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.detail || data.message || `Request failed (${res.status})`;
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      if (err.message.includes('Invalid or expired token')) {
        this.setToken(null);
        window.location.href = '/login';
      }
      throw err;
    }
  }

  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }
  delete(path) { return this.request('DELETE', path); }
  postForm(path, formData) { return this.request('POST', path, formData, true); }

  // ── Auth ──
  async register(name, email, password) {
    const data = await this.post('/auth/register', { name, email, password });
    this.setToken(data.access_token);
    return data;
  }
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    this.setToken(data.access_token);
    return data;
  }
  async logout() {
    try { await this.post('/auth/logout'); } catch {}
    this.setToken(null);
    localStorage.removeItem('edugenie_user');
    window.location.href = '/';
  }
  async getMe() { return this.get('/auth/me'); }

  // ── AI Tools ──
  async askQuestion(question, context = '') {
    return this.post('/ai/qa', { question, context });
  }
  async explainConcept(topic, level = 'intermediate', style = 'detailed') {
    return this.post('/ai/explain', { topic, level, style });
  }
  async generateQuiz(topic, difficulty = 'medium', num_questions = 5, quiz_type = 'mcq') {
    return this.post('/ai/quiz', { topic, difficulty, num_questions, quiz_type });
  }
  async summarizeText(text, mode = 'detailed') {
    return this.post('/ai/summarize', { text, mode });
  }
  async summarizeFile(file, mode = 'detailed') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', mode);
    return this.postForm('/ai/summarize/file', fd);
  }
  async generateRoadmap(topic, level = 'beginner', duration = '3 months') {
    return this.post('/ai/roadmap', { topic, level, duration });
  }

  // ── Notes ──
  async getNotes(search = '', folder = '') {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (folder) q.set('folder', folder);
    return this.get(`/notes/?${q}`);
  }
  async createNote(title, content, folder = 'General') {
    return this.post('/notes/', { title, content, folder });
  }
  async updateNote(id, updates) { return this.request('PUT', `/notes/${id}`, updates); }
  async deleteNote(id) { return this.delete(`/notes/${id}`); }
  async getFolders() { return this.get('/notes/folders'); }

  // ── Bookmarks ──
  async getBookmarks(search = '', category = '') {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (category) q.set('category', category);
    return this.get(`/bookmarks/?${q}`);
  }
  async createBookmark(title, content, category = 'General', source_tool = '') {
    return this.post('/bookmarks/', { title, content, category, source_tool });
  }
  async deleteBookmark(id) { return this.delete(`/bookmarks/${id}`); }

  // ── History ──
  async getHistory(search = '', tool = '') {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (tool) q.set('tool', tool);
    return this.get(`/history/?${q}`);
  }
  async clearHistory() { return this.delete('/history/'); }

  // ── Progress ──
  async getProgress() { return this.get('/progress/'); }

  // ── Settings ──
  async getSettings() { return this.get('/settings/'); }
  async updateSettings(updates) { return this.put('/settings/', updates); }
  async changePassword(current_password, new_password) {
    const q = new URLSearchParams({ current_password, new_password });
    return this.request('PUT', `/settings/password?${q}`);
  }
}

// Singleton instance
const api = new ApiClient();
export default api;
