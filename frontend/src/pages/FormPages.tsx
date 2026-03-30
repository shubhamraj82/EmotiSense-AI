import React, { useState, useEffect, useRef } from "react";
import { User, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";
import { FormData, initialFormData } from "../lib/types";
import { Step1BasicInfo } from "../components/Step1BasicInfo";
import { Step2Preferences } from "../components/Step2Preferences";
import { Step3EmotionalSurvey } from "../components/Step3EmotionalSurvey";
import { Step4TechnicalCheck } from "../components/Step4TechnicalCheck";
import { Step5ConsentContacts } from "../components/Step5ConsentContacts";
import { Step6Instructions } from "../components/Step6Instructions";
import SoftBackdrop from "../components/SoftBackdrop";

const STORAGE_KEY = "emotisense-session";

const ProgressBar = ({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) => {
  const { t } = useLocale();
  const pct = Math.round((currentStep / totalSteps) * 100);
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
          {t("form.stepOf", { current: currentStep, total: totalSteps })}
        </span>
        <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
          {t("form.percentComplete", { n: pct })}
        </span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-700 via-pink-500 to-pink-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

export default function FormPages() {
  const navigate = useNavigate();
  const { t } = useLocale();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [permissions, setPermissions] = useState({ camera: false, mic: false });
  const [isCheckingInternet, setIsCheckingInternet] = useState(false);
  const [internetStatus, setInternetStatus] = useState<
    "stable" | "unstable" | "checking"
  >("checking");

  const videoRef = useRef<HTMLVideoElement>(null);
  const totalSteps = 6;

  const updateFormData = (fields: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    const keys = Object.keys(fields) as (keyof FormData)[];
    if (keys.length > 0) {
      const newErrors = { ...errors };
      keys.forEach((key) => delete newErrors[key]);
      setErrors(newErrors);
    }
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = t("errors.fullName");
      if (!formData.email.trim()) {
        newErrors.email = t("errors.emailRequired");
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t("errors.emailInvalid");
      }
      if (!formData.age) {
        newErrors.age = t("errors.ageRequired");
      } else if (parseInt(formData.age) <= 10) {
        newErrors.age = t("errors.ageMin");
      }
      if (!formData.institution.trim())
        newErrors.institution = t("errors.institution");
    }

    if (step === 2) {
      if (formData.language === "Other" && !formData.otherLanguage.trim()) {
        newErrors.otherLanguage = t("errors.otherLanguage");
      }
      if (!formData.comfortLevel)
        newErrors.comfortLevel = t("errors.comfortLevel");
      if (!formData.purpose) newErrors.purpose = t("errors.purpose");
    }

    if (step === 5) {
      if (
        !formData.consentRecorded ||
        !formData.consentAnalysis ||
        !formData.consentReport ||
        !formData.consentAccess
      ) {
        newErrors.consentRecorded = t("errors.consentAll");
      }
      if (!formData.parentEmail.trim()) {
        newErrors.parentEmail = t("errors.parentEmailRequired");
      } else if (!/\S+@\S+\.\S+/.test(formData.parentEmail)) {
        newErrors.parentEmail = t("errors.emailInvalid");
      }
      if (!formData.mentorEmail.trim()) {
        newErrors.mentorEmail = t("errors.mentorEmailRequired");
      } else if (!/\S+@\S+\.\S+/.test(formData.mentorEmail)) {
        newErrors.mentorEmail = t("errors.emailInvalid");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
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
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const checkInternet = () => {
    setIsCheckingInternet(true);
    setInternetStatus("checking");
    setTimeout(() => {
      setInternetStatus(navigator.onLine ? "stable" : "unstable");
      setIsCheckingInternet(false);
    }, 1500);
  };

  const handleSubmit = () => {
    if (validateStep()) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      navigate("/interview");
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans text-white">
      <SoftBackdrop />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-pink-600/20 border border-pink-500/30 rounded-2xl shadow-lg shadow-pink-900/40 mb-4"
          >
            <User className="w-8 h-8 text-pink-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            {t("form.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3 text-lg text-white/50 max-w-2xl mx-auto"
          >
            {t("form.subtitle")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm text-white/35 max-w-xl mx-auto italic"
          >
            &ldquo;{t("form.intro")}&rdquo;
          </motion.p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={step} totalSteps={totalSteps} />

        {/* Form Card */}
        <div className="bg-white/[0.04] backdrop-blur-md rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden">
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
              {step === 6 && <Step6Instructions />}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                step === 1
                  ? "text-white/20 cursor-not-allowed"
                  : "text-white/60 hover:text-white hover:bg-white/10 active:scale-95"
              }`}
            >
              <ChevronLeft size={18} />
              {t("form.back")}
            </button>

            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-900/50 transition-all active:scale-95"
              >
                {t("form.next")}
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-10 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-base shadow-xl shadow-pink-900/50 transition-all active:scale-95 group"
              >
                {t("form.startSession")}
                <CheckCircle2
                  size={20}
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
            )}
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/25 font-medium">
            {t("form.support")}{" "}
            <a
              href="mailto:support@aispeech.ai"
              className="text-pink-400/70 hover:text-pink-400 transition-colors hover:underline"
            >
              support@aispeech.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
