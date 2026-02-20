const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('uniandes_token');
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
    localStorage.removeItem('uniandes_token');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error de servidor');
  }
  return res.json();
}

let dashboardContext = {};

export const api = {
  // Auth
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request('/api/auth/me'),

  // Dashboard
  kpis: async (base) => {
    const res = await request(`/api/dashboard/kpis${base ? `?base=${base}` : ''}`);
    dashboardContext.kpis = res;
    return res;
  },
  funnel: async (base) => {
    const res = await request(`/api/dashboard/funnel${base ? `?base=${base}` : ''}`);
    dashboardContext.funnel = res;
    return res;
  },
  trends: async (period = 'week', base) => {
    const res = await request(`/api/dashboard/trends?period=${period}${base ? `&base=${base}` : ''}`);
    dashboardContext.trends = res;
    return res;
  },
  byMedio: async (base) => {
    const res = await request(`/api/dashboard/by-medio${base ? `?base=${base}` : ''}`);
    dashboardContext.byMedio = res;
    return res;
  },
  byPrograma: async (base, limit = 15) => {
    const res = await request(`/api/dashboard/by-programa?limit=${limit}${base ? `&base=${base}` : ''}`);
    dashboardContext.byPrograma = res;
    return res;
  },
  agents: async (base) => {
    const res = await request(`/api/dashboard/agents${base ? `?base=${base}` : ''}`);
    dashboardContext.agents = res;
    return res;
  },
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
      body: JSON.stringify({ message, history, context_data: dashboardContext }),
    }),
  aiInsights: () => request('/api/ai/insights', {
    method: 'POST',
    body: JSON.stringify({ context_data: dashboardContext }),
  }),
  aiPredictions: () => request('/api/ai/predictions', {
    method: 'POST',
    body: JSON.stringify({ context_data: dashboardContext }),
  }),
};

export default api;
