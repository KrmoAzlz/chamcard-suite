
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { MOCK_ADMIN_USER, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS } from '../constants';

interface AdminLoginProps {
  onLoginSuccess: (user: User) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // نستخدم الذاكرة لتتبع المحاولات الفاشلة بدلاً من التخزين الدائم لضمان "نظافة" المتصفح
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutUntil && Date.now() < lockoutUntil) {
      setError(`الحساب مقفل. حاول مجدداً بعد ${Math.ceil((lockoutUntil - Date.now()) / 1000)} ثانية.`);
      return;
    }

    // محاكاة نظام JWT + RBAC مشدد
    // يتم التحقق هنا وتوليد "تصريح" مؤقت في الذاكرة
    if (username === 'admin_master' && password === 'Shield@2025') {
      onLoginSuccess({ 
        ...MOCK_ADMIN_USER, 
        role: Role.SUPER_ADMIN, 
        sessionToken: 'jwt_secure_v5_' + Math.random().toString(36) 
      });
    } else if (username === 'finance_mgr' && password['Finance@2025' as any]) { // محاكاة لزيادة التعقيد
      onLoginSuccess({ 
        ...MOCK_ADMIN_USER, 
        username: 'مدير المالية', 
        role: Role.FINANCE, 
        sessionToken: 'jwt_finance_v5_' + Math.random().toString(36) 
      });
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      
      if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
        setError('تم قفل الوصول أمنياً بسبب محاولات مشبوهة.');
      } else {
        setError(`بيانات الوصول غير صحيحة. المحاولة ${nextAttempts} من ${MAX_LOGIN_ATTEMPTS}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full">
        <div className="bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800 p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          
          <div className="relative text-center mb-12">
            <div className="inline-flex p-6 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/30 mb-8 border border-white/10">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-1.571A9.06 9.06 0 0112 3c1.268 0 2.39.268 3.44.757m-9.44 8.571l9.44-8.571m-9.44 8.571a9.07 9.07 0 01-2.253-9.571m11.693 18.142A9.07 9.07 0 0015 3c-1.268 0-2.39.268-3.44.757m9.44 8.571l-9.44 8.571m9.44-8.571a9.07 9.07 0 002.253-9.571M15 13c0 1.105-.895 2-2 2s-2-.895-2-2 0-1.105 2-2 2 .895 2 2z"/></svg>
            </div>
            <h1 className="text-3xl font-black text-white mb-3">ولوج المسؤولين</h1>
            <p className="text-slate-500 font-bold text-sm tracking-wide">يرجى تقديم بيانات الاعتماد المشفرة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mr-2">هوية المسؤول</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-950 border-2 border-slate-800 focus:border-indigo-600 focus:outline-none transition-all font-bold text-white placeholder-slate-700"
                placeholder="Admin ID"
                disabled={!!lockoutUntil}
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mr-2">كلمة المرور المشفرة</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-950 border-2 border-slate-800 focus:border-indigo-600 focus:outline-none transition-all font-bold text-white placeholder-slate-700"
                placeholder="••••••••"
                disabled={!!lockoutUntil}
              />
            </div>

            {error && (
              <div className="p-5 bg-red-600/10 border-2 border-red-600/20 rounded-[1.5rem] text-red-500 text-xs font-black flex items-center space-x-3 space-x-reverse animate-pulse">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!!lockoutUntil}
              className={`w-full py-6 rounded-[1.5rem] font-black text-white shadow-2xl transition-all ${
                lockoutUntil ? 'bg-slate-800 cursor-not-allowed text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/40 active:scale-[0.98]'
              }`}
            >
              {lockoutUntil ? 'محظور أمنياً' : 'تأكيد الهوية والمصادقة'}
            </button>
          </form>
        </div>
        <p className="text-center text-slate-600 text-[10px] mt-10 font-black uppercase tracking-[0.5em]">
          PROTECTED BY QUANTUM SHIELD V5
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
