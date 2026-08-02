/**
 * RailWayPro — Frontend API Configuration
 * =========================================
 * This is the ONLY file you need to edit when deploying.
 *
 * For LOCAL development:  API_BASE = 'http://localhost:5000'
 * For PRODUCTION:         API_BASE = 'https://your-backend-url.com'
 *
 * Do NOT hardcode any other URLs anywhere else in the frontend.
 */

// Smart API Base URL detection:
// - If custom URL stored in localStorage, use it.
// - If running locally (port 5500/8080 Live Server), point to http://localhost:5000
// - If served directly from Express backend, use relative path ''
// - Otherwise, replace 'https://YOUR-BACKEND-URL.onrender.com' with your deployed backend URL.
let API_BASE = localStorage.getItem('CUSTOM_API_BASE');
if (!API_BASE) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';
  } else {
    // Change this string to your deployed backend URL (e.g. https://railwaypro-api.onrender.com)
    // or set it to '' if your backend serves the frontend files.
    API_BASE = 'https://YOUR-BACKEND-URL.onrender.com';
  }
}

// Helper: Get stored JWT token
function getToken() {
  return localStorage.getItem('railwaypro_token');
}

// Helper: Get stored user object
function getUser() {
  const user = localStorage.getItem('railwaypro_user');
  return user ? JSON.parse(user) : null;
}

// Helper: Save login session
function saveSession(token, user) {
  localStorage.setItem('railwaypro_token', token);
  localStorage.setItem('railwaypro_user', JSON.stringify(user));
}

// Helper: Clear session (logout)
function clearSession() {
  localStorage.removeItem('railwaypro_token');
  localStorage.removeItem('railwaypro_user');
}

// Helper: Redirect if not logged in
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Helper: Redirect if not admin
function requireAdmin() {
  const user = getUser();
  if (!getToken() || !user || user.role !== 'ADMIN') {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Helper: Authenticated fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

// Helper: Show alert message in a container element
function showAlert(containerId, message, type = 'error') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.style.display = 'block';
  if (type === 'success') {
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }
}

// Helper: Format currency in INR
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

// Helper: Format date nicely
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// Helper: Format time (HH:MM:SS → HH:MM AM/PM)
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}
