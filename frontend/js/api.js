const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      // token invalid/expired -> force re-login
      if (path !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// Guard: redirect unauthenticated users, and route by role
function requireAuth(expectedRole) {
  const user = getUser();
  if (!getToken() || !user) {
    window.location.href = 'index.html';
    return null;
  }
  if (expectedRole && user.role !== expectedRole) {
    window.location.href = user.role === 'admin' ? 'admin.html' : 'student.html';
    return null;
  }
  return user;
}
