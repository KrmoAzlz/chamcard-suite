
export type UserRole = 'passenger' | 'driver' | 'agent' | 'admin';

export const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export interface UserData {
  id?: string;
  fullName: string;
  phone: string;
  nationalId?: string;
  isVerified: boolean;
  avatar: string;
  createdAt: number;
}

export interface AuthSession {
  token: string;
  role: UserRole;
  user: UserData;
}

export interface Subscription {
  active: boolean;
  remainingRides: number;
  totalRides: number;
  expiryDate: number;
}

export interface Card {
  id: string;
  alias: string;
  cardNumber: string;
  balance: number;
  type: 'digital' | 'physical';
  themeColor?: string;
  subscription?: Subscription;
  expiryDate?: string;
}

export type View = 
  | 'home' 
  | 'cards' 
  | 'transport' 
  | 'profile' 
  | 'qr_payment' 
  | 'security' 
  | 'subscription' 
  | 'topup' 
  | 'transfer' 
  | 'payment_success' 
  | 'validator'
  | 'admin_requests';

export interface RechargeRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  receiptImage: string;
  /** رقم المرجع/رقم العملية من شام كاش (إن وُجد) */
  referenceNo?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export type AppAction = 
  | 'PAY_QR' 
  | 'INSPECT_NFC' 
  | 'TOP_UP_NFC'
  | 'TOP_UP_BALANCE' 
  | 'TRANSFER_FUNDS' 
  | 'MANAGE_SUBSCRIPTION' 
  | 'GOTO_SECURITY' 
  | 'ADD_NEW_CARD'
  | 'PERFORM_LOGOUT'
  | 'NAVIGATE_TRANSPORT'
  | 'NAVIGATE_CARDS'
  | 'NAVIGATE_HOME'
  | 'NAVIGATE_PROFILE'
  | 'NAVIGATE_ADMIN_REQUESTS'
  | 'TRIGGER_SCAN'
  | 'TRIGGER_WRITE';

export type NFCStatus = 'IDLE' | 'READY' | 'SCANNING' | 'WRITING' | 'SUCCESS' | 'ERROR';

export interface SystemState {
  isBusy: boolean;
  busyAction: null | AppAction;
  nfcStatus: NFCStatus;
  isOnline: boolean;
}

export interface SystemConfig {
  features: {
    nfcEnabled: boolean;
    qrPaymentsEnabled: boolean;
    topUpEnabled: boolean;
    subscriptionsEnabled: boolean;
    transferEnabled: boolean;
  };
  limits: {
    minTopUp: number;
    maxBalance: number;
  };
  fareAmount: number;
  antiPassbackSeconds: number;
  deviceId: string;
  dailyCap: number;
}

export interface PilotConfig {
  isEnabled: boolean;
  fareAmount: number;
  maxDailyRidesPerDevice: number;
  antiPassbackSeconds: number;
  requireDeviceAuth: boolean;
  version: string;
}

export interface SavedRoute {
  id: string;
  from: string;
  to: string;
  icon?: string;
}

export interface SmartCardData {
  uid: string;
  version: number;
  balance: number;
  txCounter: number;
  status: 'uninitialized' | 'active' | 'blocked';
  issuerKeyId: string;
  lastTapTime?: number;
  cmac?: string;
}

export interface OfflineTransaction {
  id: string;
  timestamp: number;
  cardUid: string;
  amount: number;
  type: 'debit' | 'credit' | 'transfer';
  role: UserRole;
  deviceId: string;
  counterBefore: number;
  counterAfter: number;
  synced: boolean;
}
