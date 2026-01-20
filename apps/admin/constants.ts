
import { Role, User } from './types';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 دقيقة

export const MOCK_ADMIN_USER: User = {
  id: 'admin-1',
  username: 'مدير_النظام',
  role: Role.SUPER_ADMIN,
  twoFactorEnabled: true,
  isLocked: false,
};

export const MOCK_ALLOWED_IPS = ['127.0.0.1', '192.168.1.1', '8.8.8.8'];

export const SECURITY_GATEWAY_CREDS = {
  user: 'admin',
  pass: 'shield2024'
};
