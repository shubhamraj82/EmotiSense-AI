import React from 'react';
import { User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData, initialFormData } from '../lib/types';

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
        <h2 className="text-xl font-semibold">Basic User Information</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <InputField label="Full Name" required error={errors.fullName}>
          <input
            type="text"
            value={formData.fullName}
            onChange={e => updateFormData({ fullName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder="John Doe"
          />
        </InputField>

        <InputField label="Age" required error={errors.age}>
          <input
            type="number"
            value={formData.age}
            onChange={e => updateFormData({ age: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder="25"
          />
        </InputField>

        <InputField label="Gender">
          <select
            value={formData.gender}
            onChange={e => updateFormData({ gender: e.target.value as any })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </InputField>

        <InputField label="Email Address" required error={errors.email}>
          <input
            type="email"
            value={formData.email}
            onChange={e => updateFormData({ email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder="john@example.com"
          />
        </InputField>

        <InputField label="Phone Number (Optional)">
          <input
            type="tel"
            value={formData.phone}
            onChange={e => updateFormData({ phone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder="+1 (555) 000-0000"
          />
        </InputField>

        <InputField label="Institution / School / Organization" required error={errors.institution}>
          <input
            type="text"
            value={formData.institution}
            onChange={e => updateFormData({ institution: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder="University of Technology"
          />
        </InputField>

        <InputField label="Student ID (Optional)">
          <input
            type="text"
            value={formData.studentId}
            onChange={e => updateFormData({ studentId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder="STU-12345"
          />
        </InputField>
      </div>
    </motion.div>
  );
};
