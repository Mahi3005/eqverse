/**
 * EQverse - API Service
 * Handles all HTTP requests to the Flask backend.
 */

const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';
const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`;

/**
 * Get the stored JWT token from localStorage.
 */
function getToken() {
  return localStorage.getItem('eqverse_token');
}

/**
 * Make an authenticated API request.
 */
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error('Unable to connect to backend server. Please verify that the API server is online.');
  }

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(`Server returned unexpected response (${response.status}): ${text.slice(0, 120)}`);
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// ── Auth API ─────────────────────────────────────────────────
export async function registerUser(username, email, password) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  if (data.access_token) {
    localStorage.setItem('eqverse_token', data.access_token);
    localStorage.setItem('eqverse_user', JSON.stringify(data.user));
  }
  return data;
}

export async function loginUser(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.access_token) {
    localStorage.setItem('eqverse_token', data.access_token);
    localStorage.setItem('eqverse_user', JSON.stringify(data.user));
  }
  return data;
}

export async function getProfile() {
  return apiRequest('/auth/me');
}

export function logoutUser() {
  localStorage.removeItem('eqverse_token');
  localStorage.removeItem('eqverse_user');
}

export function getStoredUser() {
  const userStr = localStorage.getItem('eqverse_user');
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated() {
  return !!getToken();
}

// ── Boss API ─────────────────────────────────────────────────
export async function fetchBosses() {
  return apiRequest('/bosses/');
}

export async function fetchBossDetails(bossId) {
  return apiRequest(`/bosses/${bossId}`);
}

// ── Battle API ───────────────────────────────────────────────
export async function startBattle(bossId) {
  return apiRequest('/battle/start', {
    method: 'POST',
    body: JSON.stringify({ boss_id: bossId }),
  });
}

export async function sendBattleMessage(sessionId, message) {
  return apiRequest('/battle/message', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, message }),
  });
}

export async function evaluateBattle(sessionId) {
  return apiRequest(`/battle/evaluate/${sessionId}`, {
    method: 'POST',
  });
}

export async function fetchBattleHistory() {
  return apiRequest('/battle/history');
}

export async function fetchSessionMessages(sessionId) {
  return apiRequest(`/battle/session/${sessionId}/messages`);
}
