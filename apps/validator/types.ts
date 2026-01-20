
export enum ScreenState {
  READY = 'READY',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ADMIN_PIN = 'ADMIN_PIN',
  ADMIN_MENU = 'ADMIN_MENU',
  PAIRING = 'PAIRING'
}

export interface CardData {
  uid: string;
  balance: number;
  txCounter: number;
  status: 'ACTIVE' | 'BLOCKED' | 'NOT_INITIALIZED';
  cmac: string;
}

export interface Transaction {
  id: string;
  cardUid: string;
  amount: number;
  timestamp: number;
  routeId: string;
  syncStatus: 'pending' | 'synced';
}

export interface DeviceConfig {
  validatorId: string;
  deviceKey: string;
  busNumber: string;
  routeName: string;
  fare: number;
  isPaired: boolean;
  isTripActive: boolean;
}

export interface QRData {
  validatorId: string;
  fareId: string;
  timestamp: number;
  nonce: string;
  signature: string;
}
