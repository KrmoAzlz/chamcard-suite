
import React, { useState } from 'react';
import { X, Smartphone, Wifi, CreditCard, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '../types';
import { NFCService } from '../services/nfcService';

interface Props {
  onClose: () => void;
  onAdd: (card: Card) => void;
}

const AddCardModal: React.FC<Props> = ({ onClose, onAdd }) => {
  const [step, setStep] = useState<'selection' | 'scanning' | 'details'>('selection');
  const [cardType, setCardType] = useState<'digital' | 'physical'>('digital');
  const [loading, setLoading] = useState(false);
  const [alias, setAlias] = useState('');

  const handleDigitalInit = () => {
    setCardType('digital');
    setStep('details');
  };

  const handlePhysicalInit = async () => {
    setCardType('physical');
    setStep('scanning');
    setLoading(true);
    
    try {
      // Simulate NFC sequence
      const nfcCard = await NFCService.scanCard();
      if (nfcCard && nfcCard.status === 'uninitialized') {
        await NFCService.initializeNewCard(nfcCard.uid);
      }
      setLoading(false);
      setStep('details');
    } catch (e) {
      setLoading(false);
      setStep('selection');
    }
  };

  const handleFinalize = () => {
    const newCard: Card = {
      id: Math.random().toString(36).substr(2, 9),
      alias: alias || (cardType === 'digital' ? 'بطاقة رقمية' : 'بطاقة فيزيائية'),
      cardNumber: `9630 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
      balance: cardType === 'digital' ? 1000 : 0, // Welcome credit for digital
      type: cardType
    };
    onAdd(newCard);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[600] flex items-end justify-center backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[48px] p-8 animate-in slide-in-from-bottom duration-500 shadow-2xl relative">
        
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition"
        >
          <X size={20} />
        </button>

        <div className="text-right mt-4 mb-8">
          <h2 className="text-2xl font-black dark:text-white">إضافة بطاقة جديدة</h2>
          <p className="text-slate-400 font-bold text-sm mt-1">اختر الطريقة التي تفضلها للربط</p>
        </div>

        {step === 'selection' && (
          <div className="space-y-4">
            <button 
              onClick={handleDigitalInit}
              className="w-full group bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[32px] border-2 border-emerald-100 dark:border-emerald-800 flex items-center justify-between hover:bg-emerald-100 transition active:scale-[0.98]"
            >
              <ChevronRight className="text-emerald-300 group-hover:text-emerald-500 transition" />
              <div className="flex items-center gap-4 text-right">
                <div>
                  <h4 className="font-black text-emerald-900 dark:text-emerald-400">إصدار بطاقة رقمية</h4>
                  <p className="text-[10px] text-emerald-700/60 font-bold">جاهزة للاستخدام فوراً عبر QR</p>
                </div>
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <Smartphone size={28} />
                </div>
              </div>
            </button>

            <button 
              onClick={handlePhysicalInit}
              className="w-full group bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[32px] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100 transition active:scale-[0.98]"
            >
              <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition" />
              <div className="flex items-center gap-4 text-right">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200">ربط بطاقة فيزيائية</h4>
                  <p className="text-[10px] text-slate-400 font-bold">باستخدام تقنية NFC المدمجة</p>
                </div>
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                  <Wifi size={28} />
                </div>
              </div>
            </button>
          </div>
        )}

        {step === 'scanning' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
              <div className="relative w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-xl">
                <Wifi size={48} className="text-white animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black dark:text-white">جاري البحث عن بطاقة...</h3>
              <p className="text-sm text-slate-400 font-bold mt-2">ضع البطاقة خلف الهاتف وتحسس موقع الحساس</p>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="font-black text-lg dark:text-white">تم التحقق من البطاقة</h3>
                <p className="text-xs text-slate-400 font-bold">البطاقة جاهزة للربط بحسابك</p>
             </div>

             <div className="space-y-2 text-right">
                <label className="text-xs font-black text-slate-400 mr-4">تسمية البطاقة (اختياري)</label>
                <input 
                  type="text" 
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="مثال: بطاقة العمل"
                  className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-right dark:text-white"
                />
             </div>

             <button 
               onClick={handleFinalize}
               className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95 transition flex items-center justify-center gap-3"
             >
               إتمام الربط الآن
             </button>
          </div>
        )}

        <div className="h-10"></div>
      </div>
    </div>
  );
};

export default AddCardModal;
