
import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, ShieldCheck, X, History, Zap, AlertCircle } from 'lucide-react';
import { NFCStatus, AppAction, SmartCardData } from '../types';
import { NFCService } from '../services/nfcService';

interface CardInspectorProps {
  onClose: () => void;
  nfcStatus: NFCStatus;
  setNfcStatus: (status: NFCStatus) => void;
  dispatch: (action: AppAction) => void;
}

const CardInspector: React.FC<CardInspectorProps> = ({ onClose, nfcStatus, setNfcStatus, dispatch }) => {
  const [progress, setProgress] = useState(0);
  const [scannedData, setScannedData] = useState<SmartCardData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (nfcStatus === 'SCANNING' || nfcStatus === 'WRITING') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            finishOperation();
            return 100;
          }
          return prev + (nfcStatus === 'WRITING' ? 10 : 5);
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [nfcStatus]);

  const finishOperation = async () => {
    try {
      const data = await NFCService.scanCard();
      
      // منطق منع الشحن للبطاقات غير النشطة
      if (nfcStatus === 'WRITING' && data) {
        if (data.status !== 'active') {
          setErrorMsg(data.status === 'blocked' ? 'البطاقة محظورة ولا يمكن شحنها' : 'يجب تهيئة البطاقة أولاً');
          setNfcStatus('ERROR');
          return;
        }
        data.balance += 5000;
        // writeCard يعيد حساب CMAC تلقائياً لضمان سلامة الرصيد الجديد
        await NFCService.writeCard(data);
      }
      
      setScannedData(data);
      setNfcStatus('SUCCESS');
    } catch (e) {
      setErrorMsg('فشل التواصل مع الشريحة الذكية');
      setNfcStatus('ERROR');
    }
  };

  const handleReset = () => {
    setNfcStatus('READY');
    setProgress(0);
    setScannedData(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[500] flex items-center justify-center p-8 animate-in fade-in duration-300 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[48px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative border border-white/20">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center z-50 active:scale-90 transition-all border border-slate-100 dark:border-slate-700"
        >
          <X size={18} strokeWidth={3} />
        </button>

        <div className="p-8 pt-14 relative z-10 text-center">
          {nfcStatus === 'READY' && (
            <div className="space-y-6 animate-in zoom-in duration-500">
              <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping scale-150"></div>
                <div className="relative w-28 h-28 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                  <Wifi size={40} className="text-white animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">NFC مفعّل</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs leading-relaxed px-2">
                  قرب بطاقة الشام من الجهة الخلفية للهاتف للبدء
                </p>
              </div>

              <div className="grid gap-3">
                <button 
                  onClick={() => { setErrorMsg(null); dispatch('TRIGGER_SCAN'); }}
                  className="w-full bg-emerald-600 text-white font-black py-4 rounded-[22px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Smartphone size={20} /> فحص الرصيد
                </button>
                <button 
                  onClick={() => { setErrorMsg(null); dispatch('TRIGGER_WRITE'); }}
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-[22px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Zap size={20} /> شحن بـ 5,000 ل.س
                </button>
              </div>
            </div>
          )}

          {(nfcStatus === 'SCANNING' || nfcStatus === 'WRITING') && (
            <div className="flex flex-col items-center py-4 animate-in fade-in">
              <div className="relative w-52 h-52 flex items-center justify-center mb-8">
                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full rotate-[-90deg]">
                  <circle cx="100" cy="100" r="85" className="stroke-slate-50 dark:stroke-slate-800 fill-none" strokeWidth="10" />
                  <circle
                    cx="100" cy="100" r="85"
                    className={`${nfcStatus === 'WRITING' ? 'stroke-blue-500' : 'stroke-emerald-500'} fill-none transition-all duration-300`}
                    strokeWidth="10"
                    strokeDasharray={534}
                    strokeDashoffset={534 - (progress / 100) * 534}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center z-10">
                  <div className={`w-9 h-9 border-[4px] ${nfcStatus === 'WRITING' ? 'border-blue-500' : 'border-emerald-500'} border-b-transparent rounded-full animate-spin mb-3`}></div>
                  <span className={`text-4xl font-black tracking-tighter ${nfcStatus === 'WRITING' ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {progress}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-[22px] font-black text-slate-800 dark:text-white">
                  {nfcStatus === 'WRITING' ? 'جاري شحن الرصيد...' : 'جاري فحص البيانات...'}
                </h3>
                <p className="text-sm text-slate-400 font-bold">يرجى عدم تحريك البطاقة</p>
              </div>
            </div>
          )}

          {nfcStatus === 'SUCCESS' && scannedData && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 rounded-[32px] flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                 <ShieldCheck size={44} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">نجحت العملية</h3>
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-2">تم تحديث بيانات الشريحة بنجاح</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-[32px] p-6 text-right space-y-4 border border-slate-100 dark:border-slate-700/50">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-400">UID البطاقة</span>
                  <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">{scannedData.uid}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-400">الرصيد المحدث</span>
                  <span className="text-lg font-black text-emerald-600">{scannedData.balance.toLocaleString()} ل.س</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400">الحالة</span>
                  <span className={`text-sm font-bold ${scannedData.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {scannedData.status === 'active' ? 'نشطة' : (scannedData.status === 'blocked' ? 'محظورة' : 'غير مهيئة')}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition">إغلاق</button>
                <button onClick={handleReset} className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center active:scale-95 transition border border-slate-200 dark:border-slate-700"><History size={20} /></button>
              </div>
            </div>
          )}

          {nfcStatus === 'ERROR' && (
            <div className="space-y-6 animate-in zoom-in duration-300 py-10">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/20 rounded-[32px] flex items-center justify-center mx-auto text-rose-600">
                <AlertCircle size={44} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">فشل الإجراء</h3>
                <p className="text-sm text-rose-600 font-bold mt-2">{errorMsg || 'حدث خطأ غير متوقع'}</p>
              </div>
              <button onClick={handleReset} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black py-4 rounded-2xl active:scale-95 transition">المحاولة مرة أخرى</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardInspector;
