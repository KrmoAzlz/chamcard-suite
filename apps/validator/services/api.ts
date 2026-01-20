const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export type SyncTx = {
  id: string;
  createdAt: number;
  method: 'NFC' | 'QR';
  fareId?: string;
  amount: number;
  cardUid?: string;
  status?: 'ok' | 'fail';
  reason?: string;
};

export async function heartbeat(validatorId: string, deviceKey: string): Promise<boolean> {
  const url = `${API_BASE}/api/validators/${encodeURIComponent(validatorId)}/heartbeat`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'x-device-key': deviceKey }
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncTransactions(validatorId: string, deviceKey: string, items: SyncTx[]): Promise<{ ok: boolean; accepted?: number }>{
  const url = `${API_BASE}/api/transactions/bulk`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-device-key': deviceKey
      },
      body: JSON.stringify({ validatorId, items })
    });
    const data = await res.json().catch(() => ({}));
    return { ok: !!data.ok, accepted: data.accepted };
  } catch {
    return { ok: false };
  }
}

export async function fetchValidatorConfig(validatorId: string, deviceKey: string): Promise<any | null> {
  const url = `${API_BASE}/api/validators/${encodeURIComponent(validatorId)}/config`;
  try {
    const res = await fetch(url, { headers: { 'x-device-key': deviceKey } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
