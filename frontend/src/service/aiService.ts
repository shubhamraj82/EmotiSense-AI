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
      purpose: formData.otherPurpose || formData.purpose,
      language: getLanguageLabel(formData),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate interview questions.');
  }

  const data = (await response.json()) as {
    questions?: string[];
    source?: 'ai' | 'fallback';
  };

  return {
    questions: Array.isArray(data.questions) ? data.questions : [],
    source: data.source ?? 'fallback',
  };
};
