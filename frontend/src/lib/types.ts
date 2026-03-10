export type Gender = 'Male' | 'Female' | 'Prefer not to say' | 'Other' | '';
export type ComfortLevel = 'Very Comfortable' | 'Somewhat Comfortable' | 'Not Comfortable' | '';
export type Duration = '5 minutes' | '10 minutes' | '15 minutes' | '';

export interface FormData {
  // Section 1
  fullName: string;
  age: string;
  gender: Gender;
  email: string;
  phone: string;
  institution: string;
  studentId: string;
  
  // Section 2 & 3
  language: string;
  otherLanguage: string;
  comfortLevel: ComfortLevel;
  duration: Duration;
  purpose: string;
  otherPurpose: string;
  
  // Section 4
  stressLevel: number;
  confidenceLevel: number;
  personalComfortLevel: number;
  
  // Section 7
  parentName: string;
  parentEmail: string;
  mentorName: string;
  mentorEmail: string;
  
  // Section 6
  consentRecorded: boolean;
  consentAnalysis: boolean;
  consentReport: boolean;
  consentAccess: boolean;
}

export const initialFormData: FormData = {
  fullName: '',
  age: '',
  gender: '',
  email: '',
  phone: '',
  institution: '',
  studentId: '',
  language: 'English',
  otherLanguage: '',
  comfortLevel: '',
  duration: '10 minutes',
  purpose: '',
  otherPurpose: '',
  stressLevel: 3,
  confidenceLevel: 3,
  personalComfortLevel: 3,
  parentName: '',
  parentEmail: '',
  mentorName: '',
  mentorEmail: '',
  consentRecorded: false,
  consentAnalysis: false,
  consentReport: false,
  consentAccess: false,
};
