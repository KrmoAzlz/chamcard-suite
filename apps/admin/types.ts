
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FINANCE = 'FINANCE',
  SUPPORT = 'SUPPORT'
}

export interface User {
  id: string;
  username: string;
  role: Role;
  twoFactorEnabled: boolean;
  isLocked: boolean;
  sessionToken?: string; // محاكاة JWT آمن
}

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  username: string;
  action: string;
  category: 'SECURITY' | 'FINANCE' | 'SUPPORT' | 'SYSTEM';
  status: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  details: string;
}

export interface SecurityState {
  isGatewayAuthenticated: boolean;
  isAuthenticated: boolean;
  isTwoFactorVerified: boolean;
  currentUser: User | null;
  failedAttempts: number;
  isLockedOut: boolean;
}
