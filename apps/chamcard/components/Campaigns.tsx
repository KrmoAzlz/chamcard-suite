
import React from 'react';
import { Gift, ChevronLeft } from 'lucide-react';

interface Props {
  compact?: boolean;
}

const Campaigns: React.FC<Props> = ({ compact = false }) => {
  const campaigns = [
    { 
      id: '1', 
      title: 'كاش باك 15% 🇸🇾', 
      desc: 'عند شحن رصيدك عبر سيريتل كاش', 
      img: 'https://picsum.photos/seed/syria1/400/200' 
    },
    { 
      id: '2', 
      title: 'باقة الطلاب الجديدة', 
      desc: 'سعر خاص للرحلات الجامعية بدمشق', 
      img: 'https://picsum.photos/seed/syria2/400/200' 
    },
    { 
      id: '3', 
      title: 'رحلة الجمعة مجانية!', 
      desc: 'استخدم البطاقة يوم الجمعة واحصل على رحلة هدية', 
      img: 'https://picsum.photos/seed/syria3/400/200' 
    }
  ];

  if (compact) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
        {campaigns.map(c => (
          <div key={c.id} className="min-w-[300px] bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden shrink-0 group cursor-pointer hover:shadow-md transition">
            <div className="relative h-36 overflow-hidden">
              <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">جديد</div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-center">
                <div className="text-right">
                  <h5 className="font-black text-gray-900 dark:text-white text-sm">{c.title}</h5>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-1">{c.desc}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800 transition">
                  <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-28">
      <h2 className="text-2xl font-black mb-4 dark:text-white">العروض والمكافآت</h2>
      {campaigns.map(c => (
        <div key={c.id} className="bg-white dark:bg-slate-800 rounded-[40px] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col group cursor-pointer">
          <img src={c.img} alt={c.title} className="h-56 w-full object-cover group-hover:scale-105 transition duration-700" />
          <div className="p-8">
            <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{c.title}</h4>
            <p className="text-gray-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">{c.desc}</p>
            <button className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-black py-4 rounded-3xl flex items-center justify-center gap-3 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition">
              التفاصيل والشروط
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Campaigns;
