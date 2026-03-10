import React from 'react';
import { ShieldCheck, Info, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
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

export const Step5ConsentContacts: React.FC<Props> = ({ formData, updateFormData, errors }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <ShieldCheck size={20} />
        </div>
        <h2 className="text-xl font-semibold">Consent & Authorized Contacts</h2>
      </div>

      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Info size={16} className="text-indigo-600" />
          Privacy Note
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          This session will record video and audio responses for AI-based speech and facial emotion analysis. 
          The generated analysis report will only be accessible to authorized individuals such as mentors or parents.
        </p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'consentRecorded', label: 'I agree that my video and audio will be recorded during the session.' },
          { key: 'consentAnalysis', label: 'I understand that the recording will be used for AI-based speech and facial analysis.' },
          { key: 'consentReport', label: 'I consent to the generation of an analysis report.' },
          { key: 'consentAccess', label: 'I understand that only authorized mentors and parents will have access to the report.' }
        ].map((item) => (
          <label key={item.key} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                checked={formData[item.key as keyof FormData] as boolean}
                onChange={e => updateFormData({ [item.key]: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
              {item.label}
            </span>
          </label>
        ))}
        {errors.consentRecorded && (
          <p className="text-xs text-red-500 font-medium flex items-center gap-1">
            <AlertCircle size={12} /> {errors.consentRecorded}
          </p>
        )}
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-lg font-semibold mb-6">Parent / Mentor Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField label="Parent / Guardian Name">
            <input
              type="text"
              value={formData.parentName}
              onChange={e => updateFormData({ parentName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="Jane Doe"
            />
          </InputField>
          <InputField label="Parent Email Address" required error={errors.parentEmail}>
            <input
              type="email"
              value={formData.parentEmail}
              onChange={e => updateFormData({ parentEmail: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="parent@example.com"
            />
          </InputField>
          <InputField label="Mentor Name">
            <input
              type="text"
              value={formData.mentorName}
              onChange={e => updateFormData({ mentorName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="Prof. Smith"
            />
          </InputField>
          <InputField label="Mentor Email Address" required error={errors.mentorEmail}>
            <input
              type="email"
              value={formData.mentorEmail}
              onChange={e => updateFormData({ mentorEmail: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="mentor@example.com"
            />
          </InputField>
        </div>
      </div>
    </motion.div>
  );
};
