
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Sparkles, MessageSquare, Lightbulb, Zap } from 'lucide-react';
import { getTransportAdvice } from '../services/geminiService';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

const AIAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'أهلاً بك! أنا شام. كيف فيني ساعدك بسرعة؟' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickSuggestions = [
    "كيف بشحن NFC؟",
    "باصات البرامكة",
    "دفع QR",
    "رصيد البطاقة"
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const botResponse = await getTransportAdvice(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "صار خطأ، جرب مرة تانية." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[500] flex flex-col max-w-md mx-auto animate-in slide-in-from-bottom duration-400 shadow-2xl">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-6 pt-10 flex items-center justify-between shadow-lg rounded-b-[32px] relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
            <Zap className="w-6 h-6 text-emerald-200 fill-emerald-200" />
          </div>
          <div>
            <h3 className="text-lg font-black leading-tight text-white">المساعد شام</h3>
            <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">ردود ذكية ومختصرة</p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition active:scale-90">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-950">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-[24px] text-sm font-bold shadow-sm animate-in fade-in slide-in-from-bottom-1 ${
              m.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-end">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-[20px] rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestions and Input */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
        {!loading && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            {quickSuggestions.map((s, i) => (
              <button 
                key={i}
                onClick={() => handleSend(s)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap active:scale-95 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اسأل شام..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-1 focus:ring-emerald-500 outline-none dark:text-white"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="bg-emerald-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-50 active:scale-90 transition-all shadow-md"
          >
            <Send className="w-5 h-5 rotate-180" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
