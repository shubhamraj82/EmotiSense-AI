import React from 'react';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '../context/LocaleContext';
import type { MessageKey } from '../lib/i18n/translations';
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
  const { t } = useLocale();

  const comfortLevels: { value: ComfortLevel; labelKey: MessageKey }[] = [
    { value: 'Very Comfortable', labelKey: 'step2.comfortVery' },
    { value: 'Somewhat Comfortable', labelKey: 'step2.comfortSomewhat' },
    { value: 'Not Comfortable', labelKey: 'step2.comfortNot' },
  ];

  const durations: { value: Duration; labelKey: MessageKey }[] = [
    { value: '5 minutes', labelKey: 'step2.dur5' },
    { value: '10 minutes', labelKey: 'step2.dur10' },
    { value: '15 minutes', labelKey: 'step2.dur15' },
  ];

  const purposes: { value: string; labelKey: MessageKey }[] = [
    { value: 'Self-assessment', labelKey: 'step2.purposeSelf' },
    { value: 'Counseling support', labelKey: 'step2.purposeCounseling' },
    { value: 'Academic evaluation', labelKey: 'step2.purposeAcademic' },
    { value: 'Behavioral analysis', labelKey: 'step2.purposeBehavioral' },
    { value: 'Interview preparation', labelKey: 'step2.purposeInterview' },
    { value: 'Other', labelKey: 'step2.purposeOther' },
  ];

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
        <h2 className="text-xl font-semibold">{t('step2.heading')}</h2>
      </div>

      <div className="space-y-6">
        <InputField label={t('step2.prefLanguage')} required error={errors.otherLanguage}>
          <div className="space-y-3">
            <select
              value={formData.language}
              onChange={e => updateFormData({ language: e.target.value as FormData['language'] })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 [color-scheme:light] focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            >
              <option className="bg-white text-slate-900" value="English">{t('step2.langEnglish')}</option>
              <option className="bg-white text-slate-900" value="Hindi">{t('step2.langHindi')}</option>
              <option className="bg-white text-slate-900" value="Bengali">{t('step2.langBengali')}</option>
              <option className="bg-white text-slate-900" value="Odia">{t('step2.langOdia')}</option>
              <option className="bg-white text-slate-900" value="Other">{t('step2.langOther')}</option>
            </select>
            {formData.language === 'Other' && (
              <input
                type="text"
                value={formData.otherLanguage}
                onChange={e => updateFormData({ otherLanguage: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder={t('step2.specifyLanguage')}
              />
            )}
          </div>
        </InputField>

        <InputField label={t('step2.comfort')} required error={errors.comfortLevel}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {comfortLevels.map(({ value, labelKey }) => (
              <label 
                key={value}
                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.comfortLevel === value 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="comfortLevel"
                  className="hidden"
                  value={value}
                  checked={formData.comfortLevel === value}
                  onChange={() => updateFormData({ comfortLevel: value })}
                />
                <span className="text-sm font-medium">{t(labelKey)}</span>
              </label>
            ))}
          </div>
        </InputField>

        <InputField label={t('step2.duration')}>
          <select
            value={formData.duration}
            onChange={e => updateFormData({ duration: e.target.value as Duration })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 [color-scheme:light] focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          >
            {durations.map(({ value, labelKey }) => (
              <option className="bg-white text-slate-900" key={value} value={value}>{t(labelKey)}</option>
            ))}
          </select>
        </InputField>

        <InputField label={t('step2.purposeQ')} required error={errors.purpose}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {purposes.map(({ value, labelKey }) => (
              <label 
                key={value}
                className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.purpose === value 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="purpose"
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mr-3"
                  value={value}
                  checked={formData.purpose === value}
                  onChange={() => updateFormData({ purpose: value })}
                />
                <span className="text-sm font-medium">{t(labelKey)}</span>
              </label>
            ))}
          </div>
          {formData.purpose === 'Other' && (
            <input
              type="text"
              value={formData.otherPurpose}
              onChange={e => updateFormData({ otherPurpose: e.target.value })}
              className="mt-3 w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder={t('step2.specifyPurpose')}
            />
          )}
        </InputField>
      </div>
    </motion.div>
  );
};
