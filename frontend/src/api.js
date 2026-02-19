const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('crexe_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('crexe_token');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error de servidor');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request('/api/auth/me'),

  // Dashboard
  kpis: (base) => request(`/api/dashboard/kpis${base ? `?base=${base}` : ''}`),
  funnel: (base) => request(`/api/dashboard/funnel${base ? `?base=${base}` : ''}`),
  trends: (period = 'week', base) =>
    request(`/api/dashboard/trends?period=${period}${base ? `&base=${base}` : ''}`),
  byMedio: (base) => request(`/api/dashboard/by-medio${base ? `?base=${base}` : ''}`),
  byPrograma: (base, limit = 15) =>
    request(`/api/dashboard/by-programa?limit=${limit}${base ? `&base=${base}` : ''}`),
  agents: (base) => request(`/api/dashboard/agents${base ? `?base=${base}` : ''}`),
  leads: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    return request(`/api/dashboard/leads?${q.toString()}`);
  },
  bases: () => request('/api/dashboard/bases'),

  // AI
  aiChat: (message, history = []) =>
    request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
  aiInsights: () => request('/api/ai/insights'),
  aiPredictions: () => request('/api/ai/predictions'),
};

export default api;
