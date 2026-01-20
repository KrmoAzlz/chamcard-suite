
import React from 'react';

const PublicHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-black text-slate-900 italic tracking-tighter">درع الإدارة</h1>
        <div className="hidden md:flex space-x-8 space-x-reverse text-sm font-black text-slate-600">
          <a href="#" className="hover:text-indigo-600 transition-colors">المميزات</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">الأسعار</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">التوثيق</a>
          <a href="#/admin" className="px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">بوابة الإدارة</a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl">
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-8">
            الجيل القادم من <span className="text-indigo-600">أمن لوحات الإدارة.</span>
          </h2>
          <p className="text-xl text-slate-500 mb-10 leading-relaxed font-medium">
            حماية متعددة الطبقات مصممة للبنى التحتية الحساسة. صلاحيات الأدوار، التحقق الثنائي، وسجلات العمليات المدعومة بالذكاء الاصطناعي متوفرة افتراضياً.
          </p>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 md:space-x-reverse justify-center">
            <button className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-200 hover:scale-105 transition-transform">
              ابدأ الآن مجاناً
            </button>
            <button className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 font-black rounded-2xl hover:border-indigo-100 transition-all">
              شاهد العرض التوضيحي
            </button>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-slate-400 text-xs font-black uppercase tracking-widest leading-loose">
        &copy; 2024 جميع الحقوق محفوظة لأنظمة الدرع الآمن. صُمم للبيئات عالية الحماية.
      </footer>
    </div>
  );
};

export default PublicHome;
