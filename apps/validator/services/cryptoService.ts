
import CryptoJS from 'crypto-js';

/**
 * Generates a full HMAC-SHA256 signature for security payloads.
 */
export const generateHmac = (payload: string, key: string): string => {
  return CryptoJS.HmacSHA256(payload, key).toString(CryptoJS.enc.Hex);
};

/**
 * Simulates a CMAC calculation for a smart card based on its current internal state.
 */
export const calculateCardCmac = (card: { uid: string; balance: number; txCounter: number }, key: string): string => {
  // Canonical payload format for CMAC
  const payload = `UID:${card.uid}|BAL:${card.balance.toFixed(2)}|TX:${card.txCounter}`;
  return generateHmac(payload, key).substring(0, 16); // Using 16 chars for CMAC simulation
};
