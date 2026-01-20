
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SecurityGateway from './components/SecurityGateway';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PublicHome from './pages/PublicHome';
import { SecurityState, User, Role } from './types';

const App: React.FC = () => {
  // الحالة الأمنية محفوظة في الذاكرة فقط (Volatile Memory) لضمان عدم بقائها في المتصفح
  const [securityState, setSecurityState] = useState<SecurityState>({
    isGatewayAuthenticated: false,
    isAuthenticated: false,
    isTwoFactorVerified: false,
    currentUser: null,
    failedAttempts: 0,
    isLockedOut: false
  });

  const handleGatewaySuccess = () => {
    setSecurityState(prev => ({ ...prev, isGatewayAuthenticated: true }));
  };

  const handleLoginSuccess = (user: User) => {
    setSecurityState(prev => ({ 
      ...prev, 
      isAuthenticated: true, 
      currentUser: user,
      isTwoFactorVerified: false // فرض البدء في الـ 2FA
    }));
  };

  const handle2FASuccess = () => {
    setSecurityState(prev => ({ ...prev, isTwoFactorVerified: true }));
  };

  const handleLogout = () => {
    setSecurityState({
      isGatewayAuthenticated: false,
      isAuthenticated: false,
      isTwoFactorVerified: false,
      currentUser: null,
      failedAttempts: 0,
      isLockedOut: false
    });
  };

  // حماية الطبقة الأولى (Gateway) لجميع المسارات
  if (!securityState.isGatewayAuthenticated) {
    return <SecurityGateway onSuccess={handleGatewaySuccess} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        
        <Route path="/admin/*" element={
          !securityState.isAuthenticated ? (
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          ) : !securityState.isTwoFactorVerified ? (
            <TwoFactorChallenge onVerify={handle2FASuccess} onCancel={handleLogout} />
          ) : (
            <AdminDashboard user={securityState.currentUser!} onLogout={handleLogout} />
          )
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

const TwoFactorChallenge: React.FC<{ onVerify: () => void, onCancel: () => void }> = ({ onVerify, onCancel }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // رمز ثابت للتجربة - في الواقع يتم التحقق منه عبر الـ API
    if (code === '123456') {
      onVerify();
    } else {
      setError('رمز التحقق غير صحيح. يرجى استخدام الرمز الصارم 123456.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4" dir="rtl">
      <div className="max-w-md w-full bg-slate-800 rounded-[2rem] shadow-2xl p-10 border border-indigo-500/20">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">تأكيد الهوية (2FA)</h2>
          <p className="text-slate-400 text-sm">أدخل الرمز المولد في تطبيق المصادقة الخاص بك لإصدار تصريح الوصول.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000 000"
              className="w-full text-center text-4xl tracking-[0.5em] py-5 bg-slate-950 border-2 border-slate-700 rounded-2xl text-indigo-400 focus:border-indigo-500 focus:outline-none transition-all font-mono"
              required
            />
            {error && <p className="text-red-500 text-xs mt-4 text-center font-black bg-red-500/10 py-2 rounded-lg">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
          >
            تحقق وإصدار الجلسة
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-slate-500 text-xs font-bold hover:text-slate-300 transition-colors"
          >
            إلغاء العملية والعودة للخلف
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
