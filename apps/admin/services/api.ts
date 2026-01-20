const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'dev-admin-token';
export const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'superadmin';

async function parseJson(res: Response): Promise<any> {
  return await res.json().catch(() => ({}));
}

function adminHeaders(extra: Record<string, string> = {}) {
  return {
    'x-admin-token': ADMIN_TOKEN,
    'x-admin-user': ADMIN_USER,
    ...extra
  };
}

export async function getTodayStats() {
  const res = await fetch(`${API_BASE}/api/stats/today`, { headers: adminHeaders() });
  return await parseJson(res);
}

export async function listTransactions(date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API_BASE}/api/transactions${q}`, { headers: adminHeaders() });
  return await parseJson(res);
}

export async function searchCards(q: string) {
  const res = await fetch(`${API_BASE}/api/cards?q=${encodeURIComponent(q)}`, { headers: adminHeaders() });
  return await parseJson(res);
}

export async function blockCard(uid: string, reason: string) {
  const res = await fetch(`${API_BASE}/api/cards/${encodeURIComponent(uid)}/block`, {
    method: 'POST',
    headers: adminHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ reason })
  });
  return await parseJson(res);
}

export async function unblockCard(uid: string, reason: string) {
  const res = await fetch(`${API_BASE}/api/cards/${encodeURIComponent(uid)}/unblock`, {
    method: 'POST',
    headers: adminHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ reason })
  });
  return await parseJson(res);
}

export async function createValidator(payload: { id?: string; name?: string; route?: string; fareId?: string }) {
  const res = await fetch(`${API_BASE}/api/validators`, {
    method: 'POST',
    headers: adminHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  return await parseJson(res);
}

export async function listValidators() {
  const res = await fetch(`${API_BASE}/api/validators`, { headers: adminHeaders() });
  return await parseJson(res);
}

export async function listFares() {
  const res = await fetch(`${API_BASE}/api/fares`, { headers: adminHeaders() });
  return await parseJson(res);
}

export async function setDefaultFare(defaultFareId: string) {
  const res = await fetch(`${API_BASE}/api/config/default-fare`, {
    method: 'POST',
    headers: adminHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ defaultFareId })
  });
  return await parseJson(res);
}
