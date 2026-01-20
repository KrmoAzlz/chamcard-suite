
import React, { useState } from 'react';
import { LucideLink, LucideQrCode, LucideCheckCircle } from 'lucide-react';

type PairResult = { validatorId: string; deviceKey: string; busNumber?: string; routeName?: string; fare?: number };

const PairingView: React.FC<{ onComplete: (result?: PairResult) => void; initial?: { validatorId: string; deviceKey: string } }> = ({ onComplete, initial }) => {
  const [step, setStep] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const [validatorId, setValidatorId] = useState(initial?.validatorId || '');
  const [deviceKey, setDeviceKey] = useState(initial?.deviceKey || '');

  const startPairing = () => {
    if (!validatorId.trim() || !deviceKey.trim()) {
      alert('أدخل معرف الجهاز + مفتاح الجهاز (DeviceKey) من لوحة الإدارة');
      return;
    }
    setStep('SCANNING');
    setTimeout(() => {
      setStep('SUCCESS');
      setTimeout(() => onComplete({ validatorId: validatorId.trim(), deviceKey: deviceKey.trim() }), 1200);
    }, 1200);
  };

  return (
    <div className="h-full w-full bg-gray-900 flex flex-col items-center justify-center p-8">
      {step === 'IDLE' && (
        <div className="text-center max-w-sm">
          <div className="p-8 bg-blue-600 rounded-full inline-block mb-8">
            <LucideLink className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">ربط الجهاز بالنظام</h2>
          <p className="text-gray-400 mb-6">أدخل بيانات الجهاز من لوحة الإدارة (Pairing). لاحقاً يمكن تحويلها لمسح QR.</p>

          <div className="space-y-3 mb-6 text-right">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Validator ID</label>
              <input value={validatorId} onChange={(e) => setValidatorId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl outline-none" placeholder="BUS-1001" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Device Key</label>
              <input value={deviceKey} onChange={(e) => setDeviceKey(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl outline-none" placeholder="(انسخه من لوحة الإدارة)" />
            </div>
          </div>
          <button 
            onClick={startPairing}
            className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xl hover:bg-blue-500"
          >
            ابدأ الربط الآن
          </button>
        </div>
      )}

      {step === 'SCANNING' && (
        <div className="text-center">
          <div className="w-64 h-64 border-4 border-blue-500 rounded-3xl relative overflow-hidden mb-8 mx-auto">
            <div className="absolute top-0 w-full h-1 bg-blue-500 animate-bounce"></div>
            <div className="flex items-center justify-center h-full bg-gray-800">
               <LucideQrCode className="w-32 h-32 text-gray-700 opacity-50" />
            </div>
          </div>
          <h2 className="text-2xl font-bold animate-pulse">جاري فحص الرمز...</h2>
          <p className="text-gray-500 mt-2">يرجى الانتظار</p>
        </div>
      )}

      {step === 'SUCCESS' && (
        <div className="text-center">
          <LucideCheckCircle className="w-32 h-32 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-green-400">تم الربط بنجاح</h2>
          <p className="text-gray-400 mt-2">تم تفعيل الجهاز: {validatorId}</p>
        </div>
      )}
    </div>
  );
};

export default PairingView;
