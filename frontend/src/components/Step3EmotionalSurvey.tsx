import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '../context/LocaleContext';
import { FormData } from '../lib/types';

interface Props {
  formData: FormData;
  updateFormData: (fields: Partial<FormData>) => void;
}

export const Step3EmotionalSurvey: React.FC<Props> = ({ formData, updateFormData }) => {
  const { t } = useLocale();
  const items = [
    { key: 'stressLevel' as const, labelKey: 'step3.stress' as const },
    { key: 'confidenceLevel' as const, labelKey: 'step3.confidence' as const },
    { key: 'personalComfortLevel' as const, labelKey: 'step3.personal' as const },
  ];

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
        <h2 className="text-xl font-semibold">{t('step3.heading')}</h2>
      </div>

      <div className="space-y-12">
        {items.map((item) => (
          <div key={item.key} className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700">{t(item.labelKey)}</label>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                {formData[item.key]} / 5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={formData[item.key]}
              onChange={e => updateFormData({ [item.key]: parseInt(e.target.value) })}
              className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span>{t('step3.scaleLow')}</span>
              <span>{t('step3.scaleHigh')}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
