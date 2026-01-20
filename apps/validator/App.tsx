
import React, { useState, useEffect, useCallback } from 'react';
import { ScreenState, DeviceConfig, CardData, Transaction } from './types';
import ReadyView from './components/ReadyView';
import SuccessView from './components/SuccessView';
import FailedView from './components/FailedView';
import AdminMenu from './components/AdminMenu';
import AdminPin from './components/AdminPin';
import PairingView from './components/PairingView';
import { calculateCardCmac } from './services/cryptoService';
import { LucideSettings } from 'lucide-react';
import { fetchValidatorConfig, heartbeat, syncTransactions } from './services/api';

const TX_STORAGE_KEY = 'bus_transactions_queue';
const CARD_DB_KEY = 'simulated_cards_db';

const App: React.FC = () => {
  const [config, setConfig] = useState<DeviceConfig>({
    validatorId: 'VAL-001',
    deviceKey: 'bus-secret-key-2025',
    busNumber: '102-A',
    routeName: 'وسط البلد - الجامعة',
    fare: 2.5,
    isPaired: true,
    isTripActive: true
  });

  const [screen, setScreen] = useState<ScreenState>(ScreenState.READY);
  const [lastError, setLastError] = useState<string>('');
  const [lastTxAmount, setLastTxAmount] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Background heartbeat + (optional) pull latest fare config
  useEffect(() => {
    if (!config.isPaired) return;

    let cancelled = false;

    const tick = async () => {
      // 1) Heartbeat (best-effort)
      await heartbeat(config.validatorId, config.deviceKey);

      // 2) Pull config from server if available (best-effort)
      const remote = await fetchValidatorConfig(config.validatorId, config.deviceKey);
      if (cancelled || !remote?.ok) return;
      const fareAmount = remote.fare?.amount;
      const routeName = remote.validator?.route;
      if (typeof fareAmount === 'number') {
        setConfig(prev => ({ ...prev, fare: fareAmount }));
      }
      if (typeof routeName === 'string' && routeName.trim()) {
        setConfig(prev => ({ ...prev, routeName }));
      }
    };

    const id = window.setInterval(tick, 15000);
    tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [config.isPaired, config.validatorId, config.deviceKey]);

  // Initialize/Load Simulated Cards Database
  useEffect(() => {
    const savedCards = localStorage.getItem(CARD_DB_KEY);
    if (!savedCards) {
      // Default initial cards for testing
      const initialCards: Record<string, CardData> = {
        'CARD_1': { uid: 'CARD_1', balance: 50.0, txCounter: 0, status: 'ACTIVE', cmac: '' },
        'CARD_2': { uid: 'CARD_2', balance: 1.5, txCounter: 5, status: 'ACTIVE', cmac: '' },
        'CARD_BLOCK': { uid: 'CARD_BLOCK', balance: 100.0, txCounter: 0, status: 'BLOCKED', cmac: '' }
      };
      // Pre-calculate CMACs for initial cards
      Object.values(initialCards).forEach(c => {
        c.cmac = calculateCardCmac(c, config.deviceKey);
      });
      localStorage.setItem(CARD_DB_KEY, JSON.stringify(initialCards));
    }

    const savedTxs = localStorage.getItem(TX_STORAGE_KEY);
    if (savedTxs) setTransactions(JSON.parse(savedTxs));

    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [config.deviceKey]);

  useEffect(() => {
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const handleTransaction = useCallback((incomingCard: CardData) => {
    if (!config.isTripActive) {
      setLastError('الرحلة متوقفة حالياً');
      setScreen(ScreenState.FAILED);
      return;
    }

    // 1. NFC READ PHASE
    if (incomingCard.status !== 'ACTIVE') {
      setLastError(incomingCard.status === 'BLOCKED' ? 'بطاقة محظورة' : 'بطاقة غير مهيئة');
      setScreen(ScreenState.FAILED);
      return;
    }

    // 2. CRYPTO VERIFICATION (REAL CMAC CHECK)
    const expectedCmac = calculateCardCmac(incomingCard, config.deviceKey);
    if (incomingCard.cmac !== expectedCmac) {
      setLastError('خطأ في مصادقة البطاقة (CMAC Mismatch)');
      setScreen(ScreenState.FAILED);
      return;
    }

    // 3. LOGIC PHASE
    if (incomingCard.balance < config.fare) {
      setLastError('رصيد غير كافي');
      setScreen(ScreenState.FAILED);
      return;
    }

    // 4. WRITE PHASE (Update Local Card DB to simulate writing back to the NFC chip)
    const updatedBalance = incomingCard.balance - config.fare;
    const updatedCounter = incomingCard.txCounter + 1;
    
    const updatedCard: CardData = {
      ...incomingCard,
      balance: updatedBalance,
      txCounter: updatedCounter,
      // Calculate NEW CMAC that will be stored on the card for next tap
      cmac: calculateCardCmac({ uid: incomingCard.uid, balance: updatedBalance, txCounter: updatedCounter }, config.deviceKey)
    };

    // Commit to Card Storage
    const db = JSON.parse(localStorage.getItem(CARD_DB_KEY) || '{}');
    db[updatedCard.uid] = updatedCard;
    localStorage.setItem(CARD_DB_KEY, JSON.stringify(db));

    // 5. QUEUE PHASE (Save to Offline Transaction Log)
    const newTx: Transaction = {
      id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      cardUid: updatedCard.uid,
      amount: config.fare,
      timestamp: Date.now(),
      routeId: config.busNumber,
      syncStatus: 'pending'
    };

    setTransactions(prev => [newTx, ...prev]);
    setLastTxAmount(config.fare);
    setScreen(ScreenState.SUCCESS);

    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});

    setTimeout(() => setScreen(ScreenState.READY), 2500);
  }, [config]);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-white relative overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0:10px_#22c55e]' : 'bg-red-500 shadow-[0_0:10px_#ef4444]'}`}></div>
          <span className="text-sm font-bold uppercase">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="text-xl font-black">{config.busNumber} {config.isTripActive ? '' : '(متوقف)'}</div>
        <button onClick={() => setScreen(ScreenState.ADMIN_PIN)} className="p-2 hover:bg-gray-700 rounded-full">
          <LucideSettings className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {screen === ScreenState.READY && (
          <ReadyView config={config} onSimulateTap={handleTransaction} transactions={transactions} />
        )}
        {screen === ScreenState.SUCCESS && (
          <SuccessView amount={lastTxAmount} />
        )}
        {screen === ScreenState.FAILED && (
          <FailedView reason={lastError} onRetry={() => setScreen(ScreenState.READY)} />
        )}
        {screen === ScreenState.ADMIN_PIN && (
          <AdminPin onConfirm={() => setScreen(ScreenState.ADMIN_MENU)} onCancel={() => setScreen(ScreenState.READY)} />
        )}
        {screen === ScreenState.ADMIN_MENU && (
          <AdminMenu 
            config={config} 
            setConfig={setConfig} 
            transactions={transactions} 
            onClose={() => setScreen(ScreenState.READY)}
            onSync={async () => {
              const pending = transactions.filter(t => t.syncStatus === 'pending');
              if (pending.length === 0) return;
              const payload = pending.map(t => ({
                id: t.id,
                createdAt: t.timestamp,
                method: 'NFC' as const,
                amount: t.amount,
                cardUid: t.cardUid
              }));

              const r = await syncTransactions(config.validatorId, config.deviceKey, payload);
              if (r.ok) {
                setTransactions(prev => prev.map(tx => tx.syncStatus === 'pending' ? { ...tx, syncStatus: 'synced' } : tx));
              } else {
                setLastError('فشل الاتصال بالسيرفر: لم يتم إرسال العمليات');
                setScreen(ScreenState.FAILED);
              }
            }}
            clearHistory={() => setTransactions(prev => prev.filter(tx => tx.syncStatus === 'pending'))}
            onPairing={() => setScreen(ScreenState.PAIRING)}
          />
        )}
        {screen === ScreenState.PAIRING && (
          <PairingView
            onComplete={(next) => {
              if (next) setConfig(prev => ({ ...prev, ...next, isPaired: true }));
              setScreen(ScreenState.READY);
            }}
            initial={{ validatorId: config.validatorId, deviceKey: config.deviceKey }}
          />
        )}
      </div>

      <div className="p-3 bg-gray-800 text-center text-xs text-gray-400 border-t border-gray-700 flex justify-around">
        <span>المعرف: {config.validatorId}</span>
        <span>الانتظار: {transactions.filter(t => t.syncStatus === 'pending').length}</span>
        <span>v1.3.0 SECURITY_PATCH</span>
      </div>
    </div>
  );
};

export default App;
