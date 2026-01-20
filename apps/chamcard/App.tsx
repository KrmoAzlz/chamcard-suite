
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, CreditCard, MapPin, User, QrCode, MessageCircle, 
  ArrowLeft, Wallet, Send, RefreshCw, CheckCircle2, QrCode as QrIcon,
  Search, Smartphone, Wifi, CreditCard as CardIcon, ShieldCheck,
  Zap, Camera, Loader2, Info, Copy, Share2, Image as ImageIcon,
  CheckCircle, XCircle, Clock, ChevronLeft
} from 'lucide-react';
import { View, Card, AuthSession, AppAction, SystemState, RechargeRequest } from './types';
import { authStore } from './store/authStore';
import { rechargeService } from './services/rechargeService';

import BalanceCard from './components/BalanceCard';
import QuickActions from './components/QuickActions';
import CardList from './components/CardList';
import Campaigns from './components/Campaigns';
import AIAssistant from './components/AIAssistant';
import TransportMap from './components/TransportMap';
import Profile from './components/Profile';
import Toast from './components/Toast';
import Auth from './components/Auth';
import CardInspector from './components/CardInspector';
import SecurityCenter from './components/SecurityCenter';

// الصورة الأصلية التي قدمها المستخدم (الباركود مع الشعار مدمجين)
const ORIGINAL_QR_IMAGE = "https://images2.imgbox.com/6c/f5/lYn1Qe4c_o.png";

const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(() => authStore.getSession());
  const [activeView, setActiveView] = useState<View>('home');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<{ from: string, to: string } | null>(null);
  
  // Recharge Flow States
  const [topupStep, setTopupStep] = useState<'info' | 'upload' | 'confirm'>('info');
  const [rechargeAmount, setRechargeAmount] = useState('5000');
  const [receiptImg, setReceiptImg] = useState<string | null>(null);
  const [referenceNo, setReferenceNo] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [system, setSystem] = useState<SystemState>({
    isBusy: false,
    busyAction: null,
    nfcStatus: 'IDLE',
    isOnline: navigator.onLine
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const [showAI, setShowAI] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  
  const [cards, setCards] = useState<Card[]>(() => {
    const saved = localStorage.getItem('user_cards');
    return saved ? JSON.parse(saved) : [
      { 
        id: '1', 
        alias: 'بطاقتي الشخصية', 
        cardNumber: '9630 1122 3344 8822', 
        balance: 45200, 
        type: 'digital',
        themeColor: 'emerald',
        subscription: { active: true, remainingRides: 85, totalRides: 100, expiryDate: Date.now() + 2592000000 }
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('user_cards', JSON.stringify(cards));
  }, [cards]);
  const triggerToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const RECEIVER_LONG_ID = "f165bd2f32805f90dc8f21ace8e86f6415";
  const RECEIVER_SHORT_ID = "6f6415";

  const pickReceiptFile = () => {
    const el = document.getElementById("receipt_file_input") as HTMLInputElement | null;
    el?.click();
  };

  const onReceiptFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      triggerToast('الملف لازم يكون صورة', 'error');
      e.target.value = '';
      return;
    }
    const maxBytes = 3 * 1024 * 1024; // 3MB
    if (file.size > maxBytes) {
      triggerToast('الصورة كبيرة. حاول ضغطها (حد 3MB).', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImg(String(reader.result || ''));
    };
    reader.onerror = () => triggerToast('فشل قراءة الصورة', 'error');
    reader.readAsDataURL(file);
  };


  const dispatchAction = useCallback(async (action: AppAction) => {
    if (system.isBusy) return;
    switch (action) {
      case 'PAY_QR': setActiveView('qr_payment'); break;
      case 'INSPECT_NFC': setShowInspector(true); setSystem(p => ({...p, nfcStatus: 'READY'})); break;
      case 'TOP_UP_BALANCE': setTopupStep('info'); setActiveView('topup'); break;
      case 'TRANSFER_FUNDS': setActiveView('transfer'); break;
      case 'MANAGE_SUBSCRIPTION': setActiveView('subscription'); break;
      case 'NAVIGATE_HOME': setActiveView('home'); break;
      case 'NAVIGATE_CARDS': setActiveView('cards'); break;
      case 'NAVIGATE_TRANSPORT': setActiveView('transport'); break;
      case 'NAVIGATE_PROFILE': setActiveView('profile'); break;
      case 'NAVIGATE_ADMIN_REQUESTS': setActiveView('admin_requests'); break;
      case 'GOTO_SECURITY': setActiveView('security'); break;
      case 'PERFORM_LOGOUT': authStore.clearSession(); setSession(null); setActiveView('home'); break;
    }
  }, [system.isBusy]);

  const ActionView = ({ title, subtitle, icon, children, onConfirm, confirmText = "تأكيد العملية", hideConfirm = false, onBack }: any) => (
    <div className="p-8 animate-in slide-in-from-bottom duration-500 pt-16 flex flex-col min-h-screen">
      <button onClick={onBack || (() => setActiveView('home'))} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-8"><ArrowLeft className="rotate-180 dark:text-white" /></button>
      <div className="flex items-center gap-6 mb-12">
        <div className="w-20 h-20 bg-emerald-600/10 text-emerald-600 rounded-[30px] flex items-center justify-center shrink-0">{icon}</div>
        <div className="text-right">
          <h2 className="text-3xl font-black dark:text-white leading-tight">{title}</h2>
          <p className="text-slate-400 font-bold mt-1 text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1 space-y-8">{children}</div>
      {!hideConfirm && (
        <div className="mt-12 pb-10">
          <button onClick={onConfirm} className="w-full bg-emerald-600 text-white font-black py-6 rounded-[32px] shadow-2xl active:scale-95 transition-all text-xl">{confirmText}</button>
        </div>
      )}
    </div>
  );

  const renderView = () => {
    switch(activeView) {
      case 'topup':
        if (topupStep === 'info') {
          return (
            <div className="bg-[#121831] min-h-screen p-8 text-center animate-in fade-in flex flex-col pt-12" dir="rtl">
               {/* Header */}
               <div className="flex items-center justify-between mb-16">
                  <div className="w-10"></div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">استقبال</h2>
                  <button onClick={() => setActiveView('home')} className="text-white p-2">
                    <ChevronLeft size={28} className="rotate-180" />
                  </button>
               </div>

               {/* EXACT ORIGINAL IMAGE CONTAINER */}
               <div className="relative mx-auto w-full max-w-[320px] mb-12 animate-in zoom-in duration-700">
                  <div className="bg-white rounded-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col items-center">
                     {/* IMAGE AS PROVIDED BY THE USER - NO MODIFICATIONS */}
                     <img 
                       src={ORIGINAL_QR_IMAGE} 
                       alt="ShamCash Official QR" 
                       className="w-full h-auto object-contain"
                     />
                  </div>
               </div>

               {/* ID Text Section */}
               <div className="text-center space-y-1 mb-12 px-4">
                  <p className="text-white text-[16px] font-medium break-all tracking-tight leading-none opacity-90">
                    {RECEIVER_LONG_ID}
                  </p>
                  <p className="text-white text-[16px] font-medium opacity-90">{RECEIVER_SHORT_ID}</p>
               </div>

               {/* Action Buttons */}
               <div className="flex justify-center gap-16 mb-12">
                  <button
                    onClick={async () => {
                      const payload = `chamcard://topup?to=SHAMCASH&accountId=${RECEIVER_SHORT_ID}`;
                      if (navigator.share) {
                        try {
                          await navigator.share({ title: 'ChamCard Top-Up', text: RECEIVER_SHORT_ID, url: payload });
                        } catch {
                          // ignore
                        }
                      } else {
                        await navigator.clipboard.writeText(RECEIVER_SHORT_ID);
                        triggerToast('تم نسخ المعرف (ID) للمشاركة', 'success');
                      }
                    }}
                    className="text-white hover:scale-110 active:scale-90 transition-all duration-300"
                    aria-label="مشاركة"
                  >
                    <Share2 size={32} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(RECEIVER_SHORT_ID);
                      triggerToast('تم نسخ المعرف بنجاح', 'success');
                    }}
                    className="text-white hover:scale-110 active:scale-90 transition-all duration-300"
                    aria-label="نسخ"
                  >
                    <Copy size={32} strokeWidth={2.5} />
                  </button>
               </div>

               {/* Bottom Link Button */}
               <div className="mt-auto pb-10 px-4">
                  <button 
                    onClick={() => setTopupStep('upload')}
                    className="w-full bg-white/5 border border-white/10 text-white font-black py-6 rounded-[28px] text-lg active:scale-95 transition-all backdrop-blur-md shadow-2xl"
                  >
                    أرسلت المبلغ، ارفع الإشعار
                  </button>
               </div>
            </div>
          );
        }

        if (topupStep === 'upload') {
          return (
            <ActionView 
              onBack={() => setTopupStep('info')}
              title="إثبات الدفع" 
              subtitle="يرجى إدخال المبلغ وصورة إشعار شام كاش" 
              icon={<ImageIcon />} 
              hideConfirm
            >
               <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border-2 border-slate-100 dark:border-slate-700">
                     <p className="text-[10px] font-black text-slate-400 mb-4 uppercase">المبلغ المرسل (ل.س)</p>
                     <input 
                       type="number" 
                       value={rechargeAmount}
                       onChange={e => setRechargeAmount(e.target.value)}
                       className="w-full text-center text-4xl font-black bg-transparent outline-none dark:text-white"
                     />
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border-2 border-slate-100 dark:border-slate-700">
                     <p className="text-[10px] font-black text-slate-400 mb-4 uppercase">رقم المرجع / رقم العملية (اختياري لكنه أفضل)</p>
                     <input
                       type="text"
                       value={referenceNo}
                       onChange={e => setReferenceNo(e.target.value)}
                       placeholder="مثال: 123456789"
                       className="w-full text-center text-lg font-black bg-transparent outline-none dark:text-white"
                     />
                  </div>

                  <input
                    id="receipt_file_input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onReceiptFileChange}
                  />

                  {!receiptImg ? (
                    <button
                      onClick={pickReceiptFile}
                      className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-900 rounded-[40px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-300 dark:border-slate-700"
                    >
                       <Camera size={48} className="text-slate-400" />
                       <span className="text-sm font-black text-slate-500">ارفع صورة إشعار الإرسال (من الجهاز)</span>
                    </button>
                  ) : (
                    <div className="relative rounded-[40px] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                       <img src={receiptImg} className="w-full h-auto" />
                       <button onClick={() => setReceiptImg(null)} className="absolute top-4 right-4 bg-red-600 text-white p-3 rounded-full"><XCircle size={24} /></button>
                    </div>
                  )}

                  <button 
                    disabled={!receiptImg || !rechargeAmount || parseInt(rechargeAmount) <= 0}
                    onClick={() => {
                      const amt = parseInt(rechargeAmount);
                      if (!amt || amt <= 0) {
                        triggerToast('أدخل مبلغ صحيح', 'error');
                        return;
                      }
                      rechargeService.submitRequest({
                        userId: session?.user.phone || 'unknown',
                        userName: session?.user.fullName || 'User',
                        amount: amt,
                        receiptImage: receiptImg || '',
                        referenceNo: referenceNo.trim() || undefined
                      });
                      setReferenceNo('');
                      setTopupStep('confirm');
                    }}
                    className="w-full bg-emerald-600 text-white font-black py-6 rounded-[32px] text-xl disabled:opacity-50 shadow-xl"
                  >
                    إرسال الطلب للإدارة
                  </button>
               </div>
            </ActionView>
          );
        }

        if (topupStep === 'confirm') {
          return (
            <div className="p-8 pt-24 text-center animate-in zoom-in duration-500 flex flex-col min-h-screen">
               <div className="w-32 h-32 bg-amber-500 rounded-[48px] flex items-center justify-center mx-auto mb-10 shadow-2xl relative">
                  <div className="absolute inset-0 bg-amber-500 rounded-[48px] animate-ping opacity-20"></div>
                  <Clock size={64} className="text-white" />
               </div>
               <h2 className="text-4xl font-black dark:text-white mb-2">طلبك قيد المراجعة</h2>
               <p className="text-slate-400 font-bold mb-12 px-6">سوف نرسل لك إشعاراً فور قبول الطلب وتعبئة رصيدك بمبلغ {rechargeAmount} ل.س</p>
               <button onClick={() => setActiveView('home')} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-6 rounded-[32px] text-xl mt-auto mb-10">العودة للرئيسية</button>
            </div>
          );
        }
        return null;

      case 'admin_requests':
        return (
          <div className="p-6 pt-16 flex flex-col min-h-screen">
             <div className="flex justify-between items-center mb-10">
                <button onClick={() => setActiveView('home')} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"><ArrowLeft className="rotate-180 dark:text-white" /></button>
                <h2 className="text-2xl font-black dark:text-white">طلبات شحن المعلقة</h2>
             </div>
             <div className="space-y-4">
                {rechargeService.getRequests().filter(r => r.status === 'pending').map(req => (
                  <div key={req.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                     <div className="flex justify-between mb-4">
                        <div className="text-right">
                           <p className="font-black dark:text-white">{req.userName}</p>
                           <p className="text-[10px] text-slate-400">{req.userId}</p>
                           {req.referenceNo && (
                             <p className="text-[10px] text-slate-400">مرجع: {req.referenceNo}</p>
                           )}
                           <p className="text-[10px] text-slate-400">{new Date(req.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="text-xl font-black text-emerald-600">{req.amount.toLocaleString()} ل.س</p>
                     </div>
                     <img src={req.receiptImage} className="w-full h-48 object-cover rounded-2xl mb-4 border border-slate-100" />
                     <div className="flex gap-3">
                        <button onClick={() => { rechargeService.updateStatus(req.id, 'approved'); triggerToast('تم القبول', 'success'); setActiveView('admin_requests'); }} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl">موافقة</button>
                        <button onClick={() => { rechargeService.updateStatus(req.id, 'rejected'); triggerToast('تم الرفض', 'error'); setActiveView('admin_requests'); }} className="flex-1 bg-red-50 text-red-600 font-bold py-3 rounded-xl">رفض</button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6 pb-36">
             <header className="px-6 pt-14 flex justify-between items-center">
                <div className="flex items-center gap-4 text-right">
                   <img src={session?.user.avatar} className="w-12 h-12 rounded-2xl border-2 border-emerald-500 shadow-lg" alt="avatar" />
                   <div><h1 className="text-xl font-black dark:text-white">أهلاً، {session?.user.fullName.split(' ')[0]}</h1></div>
                </div>
                <div className="flex gap-2">
                   {session?.role === 'admin' && (
                     <button onClick={() => setActiveView('admin_requests')} className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm relative">
                        <ShieldCheck size={24} />
                        {rechargeService.getPendingCount() > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{rechargeService.getPendingCount()}</span>
                        )}
                     </button>
                   )}
                   <button onClick={() => setShowAI(true)} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><MessageCircle /></button>
                </div>
             </header>
             <BalanceCard card={cards[0]} dispatch={dispatchAction} getPermission={() => ({ allowed: true })} />
             <QuickActions dispatch={dispatchAction} getPermission={() => ({ allowed: true })} />
             <div className="px-6"><Campaigns compact /></div>
          </div>
        );
    }
  };

  if (!session) return <Auth onLogin={setSession} />;

  return (
    <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen relative overflow-hidden flex flex-col shadow-2xl" dir="rtl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main className="flex-1 relative overflow-y-auto no-scrollbar">{renderView()}</main>
      {!['security', 'qr_payment', 'topup', 'admin_requests'].includes(activeView) && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[92%] z-[100]">
          <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-2 rounded-[42px] shadow-xl flex justify-between items-center border border-white/40">
            <NavTab active={activeView === 'home'} icon={<Home />} label="الرئيسية" onClick={() => setActiveView('home')} />
            <NavTab active={activeView === 'cards'} icon={<CreditCard />} label="محفظتي" onClick={() => setActiveView('cards')} />
            <button onClick={() => setActiveView('qr_payment')} className="w-16 h-16 bg-emerald-600 rounded-[28px] text-white shadow-xl -mt-10 border-[4px] border-white dark:border-slate-950 flex items-center justify-center"><QrCode size={30} /></button>
            <NavTab active={activeView === 'transport'} icon={<MapPin />} label="خريطتي" onClick={() => setActiveView('transport')} />
            <NavTab active={activeView === 'profile'} icon={<User />} label="حسابي" onClick={() => setActiveView('profile')} />
          </nav>
        </div>
      )}
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
      {showInspector && <CardInspector onClose={() => setShowInspector(false)} nfcStatus={system.nfcStatus} setNfcStatus={(s) => setSystem(p => ({...p, nfcStatus: s}))} dispatch={dispatchAction} />}
    </div>
  );
};

const NavTab = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-1/5 h-12 transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
    {React.cloneElement(icon, { size: 22 })}
    {active && <span className="text-[8px] font-black mt-1">{label}</span>}
  </button>
);

export default App;
