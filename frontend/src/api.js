const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const headers = (token) => {
  const base = { 'Content-Type': 'application/json' };
  if (token) {
    base.Authorization = `Bearer ${token}`;
  }
  return base;
};

async function request(path, options = {}, token) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: headers(token),
    });
    return await response.json();
  } catch (error) {
    return { detail: error.message || 'Network error' };
  }
}

export const apiGet = (path, token) => request(path, { method: 'GET' }, token);
export const apiDelete = (path, token) => request(path, { method: 'DELETE' }, token);
export const apiPost = (path, payload, token) =>
  request(
    path,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
