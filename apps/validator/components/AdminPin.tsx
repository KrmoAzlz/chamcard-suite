
import React, { useState } from 'react';
import { LucideLock, LucideDelete } from 'lucide-react';

interface AdminPinProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const AdminPin: React.FC<AdminPinProps> = ({ onConfirm, onCancel }) => {
  const [pin, setPin] = useState('');
  const REQUIRED_PIN = '1234';

  const addDigit = (d: string) => {
    if (pin.length < 4) {
      const newPin = pin + d;
      setPin(newPin);
      if (newPin === REQUIRED_PIN) {
        onConfirm();
      }
    }
  };

  const removeDigit = () => setPin(prev => prev.slice(0, -1));

  return (
    <div className="h-full w-full bg-gray-950 p-8 flex flex-col items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-gray-800 rounded-full mb-4">
            <LucideLock className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold">لوحة الإدارة</h2>
          <p className="text-gray-500">أدخل رمز المرور</p>
        </div>

        <div className="flex justify-center gap-4 mb-10">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 border-gray-700 ${pin.length >= i ? 'bg-blue-500 border-blue-500' : ''}`}></div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button 
              key={n}
              onClick={() => addDigit(n.toString())}
              className="h-16 bg-gray-800 hover:bg-gray-700 rounded-2xl text-2xl font-bold active:scale-95 transition-transform"
            >
              {n}
            </button>
          ))}
          <button onClick={onCancel} className="h-16 bg-red-900/30 text-red-500 font-bold rounded-2xl">إلغاء</button>
          <button onClick={() => addDigit('0')} className="h-16 bg-gray-800 hover:bg-gray-700 rounded-2xl text-2xl font-bold active:scale-95 transition-transform">0</button>
          <button onClick={removeDigit} className="h-16 bg-gray-800 flex items-center justify-center rounded-2xl"><LucideDelete /></button>
        </div>
      </div>
    </div>
  );
};

export default AdminPin;
