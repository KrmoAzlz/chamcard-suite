
import React, { useState } from 'react';
import { DeviceConfig, Transaction } from '../types';
import { LucideX, LucideRefreshCcw, LucideBus, LucideCreditCard, LucidePower, LucideTrash2, LucideCheckCircle, LucidePlay, LucideSquare } from 'lucide-react';

interface AdminMenuProps {
  config: DeviceConfig;
  setConfig: (c: DeviceConfig) => void;
  transactions: Transaction[];
  onClose: () => void;
  onSync: () => void;
  onPairing: () => void;
  clearHistory: () => void;
}

const AdminMenu: React.FC<AdminMenuProps> = ({ config, setConfig, transactions, onClose, onSync, onPairing, clearHistory }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const totalIncome = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const pendingCount = transactions.filter(t => t.syncStatus === 'pending').length;

  const handleSync = () => {
    if (pendingCount === 0) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onSync();
    }, 2000);
  };

  const toggleTrip = () => {
    setConfig({ ...config, isTripActive: !config.isTripActive });
  };

  return (
    <div className="h-full w-full bg-gray-950 overflow-y-auto p-6 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black">إدارة الجهاز</h2>
        <button onClick={onClose} className="p-3 bg-gray-800 rounded-full hover:bg-gray-700"><LucideX /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Statistics & Trip Control */}
        <div className={`rounded-3xl p-6 shadow-xl transition-colors ${config.isTripActive ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold">حالة الرحلة</h3>
            <button 
              onClick={toggleTrip}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${config.isTripActive ? 'bg-red-500 hover:bg-red-400' : 'bg-green-600 hover:bg-green-500'}`}
            >
              {config.isTripActive ? <><LucideSquare className="w-4 h-4" /> إيقاف الرحلة</> : <><LucidePlay className="w-4 h-4" /> بدء الرحلة</>}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-4xl font-black">{transactions.length}</p>
              <p className="text-sm opacity-70">إجمالي الركاب</p>
            </div>
            <div>
              <p className="text-4xl font-black">{totalIncome}₺</p>
              <p className="text-sm opacity-70">إجمالي الدخل</p>
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-4">المزامنة (Cloud Sync)</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>العمليات المعلقة:</span>
              <span className="font-bold text-yellow-500">{pendingCount}</span>
            </div>
            <button 
              onClick={handleSync}
              disabled={isSyncing || pendingCount === 0}
              className="w-full bg-blue-500 hover:bg-blue-400 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <LucideRefreshCcw className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'جاري الإرسال...' : 'مزامنة مع السيرفر'}
            </button>
            <button 
              onClick={onPairing}
              className="w-full border border-gray-700 hover:bg-gray-800 py-3 rounded-xl font-bold transition-colors text-gray-400"
            >
              إعدادات الربط (Pairing)
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 mb-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LucideCreditCard className="text-blue-500" /> إعدادات التشغيل
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-500 mb-2">اسم الخط / الوجهة</label>
            <input 
              type="text" 
              value={config.routeName}
              onChange={(e) => setConfig({...config, routeName: e.target.value})}
              className="w-full bg-gray-950 border border-gray-800 p-4 rounded-2xl focus:border-blue-500 outline-none text-xl font-bold"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-2">التعرفة (Fare Amount)</label>
            <input 
              type="number" 
              value={config.fare}
              onChange={(e) => setConfig({...config, fare: parseFloat(e.target.value)})}
              className="w-full bg-gray-950 border border-gray-800 p-4 rounded-2xl focus:border-blue-500 outline-none text-xl font-bold"
            />
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">سجل العمليات اليومي</h3>
          <button 
            onClick={clearHistory}
            className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm transition-colors"
          >
            <LucideTrash2 className="w-4 h-4" /> تنظيف العمليات المزامنة
          </button>
        </div>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-2xl">
              <LucideBus className="w-12 h-12 text-gray-800 mx-auto mb-2" />
              <p className="text-gray-600">لا توجد عمليات مسجلة</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="bg-gray-950 p-4 rounded-2xl flex items-center justify-between border border-gray-800/50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${tx.syncStatus === 'synced' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                    <LucideCheckCircle className={`w-5 h-5 ${tx.syncStatus === 'synced' ? 'text-green-500' : 'text-yellow-600'}`} />
                  </div>
                  <div>
                    <p className="font-bold font-mono text-sm">{tx.cardUid}</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-tighter">{tx.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-500 font-black">-{tx.amount}₺</p>
                  <p className="text-[10px] text-gray-600">{new Date(tx.timestamp).toLocaleTimeString('ar-EG')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-12">
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-red-900/10 text-red-500 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold border border-red-900/20 hover:bg-red-900/20"
        >
          <LucidePower className="w-5 h-5" /> إعادة تشغيل النظام (Reboot)
        </button>
      </div>
    </div>
  );
};

export default AdminMenu;
