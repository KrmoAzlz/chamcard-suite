
import React from 'react';
import { LucideCheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SuccessView: React.FC<{ amount: number }> = ({ amount }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-green-600 p-8 text-white">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10 }}
      >
        <LucideCheckCircle2 className="w-48 h-48 mb-8 drop-shadow-lg" />
      </motion.div>
      <h2 className="text-7xl font-black mb-4">تم الدفع بنجاح</h2>
      <div className="text-4xl opacity-90 mb-8">قيمة الخصم: {amount} ليرة</div>
      <div className="animate-pulse bg-white/20 px-6 py-2 rounded-full font-bold">
        رحلة سعيدة!
      </div>
    </div>
  );
};

export default SuccessView;
