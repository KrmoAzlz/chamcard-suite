
import React, { useState, useEffect } from 'react';
import { User, AuditLog, Role } from '../types';
import { analyzeAuditLogs } from '../services/geminiService';
import { getTodayStats, listTransactions, searchCards, blockCard, unblockCard, createValidator, listValidators, listFares, setDefaultFare } from '../services/api';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'finance' | 'ops' | 'security'>('audit');

  // Ops states (real data from API)
  const [opsStats, setOpsStats] = useState<any>(null);
  const [opsTx, setOpsTx] = useState<any[]>([]);
  const [cardQ, setCardQ] = useState<string>('');
  const [cards, setCards] = useState<any[]>([]);
  const [validators, setValidators] = useState<any[]>([]);
  const [fares, setFares] = useState<any[]>([]);
  const [defaultFareId, setDefaultFareId] = useState<string>('');

  useEffect(() => {
    if (activeTab !== 'ops') return;
    let cancelled = false;

    const load = async () => {
      const [s, t, v, f] = await Promise.all([
        getTodayStats(),
        listTransactions(),
        listValidators(),
        listFares()
      ]);
      if (cancelled) return;
      if (s?.ok) setOpsStats(s);
      if (t?.ok) setOpsTx(t.items || []);
      if (v?.ok) setValidators(v.validators || []);
      if (f?.ok) {
        setFares(f.fares || []);
        setDefaultFareId(f.defaultFareId || '');
      }
    };

    load();
    const id = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [activeTab]);

  useEffect(() => {
    // تسجيل الدخول الناجح في السجل
    const initialLog: AuditLog = {
      id: 'SEC-' + Date.now(),
      timestamp: Date.now(),
      userId: user.id,
      username: user.username,
      action: 'إصدار جلسة إدارية',
      category: 'SECURITY',
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      details: `تم منح صلاحيات ${user.role} بعد تجاوز 2FA`
    };
    setLogs([initialLog]);
  }, [user]);

  const addSensitiveLog = (action: string, details: string, category: AuditLog['category']) => {
    // تطبيق RBAC على مستوى الوظيفة (API Level Logic)
    if (category === 'FINANCE' && user.role !== Role.FINANCE && user.role !== Role.SUPER_ADMIN) {
      alert('خطأ أمني: ليس لديك صلاحيات مالية لتنفيذ هذا الإجراء.');
      return;
    }

    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: Date.now(),
      userId: user.id,
      username: user.username,
      action,
      category,
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      details
    };
    setLogs(prev => [newLog, ...prev]);
    alert(`تم التوثيق: ${action}`);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 font-sans text-slate-300" dir="rtl">
      {/* Sidebar - العمارة الأمنية */}
      <div className="w-80 bg-slate-900 flex flex-col border-l border-slate-800 shadow-2xl">
        <div className="p-10 border-b border-slate-800">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/20 border border-white/10">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight">درع الإدارة</h1>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">النسخة النهائية V5.0</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-8 space-y-3">
          <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center space-x-4 space-x-reverse px-6 py-4 rounded-2xl transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span className="font-bold">سجل المراجعة</span>
          </button>
          
          <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center space-x-4 space-x-reverse px-6 py-4 rounded-2xl transition-all ${activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span className="font-bold">العمليات المالية</span>
          </button>

          <button onClick={() => setActiveTab('ops')} className={`w-full flex items-center space-x-4 space-x-reverse px-6 py-4 rounded-2xl transition-all ${activeTab === 'ops' ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18M7 14l3-3 4 4 6-8"/></svg>
            <span className="font-bold">تشغيل النظام</span>
          </button>

          <button onClick={() => setActiveTab('security')} className={`w-full flex items-center space-x-4 space-x-reverse px-6 py-4 rounded-2xl transition-all ${activeTab === 'security' ? 'bg-red-600 text-white shadow-xl' : 'hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span className="font-bold">إعدادات الحماية</span>
          </button>
        </nav>

        <div className="p-8 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-4 space-x-reverse mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`} alt="Admin" />
            </div>
            <div>
              <p className="text-white text-sm font-black">{user.username}</p>
              <p className="text-[10px] text-indigo-400 font-bold uppercase">{user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center space-x-3 space-x-reverse py-4 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all text-xs font-black border border-red-500/20">
            <span>إغلاق الجلسة الآمنة</span>
          </button>
        </div>
      </div>

      {/* Main Framework */}
      <div className="flex-1 flex flex-col">
        <header className="bg-slate-900 border-b border-slate-800 h-24 px-12 flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h2 className="text-2xl font-black text-white">
              {activeTab === 'audit' && 'سجل المراجعة الصارم'}
              {activeTab === 'finance' && 'بوابة العمليات المالية'}
              {activeTab === 'ops' && 'تشغيل النظام (Live)'}
              {activeTab === 'security' && 'مركز التحكم الأمني'}
            </h2>
          </div>
          <div className="flex items-center space-x-6 space-x-reverse">
            <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 space-x-reverse">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>خادم مشفر AES-256</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12">
          {activeTab === 'audit' && (
            <div className="space-y-8">
              <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="px-10 py-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <h3 className="font-black text-white flex items-center space-x-3 space-x-reverse">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <span>سجلات الجلسة الحالية</span>
                  </h3>
                  <button onClick={async () => {
                    setIsAnalyzing(true);
                    setAiAnalysis(await analyzeAuditLogs(logs));
                    setIsAnalyzing(false);
                  }} className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-6 py-3 rounded-xl hover:bg-indigo-500/20 transition-all border border-indigo-500/20">
                    {isAnalyzing ? 'جاري فحص الأنماط...' : 'تحليل أمني بالذكاء الاصطناعي'}
                  </button>
                </div>
                
                {aiAnalysis && (
                  <div className="p-10 bg-indigo-600/5 text-indigo-100 text-sm font-bold leading-loose border-b border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center space-x-3 space-x-reverse mb-4 text-indigo-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      <span className="text-lg">تحليل Gemini الأمني الفوري:</span>
                    </div>
                    {aiAnalysis}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-950 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-10 py-5">المسؤول</th>
                        <th className="px-10 py-5">الإجراء</th>
                        <th className="px-10 py-5">الفئة</th>
                        <th className="px-10 py-5">الحالة</th>
                        <th className="px-10 py-5">الوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-10 py-6 text-sm font-bold text-white">{log.username}</td>
                          <td className="px-10 py-6 text-sm font-black text-indigo-400">{log.action}</td>
                          <td className="px-10 py-6">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${log.category === 'SECURITY' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {log.category}
                            </span>
                          </td>
                          <td className="px-10 py-6">
                            <span className="flex items-center space-x-2 space-x-reverse">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              <span className="text-xs font-bold text-slate-400">مؤكدة</span>
                            </span>
                          </td>
                          <td className="px-10 py-6 text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString('ar-EG')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="max-w-4xl space-y-8">
              <div className="bg-slate-900 p-12 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                <h3 className="text-3xl font-black text-white mb-8">إدارة الاعتمادات المالية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => addSensitiveLog('تعديل الميزانية', 'رفع حد المصروفات الشهرية', 'FINANCE')} className="p-8 bg-slate-950 border border-slate-800 rounded-3xl text-right hover:border-emerald-500/50 transition-all group">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1"/></svg>
                    </div>
                    <p className="text-white font-black text-lg mb-2">تعديل الميزانية الرئيسية</p>
                    <p className="text-slate-500 text-xs font-bold">يتطلب صلاحيات مسؤول مالي.</p>
                  </button>
                  <button onClick={() => addSensitiveLog('سحب طارئ', 'محاولة سحب سيولة للطوارئ', 'FINANCE')} className="p-8 bg-slate-950 border border-slate-800 rounded-3xl text-right hover:border-indigo-500/50 transition-all group">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </div>
                    <p className="text-white font-black text-lg mb-2">طلب سحب سيولة طارئة</p>
                    <p className="text-slate-500 text-xs font-bold">يخضع لمراجعة المدير الخارق.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ops' && (
            <div className="max-w-6xl space-y-8">
              <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                <h3 className="text-3xl font-black text-white mb-6">لوحة التشغيل (مباشر)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                    <p className="text-slate-500 text-xs font-bold">دخل اليوم</p>
                    <p className="text-white text-3xl font-black mt-2">{opsStats ? (opsStats.income ?? 0) : 0}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                    <p className="text-slate-500 text-xs font-bold">عدد الرحلات</p>
                    <p className="text-white text-3xl font-black mt-2">{opsStats ? (opsStats.rides ?? 0) : 0}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                    <p className="text-slate-500 text-xs font-bold">أجهزة فعّالة</p>
                    <p className="text-white text-3xl font-black mt-2">{opsStats ? (opsStats.activeValidators ?? 0) : 0}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                    <p className="text-slate-500 text-xs font-bold">التاريخ</p>
                    <p className="text-white text-xl font-black mt-2 font-mono">{opsStats ? (opsStats.date ?? '-') : '-'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
                  <h4 className="text-xl font-black text-white mb-4">التعرفة + الأجهزة</h4>
                  <div className="flex gap-3 items-end mb-6">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">التعرفة الافتراضية</label>
                      <select value={defaultFareId} onChange={(e) => setDefaultFareId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 outline-none">
                        {fares.map((f: any) => (
                          <option key={f.id} value={f.id}>{f.name} — {f.amount}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={async () => {
                        await setDefaultFare(defaultFareId);
                        addSensitiveLog('تعديل التعرفة الافتراضية', `DefaultFare=${defaultFareId}`, 'SECURITY');
                      }}
                      className="px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500"
                    >
                      حفظ
                    </button>
                  </div>

                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={async () => {
                        const r = await createValidator({});
                        if (r?.ok) {
                          addSensitiveLog('إنشاء جهاز باص', `ValidatorId=${r.validator.id}`, 'SECURITY');
                        }
                      }}
                      className="px-6 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-black hover:border-indigo-500/50"
                    >
                      إضافة جهاز باص
                    </button>
                    <span className="text-xs text-slate-500 flex items-center">انسخ (Validator ID + Device Key) وضعهم داخل تطبيق الباص</span>
                  </div>

                  <div className="space-y-3">
                    {validators.length === 0 ? (
                      <div className="text-slate-600 text-sm">لا توجد أجهزة بعد.</div>
                    ) : validators.map((v: any) => (
                      <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-black">{v.name} <span className="text-slate-500 font-mono text-xs">({v.id})</span></p>
                            <p className="text-xs text-slate-500">Route: {v.route} — Fare: {v.fareId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500">Device Key</p>
                            <p className="text-xs font-mono text-indigo-400 break-all max-w-[220px]">{v.deviceKey}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
                  <h4 className="text-xl font-black text-white mb-4">البطاقات: بحث / حظر / فك حظر</h4>
                  <div className="flex gap-3 mb-4">
                    <input value={cardQ} onChange={(e) => setCardQ(e.target.value)} placeholder="UID / status / ملاحظة" className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 outline-none" />
                    <button
                      onClick={async () => {
                        const r = await searchCards(cardQ || '');
                        if (r?.ok) setCards(r.cards || []);
                      }}
                      className="px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500"
                    >
                      بحث
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
                    {cards.length === 0 ? (
                      <div className="text-slate-600 text-sm">اكتب UID واضغط بحث.</div>
                    ) : cards.map((c: any) => (
                      <div key={c.uid} className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-white font-black font-mono">{c.uid}</p>
                          <p className="text-xs text-slate-500">Status: <span className={c.status === 'blocked' ? 'text-red-500' : 'text-emerald-500'}>{c.status}</span></p>
                        </div>
                        <div className="flex gap-2">
                          {c.status === 'blocked' ? (
                            <button
                              onClick={async () => {
                                const reason = prompt('سبب فك الحظر؟') || '';
                                const r = await unblockCard(c.uid, reason);
                                if (r?.ok) {
                                  addSensitiveLog('فك حظر بطاقة', `UID=${c.uid}`, 'SECURITY');
                                  const rr = await searchCards(cardQ || '');
                                  if (rr?.ok) setCards(rr.cards || []);
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-500 text-sm"
                            >
                              فك الحظر
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                const reason = prompt('سبب الحظر؟') || '';
                                const r = await blockCard(c.uid, reason);
                                if (r?.ok) {
                                  addSensitiveLog('حظر بطاقة', `UID=${c.uid}`, 'SECURITY');
                                  const rr = await searchCards(cardQ || '');
                                  if (rr?.ok) setCards(rr.cards || []);
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-red-600 text-white font-black hover:bg-red-500 text-sm"
                            >
                              حظر
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                <h4 className="text-xl font-black text-white mb-4">عمليات اليوم (آخر 500)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-slate-500 text-xs font-black uppercase tracking-wider">
                        <th className="px-6 py-3">الوقت</th>
                        <th className="px-6 py-3">الجهاز</th>
                        <th className="px-6 py-3">الطريقة</th>
                        <th className="px-6 py-3">المبلغ</th>
                        <th className="px-6 py-3">UID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {opsTx.map((t: any) => (
                        <tr key={t.id} className="hover:bg-white/5">
                          <td className="px-6 py-4 text-xs font-mono text-slate-400">{new Date(t.createdAt).toLocaleTimeString('ar-EG')}</td>
                          <td className="px-6 py-4 text-sm font-black text-white">{t.validatorId}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">{t.method}</td>
                          <td className="px-6 py-4 text-sm font-black text-emerald-400">{t.amount}</td>
                          <td className="px-6 py-4 text-xs font-mono text-indigo-300">{t.cardUid || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-4xl space-y-10">
              <div className="bg-red-500/5 p-12 rounded-[3rem] border border-red-500/20 shadow-2xl">
                <h3 className="text-2xl font-black text-red-500 mb-8 flex items-center space-x-3 space-x-reverse">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  <span>بروتوكولات الإغلاق النهائي</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => addSensitiveLog('إغلاق شامل', 'تفعيل بروتوكول الإغلاق التلقائي', 'SECURITY')} className="p-10 bg-red-600 text-white rounded-[2rem] font-black hover:bg-red-700 transition-all shadow-2xl shadow-red-600/20 text-xl">
                    تفعيل إغلاق النظام الشامل
                  </button>
                  <button onClick={() => addSensitiveLog('حظر IPs', 'تصفير قائمة العناوين الموثوقة', 'SECURITY')} className="p-10 bg-slate-950 text-red-500 border border-red-500/20 rounded-[2rem] font-black hover:bg-red-500/10 transition-all text-xl">
                    حظر كافة المداخل الخارجية
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
