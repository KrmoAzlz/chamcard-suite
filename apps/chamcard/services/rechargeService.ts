
import { RechargeRequest } from '../types';

const STORAGE_KEY = 'sham_recharge_requests';

export const rechargeService = {
  submitRequest(request: Omit<RechargeRequest, 'id' | 'status' | 'timestamp'>): void {
    const requests = this.getRequests();
    const newRequest: RechargeRequest = {
      ...request,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      timestamp: Date.now()
    };
    requests.unshift(newRequest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  },

  getRequests(): RechargeRequest[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  updateStatus(requestId: string, status: 'approved' | 'rejected'): void {
    const requests = this.getRequests();
    const updated = requests.map(r => r.id === requestId ? { ...r, status } : r);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  getPendingCount(): number {
    return this.getRequests().filter(r => r.status === 'pending').length;
  }
};
