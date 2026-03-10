import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormData } from '../lib/types';

interface Props {
  formData: FormData;
  updateFormData: (fields: Partial<FormData>) => void;
}

export const Step3EmotionalSurvey: React.FC<Props> = ({ formData, updateFormData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
          <Heart size={20} />
        </div>
        <h2 className="text-xl font-semibold">Emotional State Quick Survey</h2>
      </div>

      <div className="space-y-12">
        {[
          { key: 'stressLevel', label: 'How stressed do you feel today?' },
          { key: 'confidenceLevel', label: 'How confident do you feel today?' },
          { key: 'personalComfortLevel', label: 'How comfortable are you speaking about personal topics?' }
        ].map((item) => (
          <div key={item.key} className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700">{item.label}</label>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                {formData[item.key as keyof FormData]} / 5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={formData[item.key as keyof FormData] as number}
              onChange={e => updateFormData({ [item.key]: parseInt(e.target.value) })}
              className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span>Not at all</span>
              <span>Very much</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
