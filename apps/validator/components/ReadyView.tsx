
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { DeviceConfig, QRData, CardData, Transaction } from '../types';
import { generateHmac } from '../services/cryptoService';
import { LucideSmartphoneNfc, LucideHistory, LucidePauseCircle } from 'lucide-react';

interface ReadyViewProps {
  config: DeviceConfig;
  onSimulateTap: (card: CardData) => void;
  transactions: Transaction[];
}

const ReadyView: React.FC<ReadyViewProps> = ({ config, onSimulateTap, transactions }) => {
  const [qrContent, setQrContent] = useState<string>('');
  const [timer, setTimer] = useState(20);

  const refreshQR = () => {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    const payload = `${config.validatorId}|${config.fare}|${timestamp}|${nonce}`;
    const signature = generateHmac(payload, config.deviceKey); // Full HMAC 64 chars
    
    const qrData: QRData = {
      validatorId: config.validatorId,
      fareId: config.fare.toString(),
      timestamp,
      nonce,
      signature
    };

    setQrContent(JSON.stringify(qrData));
    setTimer(20);
  };

  useEffect(() => {
    if (config.isTripActive) {
      refreshQR();
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            refreshQR();
            return 20;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [config.validatorId, config.isTripActive]);

  const triggerSimulation = (uid: string) => {
    const db = JSON.parse(localStorage.getItem('simulated_cards_db') || '{}');
    const card = db[uid];
    if (card) {
      onSimulateTap(card);
    } else {
      // For testing "Wrong CMAC" simulation
      onSimulateTap({
        uid: 'INVALID_99',
        balance: 10,
        txCounter: 0,
        status: 'ACTIVE',
        cmac: 'corrupted-sig-12345'
      });
    }
  };

  if (!config.isTripActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 space-y-6 bg-gray-900/50">
        <LucidePauseCircle className="w-32 h-32 text-gray-600 mb-4" />
        <h1 className="text-4xl font-black text-gray-500">الجهاز خارج الخدمة</h1>
        <p className="text-xl text-gray-600">الرحلة متوقفة من قبل السائق</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-1 text-blue-400">{config.routeName}</h1>
        <div className="bg-blue-900/30 text-blue-200 px-6 py-1 rounded-full inline-block border border-blue-800 font-bold text-xl">
          التعرفة: {config.fare}₺
        </div>
      </div>

      <div className="relative bg-white p-5 rounded-3xl shadow-[0_0:40px_rgba(59,130,246,0.2)]">
        {qrContent && (
          <QRCodeSVG value={qrContent} size={220} level="H" />
        )}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
          تجديد: {timer} ث
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-col items-center animate-pulse">
          <div className="p-5 bg-blue-600 rounded-full mb-3 shadow-lg shadow-blue-500/20">
            <LucideSmartphoneNfc className="w-12 h-12 text-white" />
          </div>
          <p className="text-2xl font-black">قرب البطاقة هنا</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          <button 
            onClick={() => triggerSimulation('CARD_1')}
            className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            <span className="block text-xs text-gray-500 uppercase">Valid Tap</span>
            <span className="font-bold text-green-400">بطاقة 1</span>
          </button>
          <button 
            onClick={() => triggerSimulation('WRONG_CMAC')}
            className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            <span className="block text-xs text-gray-500 uppercase">Fake Tap</span>
            <span className="font-bold text-yellow-500">CMAC Error</span>
          </button>
          <button 
            onClick={() => triggerSimulation('CARD_2')}
            className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            <span className="block text-xs text-gray-500 uppercase">Low Balance</span>
            <span className="font-bold text-red-400">بطاقة 2</span>
          </button>
          <button 
            onClick={() => triggerSimulation('CARD_BLOCK')}
            className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            <span className="block text-xs text-gray-500 uppercase">Blocked</span>
            <span className="font-bold text-red-600">محظورة</span>
          </button>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="w-full bg-gray-800/50 p-3 rounded-xl flex items-center justify-between border border-gray-700/50">
          <div className="flex items-center gap-3">
            <LucideHistory className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold truncate max-w-[150px]">{transactions[0].cardUid}</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-green-400 font-bold">-{transactions[0].amount}₺</span>
             <div className={`w-2 h-2 rounded-full ${transactions[0].syncStatus === 'synced' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadyView;
