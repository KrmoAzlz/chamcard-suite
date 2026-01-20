
import React, { useState } from 'react';
import { SECURITY_GATEWAY_CREDS } from '../constants';

interface SecurityGatewayProps {
  onSuccess: () => void;
}

const SecurityGateway: React.FC<SecurityGatewayProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === SECURITY_GATEWAY_CREDS.user && password === SECURITY_GATEWAY_CREDS.pass) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4" dir="rtl">
      <div className="max-w-sm w-full bg-slate-800 rounded-lg p-8 border border-slate-700 shadow-2xl">
        <div className="flex items-center space-x-3 space-x-reverse mb-6">
          <div className="p-2 bg-amber-500/20 rounded">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">بوابة النظام الأمنية</h2>
        </div>
        
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          هذه المنطقة محمية بطبقة أمنية ثانوية. يرجى إدخال بيانات اعتماد البوابة.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">مستخدم البوابة</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">رمز الوصول (Token)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs font-bold">بيانات الوصول غير صالحة.</p>}
          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            تخطى الطبقة الأمنية
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest">بروتوكول الإدارة الآمن v4.0</p>
        </div>
      </div>
    </div>
  );
};

export default SecurityGateway;
