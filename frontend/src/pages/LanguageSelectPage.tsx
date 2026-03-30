import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";
import { UI_LOCALES, type UILocale } from "../lib/i18n/locales";
import SoftBackdrop from "../components/SoftBackdrop";

const LANGUAGE_META: Record<
  UILocale,
  { sample: string; greeting: string; script: string; flag: string }
> = {
  en: {
    flag: "🇬🇧",
    script: "Latin",
    greeting: "Hello! Welcome.",
    sample: "Please fill out the form to begin your session.",
  },
  hi: {
    flag: "🇮🇳",
    script: "देवनागरी",
    greeting: "नमस्ते! स्वागत है।",
    sample: "कृपया अपना सत्र शुरू करने के लिए फॉर्म भरें।",
  },
  bn: {
    flag: "🇧🇩",
    script: "বাংলা লিপি",
    greeting: "হ্যালো! স্বাগতম।",
    sample: "আপনার সেশন শুরু করতে ফর্মটি পূরণ করুন।",
  },
  or: {
    flag: "🇮🇳",
    script: "ଓଡ଼ିଆ ଲିପି",
    greeting: "ନମସ୍କାର! ସ୍ୱାଗତ।",
    sample: "ଆପଣଙ୍କ ସେସନ ଆରମ୍ଭ କରିବା ପାଇଁ ଫର୍ମ ପୂରଣ କରନ୍ତୁ।",
  },
};

export default function LanguageSelectPage() {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useLocale();
  const [selected, setSelected] = useState<UILocale>(locale);
  const [hoveredId, setHoveredId] = useState<UILocale | null>(null);

  const handleContinue = () => {
    setLocale(selected);
    navigate("/setup", { replace: true });
  };

  const previewLocale = hoveredId ?? selected;

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-white flex flex-col">
      <SoftBackdrop />

      <div className="relative z-10 flex flex-col flex-1 items-center justify-center py-14 px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12 max-w-xl"
        >
          <div className="inline-flex items-center justify-center p-3 bg-pink-600/20 border border-pink-500/30 rounded-2xl shadow-lg shadow-pink-900/40 mb-5">
            <Languages className="w-8 h-8 text-pink-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {t("langSelect.title")}
          </h1>

          <p className="mt-4 text-base text-white/45 leading-relaxed">
            {t("langSelect.subtitle")}
          </p>
        </motion.div>

        {/* Language cards */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {UI_LOCALES.map(({ id, nativeLabel, englishLabel }, i) => {
            const meta = LANGUAGE_META[id];
            const isSelected = selected === id;

            return (
              <motion.button
                key={id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.35 }}
                onClick={() => setSelected(id)}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] group overflow-hidden ${
                  isSelected
                    ? "border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-900/30"
                    : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                }`}
              >
                {/* Selected checkmark */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center shadow-md shadow-pink-900/50"
                    >
                      <Check size={13} strokeWidth={3} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pink glow blob for selected */}
                {isSelected && (
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-pink-600/20 rounded-full blur-2xl pointer-events-none" />
                )}

                {/* Flag + script */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{meta.flag}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? "border-pink-500/30 text-pink-400 bg-pink-500/10"
                        : "border-white/10 text-white/30 bg-white/5"
                    }`}
                  >
                    {meta.script}
                  </span>
                </div>

                {/* Native name */}
                <p
                  className={`text-2xl font-bold mb-0.5 transition-colors ${
                    isSelected
                      ? "text-pink-300"
                      : "text-white/80 group-hover:text-white"
                  }`}
                >
                  {nativeLabel}
                </p>

                {/* English label */}
                {id !== "en" && (
                  <p
                    className={`text-sm font-medium mb-3 transition-colors ${
                      isSelected ? "text-pink-400/70" : "text-white/35"
                    }`}
                  >
                    {englishLabel}
                  </p>
                )}

                {/* Divider */}
                <div
                  className={`h-px my-3 ${
                    isSelected ? "bg-pink-500/20" : "bg-white/[0.06]"
                  }`}
                />

                {/* Sample text preview */}
                <p
                  className={`text-xs leading-relaxed transition-colors ${
                    isSelected
                      ? "text-white/50"
                      : "text-white/25 group-hover:text-white/35"
                  }`}
                >
                  {meta.sample}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Live preview strip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={previewLocale}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl mb-8"
          >
            <div className="flex items-center gap-3 px-5 py-3.5 bg-white/[0.04] border border-white/[0.07] rounded-xl">
              <span className="text-lg">
                {LANGUAGE_META[previewLocale].flag}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">
                  Preview
                </p>
                <p className="text-sm text-white/60 truncate">
                  {LANGUAGE_META[previewLocale].greeting}
                </p>
              </div>
              <span className="text-xs text-white/25 font-medium shrink-0">
                {UI_LOCALES.find((l) => l.id === previewLocale)?.englishLabel}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Continue button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleContinue}
          className="flex items-center gap-3 px-10 py-3.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-pink-900/50 transition-all active:scale-95 group"
        >
          {t("langSelect.continue")}
          <ArrowRight
            size={20}
            className="group-hover:translate-x-1 transition-transform"
          />
        </motion.button>

        <p className="mt-5 text-xs text-white/20 text-center">
          You can return to this page anytime to change your language.
        </p>
      </div>
    </div>
  );
}
