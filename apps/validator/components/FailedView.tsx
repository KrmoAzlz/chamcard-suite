
import React from 'react';
import { LucideXCircle, LucideAlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FailedViewProps {
  reason: string;
  onRetry: () => void;
}

const FailedView: React.FC<FailedViewProps> = ({ reason, onRetry }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-red-600 p-8 text-white">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <LucideXCircle className="w-48 h-48 mb-8 drop-shadow-lg" />
      </motion.div>
      <h2 className="text-7xl font-black mb-4">فشل الدفع</h2>
      <div className="flex items-center gap-3 bg-black/20 px-8 py-4 rounded-2xl mb-8 border border-white/10">
        <LucideAlertTriangle className="w-8 h-8 text-yellow-300" />
        <span className="text-3xl font-bold">{reason}</span>
      </div>
      <button 
        onClick={onRetry}
        className="text-xl underline underline-offset-8 opacity-70 hover:opacity-100 transition-opacity"
      >
        الرجوع للشاشة الرئيسية
      </button>
    </div>
  );
};

export default FailedView;
