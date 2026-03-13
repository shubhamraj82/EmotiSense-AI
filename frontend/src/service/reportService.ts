import { FormData } from '../lib/types';

export type TranscriptEntry = {
  id: number;
  question: string;
  answer: string;
};

export type InterviewReportResponse = {
  report: {
    student: {
      name: string;
      institution: string;
      preferredLanguage: string;
      purpose: string;
    };
    summary: string;
    strengths: string[];
    concerns: string[];
    actionItems: string[];
    engagementScore: number;
    emotionalSignals: {
      stressLevel: number;
      confidenceLevel: number;
      cameraComfort: string;
    };
    transcript: TranscriptEntry[];
  };
  email: {
    sent: boolean;
    recipients: string[];
    skipped?: boolean;
    message: string;
  };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const submitInterviewReport = async (payload: {
  formData: FormData;
  transcript: TranscriptEntry[];
  durationSeconds: number;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/reports/interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as InterviewReportResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.email?.message || data.error || 'Failed to generate interview report.');
  }

  return data;
};
