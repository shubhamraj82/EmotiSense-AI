import { FormData, SupportedLanguage } from './types';

export type LanguageConfig = {
  code: SupportedLanguage;
  label: string;
  speechSynthesisLang: string;
  recognitionLang: string;
  finishMessage: string;
  noAnswerLabel: string;
  questions: (name: string, focus: string, languageLabel: string) => string[];
};

const englishQuestions = (name: string, focus: string, languageLabel: string) => [
  `Hello ${name}. Please introduce yourself and tell me how you are feeling right now.`,
  `What motivated you to join this ${focus} session today?`,
  'Tell me about a recent situation in your studies where you felt proud of yourself.',
  'Describe a challenge that has been causing you stress and how you usually respond to it.',
  `How comfortable are you expressing your thoughts in ${languageLabel}, and what helps you communicate clearly?`,
  'What kind of support from teachers, mentors, or family helps you perform at your best?',
  'If you could improve one habit over the next month, what would it be and why?',
  'Thank you. Is there anything else you want this assessment to understand about you before we finish?',
];

const hindiQuestions = (name: string, focus: string, languageLabel: string) => [
  `नमस्ते ${name}। कृपया अपना परिचय दें और बताइए कि आप अभी कैसा महसूस कर रहे हैं।`,
  `आज इस ${focus} सत्र में शामिल होने की आपकी क्या प्रेरणा थी?`,
  'अपनी पढ़ाई की किसी हाल की स्थिति के बारे में बताइए, जिसमें आपको अपने ऊपर गर्व महसूस हुआ हो।',
  'ऐसी किसी चुनौती के बारे में बताइए जो आपको तनाव देती है और आप आमतौर पर उसका सामना कैसे करते हैं।',
  `${languageLabel} में अपने विचार व्यक्त करने में आप कितने सहज हैं, और स्पष्ट रूप से बोलने में क्या मदद करता है?`,
  'शिक्षकों, मेंटर्स या परिवार से किस प्रकार का सहयोग आपको सर्वश्रेष्ठ प्रदर्शन करने में मदद करता है?',
  'यदि आप अगले एक महीने में एक आदत सुधार सकते हों, तो वह क्या होगी और क्यों?',
  'धन्यवाद। समाप्त करने से पहले क्या आप चाहते हैं कि यह मूल्यांकन आपके बारे में कुछ और समझे?',
];

const bengaliQuestions = (name: string, focus: string, languageLabel: string) => [
  `নমস্কার ${name}। অনুগ্রহ করে নিজের পরিচয় দিন এবং বলুন আপনি এখন কেমন অনুভব করছেন।`,
  `আজ এই ${focus} সেশনে যোগ দিতে আপনাকে কী অনুপ্রাণিত করেছে?`,
  'তোমার পড়াশোনার সাম্প্রতিক এমন একটি ঘটনার কথা বলো, যেখানে তুমি নিজের জন্য গর্ব অনুভব করেছ।',
  'এমন একটি চ্যালেঞ্জের কথা বলো যা তোমার মধ্যে চাপ তৈরি করছে, এবং তুমি সাধারণত সেটার মোকাবিলা কীভাবে করো।',
  `${languageLabel} ভাষায় নিজের ভাবনা প্রকাশ করতে তুমি কতটা স্বচ্ছন্দ, এবং পরিষ্কারভাবে যোগাযোগ করতে কী সাহায্য করে?`,
  'শিক্ষক, মেন্টর বা পরিবারের কাছ থেকে কেমন সহায়তা পেলে তুমি সবচেয়ে ভালো করতে পারো?',
  'আগামী এক মাসে যদি তুমি একটি অভ্যাস উন্নত করতে পারো, সেটি কী হবে এবং কেন?',
  'ধন্যবাদ। শেষ করার আগে তুমি কি চাও এই মূল্যায়ন তোমার সম্পর্কে আর কিছু জানুক?',
];

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  English: {
    code: 'English',
    label: 'English',
    speechSynthesisLang: 'en-US',
    recognitionLang: 'en-US',
    finishMessage: 'Interview complete. Your report is now being prepared and emailed to your parent and mentor.',
    noAnswerLabel: 'No answer captured.',
    questions: englishQuestions,
  },
  Hindi: {
    code: 'Hindi',
    label: 'Hindi',
    speechSynthesisLang: 'hi-IN',
    recognitionLang: 'hi-IN',
    finishMessage: 'साक्षात्कार पूरा हो गया है। आपकी रिपोर्ट तैयार की जा रही है और अभिभावक तथा मेंटर को ईमेल की जा रही है।',
    noAnswerLabel: 'कोई उत्तर रिकॉर्ड नहीं हुआ।',
    questions: hindiQuestions,
  },
  Bengali: {
    code: 'Bengali',
    label: 'Bengali',
    speechSynthesisLang: 'bn-IN',
    recognitionLang: 'bn-IN',
    finishMessage: 'সাক্ষাৎকার সম্পূর্ণ হয়েছে। আপনার রিপোর্ট প্রস্তুত হচ্ছে এবং অভিভাবক ও মেন্টরকে ইমেল করা হচ্ছে।',
    noAnswerLabel: 'কোনো উত্তর ধরা পড়েনি।',
    questions: bengaliQuestions,
  },
  Other: {
    code: 'Other',
    label: 'Other',
    speechSynthesisLang: 'en-US',
    recognitionLang: 'en-US',
    finishMessage: 'Interview complete. Your report is now being prepared and emailed to your parent and mentor.',
    noAnswerLabel: 'No answer captured.',
    questions: englishQuestions,
  },
};

export const getLanguageConfig = (formData: FormData) => {
  return LANGUAGE_CONFIGS[formData.language || 'English'] ?? LANGUAGE_CONFIGS.English;
};

export const getLanguageLabel = (formData: FormData) => {
  if (formData.language === 'Other' && formData.otherLanguage.trim()) {
    return formData.otherLanguage.trim();
  }

  return getLanguageConfig(formData).label;
};

export const createQuestions = (formData: FormData) => {
  const focus = formData.otherPurpose || formData.purpose || 'self-reflection';
  const name = formData.fullName || 'student';
  const languageLabel = getLanguageLabel(formData);
  const config = getLanguageConfig(formData);

  return config.questions(name, focus, languageLabel);
};
