import { FormData } from '../lib/types';

export type TranscriptEntry = {
  id: number;
  question: string;
  answer: string;
};

export type FaceAnalysis = {
  faceVisible: boolean;
  dominantExpression: string;
  engagement: string;
  eyeContact: string;
  observations: string[];
  reportSummary: string;
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
    communicationStyle: string;
    emotionalOverview: string;
    followUpPriority: 'low' | 'medium' | 'high';
    faceAnalysis: FaceAnalysis;
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
  faceFrames?: string[];
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
