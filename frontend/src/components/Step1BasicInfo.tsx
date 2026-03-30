import React from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '../context/LocaleContext';
import { FormData } from '../lib/types';

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

export const Step1BasicInfo: React.FC<Props> = ({ formData, updateFormData, errors }) => {
  const { t } = useLocale();
  return (
    
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <User size={20} />
        </div>
        <h2 className="text-xl font-semibold">{t('step1.heading')}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <InputField label={t('step1.fullName')} required error={errors.fullName}>
          <input
            type="text"
            value={formData.fullName}
            onChange={e => updateFormData({ fullName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder={t('step1.phFullName')}
          />
        </InputField>

        <InputField label={t('step1.age')} required error={errors.age}>
          <input
            type="number"
            value={formData.age}
            onChange={e => updateFormData({ age: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder={t('step1.phAge')}
          />
        </InputField>

        <InputField label={t('step1.gender')}>
          <select
            value={formData.gender}
            onChange={e => updateFormData({ gender: e.target.value as FormData['gender'] })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 [color-scheme:light] focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          >
            <option className="bg-white text-slate-900" value="">{t('step1.genderPlaceholder')}</option>
            <option className="bg-white text-slate-900" value="Male">{t('step1.genderMale')}</option>
            <option className="bg-white text-slate-900" value="Female">{t('step1.genderFemale')}</option>
            <option className="bg-white text-slate-900" value="Other">{t('step1.genderOther')}</option>
            <option className="bg-white text-slate-900" value="Prefer not to say">{t('step1.genderPreferNot')}</option>
          </select>
        </InputField>

        <InputField label={t('step1.email')} required error={errors.email}>
          <input
            type="email"
            value={formData.email}
            onChange={e => updateFormData({ email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder={t('step1.phEmail')}
          />
        </InputField>

        <InputField label={t('step1.phone')}>
          <input
            type="tel"
            value={formData.phone}
            onChange={e => updateFormData({ phone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder={t('step1.phPhone')}
          />
        </InputField>

        <InputField label={t('step1.institution')} required error={errors.institution}>
          <input
            type="text"
            value={formData.institution}
            onChange={e => updateFormData({ institution: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder={t('step1.phInstitution')}
          />
        </InputField>

        <InputField label={t('step1.studentId')}>
          <input
            type="text"
            value={formData.studentId}
            onChange={e => updateFormData({ studentId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder={t('step1.phStudentId')}
          />
        </InputField>
      </div>
    </motion.div>
  );
};
