import React from 'react';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormData, ComfortLevel, Duration } from '../lib/types';

interface Props {
  formData: FormData;
  updateFormData: (fields: Partial<FormData>) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const InputField = ({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

export const Step2Preferences: React.FC<Props> = ({ formData, updateFormData, errors }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
          <Globe size={20} />
        </div>
        <h2 className="text-xl font-semibold">Language & Session Preferences</h2>
      </div>

      <div className="space-y-6">
        <InputField label="Preferred Language for Questions" required error={errors.otherLanguage}>
          <div className="space-y-3">
            <select
              value={formData.language}
              onChange={e => updateFormData({ language: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Bengali">Bengali</option>
              <option value="Other">Other</option>
            </select>
            {formData.language === 'Other' && (
              <input
                type="text"
                value={formData.otherLanguage}
                onChange={e => updateFormData({ otherLanguage: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="Please specify language"
              />
            )}
          </div>
        </InputField>

        <InputField label="Comfort Level Speaking on Camera" required error={errors.comfortLevel}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {['Very Comfortable', 'Somewhat Comfortable', 'Not Comfortable'].map((level) => (
              <label 
                key={level}
                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.comfortLevel === level 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="comfortLevel"
                  className="hidden"
                  value={level}
                  checked={formData.comfortLevel === level}
                  onChange={() => updateFormData({ comfortLevel: level as ComfortLevel })}
                />
                <span className="text-sm font-medium">{level}</span>
              </label>
            ))}
          </div>
        </InputField>

        <InputField label="Preferred Session Duration">
          <select
            value={formData.duration}
            onChange={e => updateFormData({ duration: e.target.value as Duration })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
          >
            <option value="5 minutes">5 minutes</option>
            <option value="10 minutes">10 minutes</option>
            <option value="15 minutes">15 minutes</option>
          </select>
        </InputField>

        <InputField label="Why are you taking this session?" required error={errors.purpose}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Self-assessment', 
              'Counseling support', 
              'Academic evaluation', 
              'Behavioral analysis', 
              'Interview preparation', 
              'Other'
            ].map((p) => (
              <label 
                key={p}
                className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.purpose === p 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="purpose"
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mr-3"
                  value={p}
                  checked={formData.purpose === p}
                  onChange={() => updateFormData({ purpose: p })}
                />
                <span className="text-sm font-medium">{p}</span>
              </label>
            ))}
          </div>
          {formData.purpose === 'Other' && (
            <input
              type="text"
              value={formData.otherPurpose}
              onChange={e => updateFormData({ otherPurpose: e.target.value })}
              className="mt-3 w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="Please specify purpose"
            />
          )}
        </InputField>
      </div>
    </motion.div>
  );
};
