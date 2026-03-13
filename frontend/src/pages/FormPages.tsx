import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FormData, initialFormData } from '../lib/types';
import { Step1BasicInfo } from '../components/Step1BasicInfo';
import { Step2Preferences } from '../components/Step2Preferences';
import { Step3EmotionalSurvey } from '../components/Step3EmotionalSurvey';
import { Step4TechnicalCheck } from '../components/Step4TechnicalCheck';
import { Step5ConsentContacts } from '../components/Step5ConsentContacts';
import { Step6Instructions } from '../components/Step6Instructions';

const STORAGE_KEY = 'emotisense-session';

// --- Components ---

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </span>
      </div>
      <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [permissions, setPermissions] = useState({ camera: false, mic: false });
  const [isCheckingInternet, setIsCheckingInternet] = useState(false);
  const [internetStatus, setInternetStatus] = useState<'stable' | 'unstable' | 'checking'>('checking');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const totalSteps = 6;

  const updateFormData = (fields: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
    // Clear error when user types
    const keys = Object.keys(fields) as (keyof FormData)[];
    if (keys.length > 0) {
      const newErrors = { ...errors };
      keys.forEach(key => delete newErrors[key]);
      setErrors(newErrors);
    }
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.age) {
        newErrors.age = "Age is required";
      } else if (parseInt(formData.age) <= 10) {
        newErrors.age = "Age must be above 10";
      }
      if (!formData.institution.trim()) newErrors.institution = "Institution is required";
    }

    if (step === 2) {
      if (formData.language === 'Other' && !formData.otherLanguage.trim()) {
        newErrors.otherLanguage = 'Please specify your preferred language';
      }
      if (!formData.comfortLevel) newErrors.comfortLevel = "Please select your comfort level";
      if (!formData.purpose) newErrors.purpose = "Please select a purpose";
    }

    if (step === 5) {
      if (!formData.consentRecorded || !formData.consentAnalysis || !formData.consentReport || !formData.consentAccess) {
        newErrors.consentRecorded = "All consents must be accepted to proceed";
      }
      if (!formData.parentEmail.trim()) {
        newErrors.parentEmail = "Parent email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.parentEmail)) {
        newErrors.parentEmail = "Invalid email format";
      }
      if (!formData.mentorEmail.trim()) {
        newErrors.mentorEmail = "Mentor email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.mentorEmail)) {
        newErrors.mentorEmail = "Invalid email format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Camera logic
  useEffect(() => {
    if (step === 4) {
      requestPermissions();
      checkInternet();
    } else {
      stopCamera();
    }
  }, [step]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraStream(stream);
      setPermissions({ camera: true, mic: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Permission denied", err);
      setPermissions({ camera: false, mic: false });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const checkInternet = () => {
    setIsCheckingInternet(true);
    setInternetStatus('checking');
    setTimeout(() => {
      setInternetStatus(navigator.onLine ? 'stable' : 'unstable');
      setIsCheckingInternet(false);
    }, 1500);
  };

  const handleSubmit = () => {
    if (validateStep()) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      navigate('/interview');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4"
          >
            <User className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Pre-Session Setup
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            AI Speech & Facial Analysis System
          </p>
          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto italic">
            "Please fill out the following details before starting the live video Q&A session. Your responses will help personalize the experience and generate accurate analysis."
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={step} totalSteps={totalSteps} />

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <Step1BasicInfo 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors} 
                />
              )}

              {step === 2 && (
                <Step2Preferences 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors} 
                />
              )}

              {step === 3 && (
                <Step3EmotionalSurvey 
                  formData={formData} 
                  updateFormData={updateFormData} 
                />
              )}

              {step === 4 && (
                <Step4TechnicalCheck 
                  permissions={permissions}
                  internetStatus={internetStatus}
                  isCheckingInternet={isCheckingInternet}
                  checkInternet={checkInternet}
                  requestPermissions={requestPermissions}
                  videoRef={videoRef}
                />
              )}

              {step === 5 && (
                <Step5ConsentContacts 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors} 
                />
              )}

              {step === 6 && (
                <Step6Instructions />
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                step === 1 
                  ? 'text-slate-300 cursor-not-allowed' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft size={18} />
              Back
            </button>

            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Next Step
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 group"
              >
                Start Live Video Q&A Session
                <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Need help? Contact support at <a href="mailto:support@aispeech.ai" className="text-indigo-500 hover:underline">support@aispeech.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
}
