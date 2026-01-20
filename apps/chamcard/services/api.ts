import { AuthSession, UserRole, PHONE_REGEX } from '../types';
import { authStore } from '../store/authStore';

// In production, VITE_API_BASE should be set in .env
const BASE_URL = (import.meta as any).env?.VITE_API_BASE || '';

const getAuthHeaders = () => {
  const session = authStore.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-ID': authStore.getDeviceId(),
    'X-App-Platform': 'Pilot-V10'
  };
  
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  
  return headers;
};

export const apiService = {
  async login(phone: string, password: string): Promise<AuthSession> {
    // 1. Strict Phone Validation (E.164)
    if (!PHONE_REGEX.test(phone)) {
      throw new Error('رقم الهاتف يجب أن يكون بالتنسيق الدولي +963...');
    }

    // 2. Demo/Pilot Simulation Logic
    if (!BASE_URL) {
      await new Promise(r => setTimeout(r, 1000));
      
      // Pilot role mapping based on phone suffix
      let role: UserRole = 'passenger';
      if (phone.endsWith('2222')) role = 'driver';
      else if (phone.endsWith('3333')) role = 'agent';
      else if (phone.endsWith('4444')) role = 'admin';

      return {
        token: `pilot_token_${btoa(phone + Date.now())}`,
        role,
        user: {
          fullName: role === 'passenger' ? "مستخدم طيار" : (role === 'driver' ? "سائق معتمد" : "مسؤول النظام"),
          phone,
          isVerified: true,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(role)}&background=059669&color=fff`,
          createdAt: Date.now()
        }
      };
    }

    // 3. Real Backend Integration
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, password })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'خطأ في المصادقة. يرجى التحقق من البيانات.');
    }
    return res.json();
  },

  async register(data: { fullName: string, phone: string, password: string }): Promise<AuthSession> {
    if (!PHONE_REGEX.test(data.phone)) {
      throw new Error('رقم الهاتف غير صالح.');
    }

    if (!BASE_URL) {
      await new Promise(r => setTimeout(r, 1200));
      return {
        token: `pilot_token_${btoa(data.phone + Date.now())}`,
        role: 'passenger',
        user: {
          fullName: data.fullName,
          phone: data.phone,
          isVerified: true,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=059669&color=fff`,
          createdAt: Date.now()
        }
      };
    }

    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'فشل التسجيل. قد يكون الرقم مستخدماً مسبقاً.');
    }
    return res.json();
  }
};