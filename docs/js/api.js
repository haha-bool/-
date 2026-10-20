export async function api(path, { method = 'GET', body } = {}) {
  // GitHub Pages 静态版：不经过网络，直接调用浏览器内的 SQLite + 同一套 API 路由
  if (window.__TRADEOS_STATIC__) {
    return window.__TRADEOS_STATIC__(path, { method, body });
  }
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`服务器返回异常（HTTP ${res.status}）`);
  }
  if (!res.ok || data.ok === false) throw new Error(data.error || `请求失败（HTTP ${res.status}）`);
  return data;
}

export const getBootstrap = (date) => api(`/api/bootstrap${date ? `?date=${date}` : ''}`);
export const createTask = (body) => api('/api/tasks', { method: 'POST', body });
export const updateTask = (id, body) => api(`/api/tasks/${id}`, { method: 'PATCH', body });
export const deleteTask = (id) => api(`/api/tasks/${id}`, { method: 'DELETE' });
export const generatePlan = (date) => api('/api/tasks/generate', { method: 'POST', body: { date } });