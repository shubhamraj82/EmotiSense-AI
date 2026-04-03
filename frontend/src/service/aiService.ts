import { FormData } from '../lib/types';
import { getLanguageLabel } from '../lib/interview';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const fetchInterviewQuestions = async (formData: FormData) => {
  const response = await fetch(`${API_BASE_URL}/api/ai/interview-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName: formData.fullName,
      age: formData.age,
      gender: formData.gender,
      institution: formData.institution,
      studentId: formData.studentId,
      purpose: formData.otherPurpose || formData.purpose,
      language: getLanguageLabel(formData),
      comfortLevel: formData.comfortLevel,
      duration: formData.duration,
      stressLevel: formData.stressLevel,
      confidenceLevel: formData.confidenceLevel,
      personalComfortLevel: formData.personalComfortLevel,
      parentName: formData.parentName,
      mentorName: formData.mentorName,
    }),
  });

  const data = (await response.json()) as {
    questions?: string[];
    source?: 'sarvam';
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate interview questions.');
  }

  return {
    questions: Array.isArray(data.questions) ? data.questions : [],
    source: data.source ?? 'sarvam',
  };
};
