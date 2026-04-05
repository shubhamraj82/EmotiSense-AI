import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { generateJsonFromAi, isAiConfigured } from '../lib/ai.js';
import { analyzeFaceFrames, FaceAnalysis, isHuggingFaceConfigured } from '../lib/huggingface.js';

type TranscriptEntry = {
  id: number;
  question: string;
  answer: string;
};

type InterviewRequestBody = {
  formData: {
    fullName: string;
    age?: string;
    gender?: string;
    institution: string;
    studentId?: string;
    language: string;
    otherLanguage?: string;
    purpose: string;
    otherPurpose?: string;
    comfortLevel: string;
    stressLevel: number;
    confidenceLevel: number;
    personalComfortLevel?: number;
    parentName?: string;
    parentEmail: string;
    mentorName?: string;
    mentorEmail: string;
  };
  transcript: TranscriptEntry[];
  durationSeconds: number;
  faceFrames?: string[];
};

type InterviewReport = {
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

const ReportRouter = Router();

type ReportLanguageKey = 'English' | 'Hindi' | 'Bengali' | 'Odia' | 'Other';

const getReportLanguageKey = (language: string): ReportLanguageKey => {
  const normalized = language.trim().toLowerCase();

  if (normalized === 'hindi') {
    return 'Hindi';
  }

  if (normalized === 'bengali') {
    return 'Bengali';
  }

  if (normalized === 'odia') {
    return 'Odia';
  }

  if (normalized === 'english') {
    return 'English';
  }

  return 'Other';
};

const REPORT_COPY: Record<
  ReportLanguageKey,
  {
    reportTitle: string;
    greeting: (parentName: string, mentorName: string) => string;
    latestSummary: (studentName: string) => string;
    strengths: string;
    concerns: string;
    nextSteps: string;
    communicationStyle: string;
    emotionalOverview: string;
    followUpPriority: string;
    emotionalSignals: string;
    stressLevel: string;
    confidenceLevel: string;
    cameraComfort: string;
    faceAnalysis: string;
    faceVisible: string;
    dominantExpression: string;
    engagement: string;
    eyeContact: string;
    observations: string;
    textTitle: (studentName: string) => string;
    fallbackSummary: (params: {
      fullName: string;
      durationMinutes: number;
      preferredLanguage: string;
      answeredQuestions: number;
      engagementScore: number;
      confidenceLevel: number;
      stressLevel: number;
    }) => string;
    fallbackStrengths: string[];
    fallbackConcerns: string[];
    fallbackActionItems: string[];
    communicationDetailed: string;
    communicationConcise: string;
    emotionalHighStress: string;
    emotionalLowConfidence: string;
    emotionalStable: string;
  }
> = {
  English: {
    reportTitle: 'EmotiSense Interview Report',
    greeting: (parentName, mentorName) => `Hello ${parentName} and ${mentorName},`,
    latestSummary: (studentName) => `Please find the latest interview summary for ${studentName}.`,
    strengths: 'Strengths',
    concerns: 'Concerns',
    nextSteps: 'Recommended Next Steps',
    communicationStyle: 'Communication Style',
    emotionalOverview: 'Emotional Overview',
    followUpPriority: 'Follow-up Priority',
    emotionalSignals: 'Emotional Signals',
    stressLevel: 'Stress Level',
    confidenceLevel: 'Confidence Level',
    cameraComfort: 'Camera Comfort',
    faceAnalysis: 'Face Analysis',
    faceVisible: 'Face Visible',
    dominantExpression: 'Dominant Expression',
    engagement: 'Engagement',
    eyeContact: 'Eye Contact',
    observations: 'Observations',
    textTitle: (studentName) => `EmotiSense Interview Report for ${studentName}`,
    fallbackSummary: ({ fullName, durationMinutes, preferredLanguage, answeredQuestions, engagementScore, confidenceLevel, stressLevel }) =>
      `${fullName} completed a ${durationMinutes}-minute AI interview in ${preferredLanguage}. The student answered ${answeredQuestions} prompts with an overall engagement score of ${engagementScore}/100. Responses suggest a current confidence level of ${confidenceLevel}/5 and self-reported stress level of ${stressLevel}/5.`,
    fallbackStrengths: [
      'Shows self-awareness and can identify personal progress.',
      'Can clearly identify the support systems that improve performance.',
    ],
    fallbackConcerns: [
      'Reported stressors that may affect academic consistency and emotional stability.',
      'Described active challenges that should be revisited by a mentor.',
    ],
    fallbackActionItems: [
      'Help the student define one measurable habit goal for the next month.',
      'Coordinate support between family, mentor, and teachers around the student’s stated needs.',
      'Repeat the interview after a short interval to compare changes in confidence, stress, and communication clarity.',
    ],
    communicationDetailed: 'The student gave relatively detailed responses and appeared willing to elaborate on personal experiences.',
    communicationConcise: 'The student gave concise responses. Follow-up conversation may help uncover more detail and context.',
    emotionalHighStress: 'Self-reported stress is elevated and should be reviewed with a mentor or parent in the near term.',
    emotionalLowConfidence: 'The student reported lower confidence, suggesting a need for supportive follow-up and reassurance.',
    emotionalStable: 'The student’s self-reported emotional indicators do not suggest an immediate high-risk concern from this session alone.',
  },
  Hindi: {
    reportTitle: 'EmotiSense साक्षात्कार रिपोर्ट',
    greeting: (parentName, mentorName) => `नमस्ते ${parentName} और ${mentorName},`,
    latestSummary: (studentName) => `कृपया ${studentName} के लिए नवीनतम साक्षात्कार सारांश देखें।`,
    strengths: 'मजबूत पक्ष',
    concerns: 'चिंताएँ',
    nextSteps: 'अनुशंसित अगले कदम',
    communicationStyle: 'संवाद शैली',
    emotionalOverview: 'भावनात्मक अवलोकन',
    followUpPriority: 'फॉलो-अप प्राथमिकता',
    emotionalSignals: 'भावनात्मक संकेत',
    stressLevel: 'तनाव स्तर',
    confidenceLevel: 'आत्मविश्वास स्तर',
    cameraComfort: 'कैमरा सहजता',
    faceAnalysis: 'चेहरे का विश्लेषण',
    faceVisible: 'चेहरा स्पष्ट दिखा',
    dominantExpression: 'प्रमुख अभिव्यक्ति',
    engagement: 'सहभागिता',
    eyeContact: 'आंखों का संपर्क',
    observations: 'अवलोकन',
    textTitle: (studentName) => `${studentName} के लिए EmotiSense साक्षात्कार रिपोर्ट`,
    fallbackSummary: ({ fullName, durationMinutes, preferredLanguage, answeredQuestions, engagementScore, confidenceLevel, stressLevel }) =>
      `${fullName} ने ${preferredLanguage} में ${durationMinutes} मिनट का AI साक्षात्कार पूरा किया। छात्र/छात्रा ने ${answeredQuestions} प्रश्नों के उत्तर दिए और कुल सहभागिता स्कोर ${engagementScore}/100 रहा। उत्तरों से वर्तमान आत्मविश्वास स्तर ${confidenceLevel}/5 और स्वयं-रिपोर्ट किया गया तनाव स्तर ${stressLevel}/5 दिखाई देता है।`,
    fallbackStrengths: [
      'छात्र/छात्रा आत्म-जागरूकता दिखाता/दिखाती है और अपनी प्रगति पहचान सकता/सकती है।',
      'प्रदर्शन सुधारने वाले सहयोग तंत्रों की स्पष्ट पहचान कर सकता/सकती है।',
    ],
    fallbackConcerns: [
      'बताए गए तनाव कारक शैक्षणिक निरंतरता और भावनात्मक स्थिरता को प्रभावित कर सकते हैं।',
      'बताई गई चुनौतियों पर मेंटर को दोबारा ध्यान देना चाहिए।',
    ],
    fallbackActionItems: [
      'अगले एक महीने के लिए छात्र/छात्रा के साथ एक मापनीय आदत-लक्ष्य तय करें।',
      'परिवार, मेंटर और शिक्षकों के बीच छात्र/छात्रा की जरूरतों के अनुसार सहयोग समन्वित करें।',
      'आत्मविश्वास, तनाव और संचार स्पष्टता में बदलाव देखने के लिए कुछ समय बाद साक्षात्कार दोहराएँ।',
    ],
    communicationDetailed: 'छात्र/छात्रा ने अपेक्षाकृत विस्तृत उत्तर दिए और व्यक्तिगत अनुभवों पर खुलकर बोलने की इच्छा दिखाई।',
    communicationConcise: 'छात्र/छात्रा ने संक्षिप्त उत्तर दिए। अधिक संदर्भ के लिए आगे की बातचीत उपयोगी हो सकती है।',
    emotionalHighStress: 'स्वयं-रिपोर्ट किया गया तनाव अधिक है और निकट भविष्य में मेंटर या अभिभावक द्वारा इसकी समीक्षा की जानी चाहिए।',
    emotionalLowConfidence: 'छात्र/छात्रा ने कम आत्मविश्वास बताया, जिससे सहायक फॉलो-अप और आश्वासन की आवश्यकता दिखती है।',
    emotionalStable: 'इस सत्र के आधार पर छात्र/छात्रा के भावनात्मक संकेत किसी तात्कालिक उच्च-जोखिम चिंता की ओर संकेत नहीं करते।',
  },
  Bengali: {
    reportTitle: 'EmotiSense সাক্ষাৎকার প্রতিবেদন',
    greeting: (parentName, mentorName) => `নমস্কার ${parentName} এবং ${mentorName},`,
    latestSummary: (studentName) => `অনুগ্রহ করে ${studentName}-এর সর্বশেষ সাক্ষাৎকার সারসংক্ষেপ দেখুন।`,
    strengths: 'শক্তির দিক',
    concerns: 'উদ্বেগের বিষয়',
    nextSteps: 'পরবর্তী প্রস্তাবিত পদক্ষেপ',
    communicationStyle: 'যোগাযোগের ধরণ',
    emotionalOverview: 'আবেগগত সারসংক্ষেপ',
    followUpPriority: 'ফলো-আপ অগ্রাধিকার',
    emotionalSignals: 'আবেগগত সংকেত',
    stressLevel: 'চাপের মাত্রা',
    confidenceLevel: 'আত্মবিশ্বাসের মাত্রা',
    cameraComfort: 'ক্যামেরায় স্বাচ্ছন্দ্য',
    faceAnalysis: 'মুখাবয়ব বিশ্লেষণ',
    faceVisible: 'মুখ স্পষ্ট দেখা গেছে',
    dominantExpression: 'প্রধান অভিব্যক্তি',
    engagement: 'সম্পৃক্ততা',
    eyeContact: 'চোখের যোগাযোগ',
    observations: 'পর্যবেক্ষণ',
    textTitle: (studentName) => `${studentName}-এর জন্য EmotiSense সাক্ষাৎকার প্রতিবেদন`,
    fallbackSummary: ({ fullName, durationMinutes, preferredLanguage, answeredQuestions, engagementScore, confidenceLevel, stressLevel }) =>
      `${fullName} ${preferredLanguage} ভাষায় ${durationMinutes} মিনিটের AI সাক্ষাৎকার সম্পন্ন করেছে। শিক্ষার্থী ${answeredQuestions}টি প্রশ্নের উত্তর দিয়েছে এবং সামগ্রিক সম্পৃক্ততা স্কোর ${engagementScore}/100। উত্তরে বর্তমান আত্মবিশ্বাসের মাত্রা ${confidenceLevel}/5 এবং স্ব-প্রতিবেদিত চাপের মাত্রা ${stressLevel}/5 বোঝা যায়।`,
    fallbackStrengths: [
      'শিক্ষার্থী আত্ম-সচেতনতা দেখিয়েছে এবং নিজের অগ্রগতি চিহ্নিত করতে পারে।',
      'কোন সহায়তা তার পারফরম্যান্স উন্নত করে তা স্পষ্টভাবে চিহ্নিত করতে পারে।',
    ],
    fallbackConcerns: [
      'উল্লিখিত চাপের কারণগুলো পড়াশোনার ধারাবাহিকতা ও আবেগগত স্থিতি প্রভাবিত করতে পারে।',
      'উল্লেখিত চ্যালেঞ্জগুলো মেন্টরের পুনরায় দেখার প্রয়োজন আছে।',
    ],
    fallbackActionItems: [
      'আগামী এক মাসের জন্য শিক্ষার্থীর সাথে একটি মাপযোগ্য অভ্যাস-লক্ষ্য নির্ধারণ করুন।',
      'শিক্ষার্থীর চাহিদা অনুযায়ী পরিবার, মেন্টর ও শিক্ষকের সহায়তা সমন্বয় করুন।',
      'আত্মবিশ্বাস, চাপ ও যোগাযোগের পরিবর্তন দেখতে কিছু সময় পরে সাক্ষাৎকারটি পুনরায় নিন।',
    ],
    communicationDetailed: 'শিক্ষার্থী তুলনামূলকভাবে বিস্তারিত উত্তর দিয়েছে এবং ব্যক্তিগত অভিজ্ঞতা ব্যাখ্যা করতে আগ্রহ দেখিয়েছে।',
    communicationConcise: 'শিক্ষার্থী সংক্ষিপ্ত উত্তর দিয়েছে। আরও প্রেক্ষাপট পেতে ফলো-আপ কথোপকথন সহায়ক হতে পারে।',
    emotionalHighStress: 'স্ব-প্রতিবেদিত চাপ বেশি এবং শিগগিরই মেন্টর বা অভিভাবকের তা পর্যালোচনা করা উচিত।',
    emotionalLowConfidence: 'শিক্ষার্থী কম আত্মবিশ্বাসের কথা বলেছে, যা সহায়ক ফলো-আপ ও আশ্বাসের প্রয়োজন নির্দেশ করে।',
    emotionalStable: 'শুধু এই সেশনের ভিত্তিতে শিক্ষার্থীর আবেগগত সূচক তাৎক্ষণিক উচ্চ-ঝুঁকির ইঙ্গিত দেয় না।',
  },
  Odia: {
    reportTitle: 'EmotiSense ସାକ୍ଷାତ୍କାର ରିପୋର୍ଟ',
    greeting: (parentName, mentorName) => `ନମସ୍କାର ${parentName} ଏବଂ ${mentorName},`,
    latestSummary: (studentName) => `ଦୟାକରି ${studentName} ପାଇଁ ସବୁଠାରୁ ନବୀନ ସାକ୍ଷାତ୍କାର ସାରାଂଶ ଦେଖନ୍ତୁ।`,
    strengths: 'ଶକ୍ତିଗୁଡ଼ିକ',
    concerns: 'ଚିନ୍ତାବୋଧକ ବିଷୟ',
    nextSteps: 'ପରବର୍ତ୍ତୀ ପରାମର୍ଶିତ ପଦକ୍ଷେପ',
    communicationStyle: 'ଯୋଗାଯୋଗ ଶୈଳୀ',
    emotionalOverview: 'ଭାବନାତ୍ମକ ସାରାଂଶ',
    followUpPriority: 'ଫଲୋ-ଅପ୍ ପ୍ରାଥମିକତା',
    emotionalSignals: 'ଭାବନାତ୍ମକ ସଙ୍କେତ',
    stressLevel: 'ଚାପ ସ୍ତର',
    confidenceLevel: 'ଆତ୍ମବିଶ୍ୱାସ ସ୍ତର',
    cameraComfort: 'କ୍ୟାମେରା ସୁବିଧାବୋଧ',
    faceAnalysis: 'ମୁହଁ ବିଶ୍ଳେଷଣ',
    faceVisible: 'ମୁହଁ ସ୍ପଷ୍ଟ ଦେଖାଗଲା',
    dominantExpression: 'ମୁଖ୍ୟ ଅଭିବ୍ୟକ୍ତି',
    engagement: 'ସହଭାଗୀତା',
    eyeContact: 'ଚକ୍ଷୁ ସମ୍ପର୍କ',
    observations: 'ପର୍ଯ୍ୟବେକ୍ଷଣ',
    textTitle: (studentName) => `${studentName} ପାଇଁ EmotiSense ସାକ୍ଷାତ୍କାର ରିପୋର୍ଟ`,
    fallbackSummary: ({ fullName, durationMinutes, preferredLanguage, answeredQuestions, engagementScore, confidenceLevel, stressLevel }) =>
      `${fullName} ${preferredLanguage} ଭାଷାରେ ${durationMinutes} ମିନିଟ୍‌ର AI ସାକ୍ଷାତ୍କାର ସମାପ୍ତ କରିଛନ୍ତି। ଛାତ୍ର/ଛାତ୍ରୀ ${answeredQuestions}ଟି ପ୍ରଶ୍ନର ଉତ୍ତର ଦେଇଛନ୍ତି ଏବଂ ମୋଟ ସଂଲଗ୍ନତା ସ୍କୋର ${engagementScore}/100 ରହିଛି। ଉତ୍ତରଗୁଡ଼ିକରୁ ବର୍ତ୍ତମାନର ଆତ୍ମବିଶ୍ୱାସ ସ୍ତର ${confidenceLevel}/5 ଏବଂ ସ୍ୱୟଂ-ଜଣାଇଥିବା ଚାପ ସ୍ତର ${stressLevel}/5 ବୁଝାଯାଏ।`,
    fallbackStrengths: [
      'ଛାତ୍ର/ଛାତ୍ରୀ ଆତ୍ମ-ଜାଗୃକତା ଦେଖାଇଛନ୍ତି ଏବଂ ନିଜ ପ୍ରଗତିକୁ ଚିହ୍ନଟ କରିପାରନ୍ତି।',
      'କୌଣସି ସହାୟତା ତାଙ୍କ ପ୍ରଦର୍ଶନକୁ ଉନ୍ନତ କରେ ତାହା ସ୍ପଷ୍ଟ କରିପାରନ୍ତି।',
    ],
    fallbackConcerns: [
      'ଉଲ୍ଲେଖ କରାଯାଇଥିବା ଚାପ ଶିକ୍ଷାଗତ ନିୟମିତତା ଏବଂ ଭାବନାତ୍ମକ ସ୍ଥିରତାକୁ ପ୍ରଭାବିତ କରିପାରେ।',
      'ଉଲ୍ଲେଖ କରାଯାଇଥିବା ସମସ୍ୟାଗୁଡ଼ିକୁ ମେଣ୍ଟରଙ୍କ ଦ୍ୱାରା ପୁନଃ ଦେଖିବା ଉଚିତ।',
    ],
    fallbackActionItems: [
      'ଆସନ୍ତା ଗୋଟିଏ ମାସ ପାଇଁ ଛାତ୍ର/ଛାତ୍ରୀଙ୍କ ସହିତ ଗୋଟିଏ ମାପନଯୋଗ୍ୟ ଅଭ୍ୟାସ-ଲକ୍ଷ୍ୟ ନିର୍ଦ୍ଧାରଣ କରନ୍ତୁ।',
      'ଛାତ୍ର/ଛାତ୍ରୀଙ୍କ ଆବଶ୍ୟକତା ଅନୁଯାୟୀ ପରିବାର, ମେଣ୍ଟର ଏବଂ ଶିକ୍ଷକଙ୍କ ସହାୟତାକୁ ସମନ୍ୱୟ କରନ୍ତୁ।',
      'ଆତ୍ମବିଶ୍ୱାସ, ଚାପ ଏବଂ ସଂଯୋଗ ସ୍ପଷ୍ଟତାର ପରିବର୍ତ୍ତନ ଦେଖିବା ପାଇଁ କିଛି ସମୟ ପରେ ସାକ୍ଷାତ୍କାରଟି ପୁନରାବୃତ୍ତି କରନ୍ତୁ।',
    ],
    communicationDetailed: 'ଛାତ୍ର/ଛାତ୍ରୀ ତୁଳନାମୂଳକ ଭାବେ ବିସ୍ତୃତ ଉତ୍ତର ଦେଇଛନ୍ତି ଏବଂ ବ୍ୟକ୍ତିଗତ ଅନୁଭବ ବିଷୟରେ ଅଧିକ କହିବାକୁ ଇଚ୍ଛା ଦେଖାଇଛନ୍ତି।',
    communicationConcise: 'ଛାତ୍ର/ଛାତ୍ରୀ ସଂକ୍ଷିପ୍ତ ଉତ୍ତର ଦେଇଛନ୍ତି। ଅଧିକ ପରିପ୍ରେକ୍ଷ୍ୟ ପାଇଁ ଫଲୋ-ଅପ୍ ଆଲୋଚନା ଉପଯୋଗୀ ହୋଇପାରେ।',
    emotionalHighStress: 'ସ୍ୱୟଂ-ଜଣାଇଥିବା ଚାପ ଅଧିକ ରହିଛି ଏବଂ ନିକଟ ଭବିଷ୍ୟତରେ ମେଣ୍ଟର କିମ୍ବା ଅଭିଭାବକଙ୍କ ଦ୍ୱାରା ଏହା ପର୍ଯ୍ୟବେକ୍ଷଣ କରାଯିବା ଉଚିତ।',
    emotionalLowConfidence: 'ଛାତ୍ର/ଛାତ୍ରୀ କମ୍ ଆତ୍ମବିଶ୍ୱାସ ଦେଖାଇଛନ୍ତି, ଯାହା ସହାୟକ ଫଲୋ-ଅପ୍ ଏବଂ ଆଶ୍ୱାସନର ଆବଶ୍ୟକତା ସୂଚାଏ।',
    emotionalStable: 'କେବଳ ଏହି ସେସନ୍‌ର ଆଧାରରେ ଛାତ୍ର/ଛାତ୍ରୀଙ୍କ ଭାବନାତ୍ମକ ସଙ୍କେତ କୌଣସି ତୁରନ୍ତ ଉଚ୍ଚ-ଝୁମ୍ପ ଚିନ୍ତା ସୂଚାଏ ନାହିଁ।',
  },
  Other: {
    reportTitle: 'EmotiSense Interview Report',
    greeting: (parentName, mentorName) => `Hello ${parentName} and ${mentorName},`,
    latestSummary: (studentName) => `Please find the latest interview summary for ${studentName}.`,
    strengths: 'Strengths',
    concerns: 'Concerns',
    nextSteps: 'Recommended Next Steps',
    communicationStyle: 'Communication Style',
    emotionalOverview: 'Emotional Overview',
    followUpPriority: 'Follow-up Priority',
    emotionalSignals: 'Emotional Signals',
    stressLevel: 'Stress Level',
    confidenceLevel: 'Confidence Level',
    cameraComfort: 'Camera Comfort',
    faceAnalysis: 'Face Analysis',
    faceVisible: 'Face Visible',
    dominantExpression: 'Dominant Expression',
    engagement: 'Engagement',
    eyeContact: 'Eye Contact',
    observations: 'Observations',
    textTitle: (studentName) => `EmotiSense Interview Report for ${studentName}`,
    fallbackSummary: ({ fullName, durationMinutes, preferredLanguage, answeredQuestions, engagementScore, confidenceLevel, stressLevel }) =>
      `${fullName} completed a ${durationMinutes}-minute AI interview in ${preferredLanguage}. The student answered ${answeredQuestions} prompts with an overall engagement score of ${engagementScore}/100. Responses suggest a current confidence level of ${confidenceLevel}/5 and self-reported stress level of ${stressLevel}/5.`,
    fallbackStrengths: [
      'Shows self-awareness and can identify personal progress.',
      'Can clearly identify the support systems that improve performance.',
    ],
    fallbackConcerns: [
      'Reported stressors that may affect academic consistency and emotional stability.',
      'Described active challenges that should be revisited by a mentor.',
    ],
    fallbackActionItems: [
      'Help the student define one measurable habit goal for the next month.',
      'Coordinate support between family, mentor, and teachers around the student’s stated needs.',
      'Repeat the interview after a short interval to compare changes in confidence, stress, and communication clarity.',
    ],
    communicationDetailed: 'The student gave relatively detailed responses and appeared willing to elaborate on personal experiences.',
    communicationConcise: 'The student gave concise responses. Follow-up conversation may help uncover more detail and context.',
    emotionalHighStress: 'Self-reported stress is elevated and should be reviewed with a mentor or parent in the near term.',
    emotionalLowConfidence: 'The student reported lower confidence, suggesting a need for supportive follow-up and reassurance.',
    emotionalStable: 'The student’s self-reported emotional indicators do not suggest an immediate high-risk concern from this session alone.',
  },
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatLanguage = (language: string, otherLanguage?: string) => {
  return language === 'Other' && otherLanguage?.trim() ? otherLanguage.trim() : language;
};

const getPurposeLabel = (purpose: string, otherPurpose?: string) => {
  return purpose === 'Other' && otherPurpose?.trim() ? otherPurpose.trim() : purpose;
};

const includesAny = (value: string, keywords: string[]) => keywords.some((keyword) => value.includes(keyword));

const extractThemes = (answers: string[]) => {
  const joinedAnswers = answers.join(' ').toLowerCase();
  const mentionsProgress = includesAny(joinedAnswers, ['proud', 'achievement', 'improve', 'गर्व', 'बेहतर', 'উন্নতি', 'গর্ব']);
  const mentionsSupport = includesAny(joinedAnswers, ['teacher', 'mentor', 'family', 'शिक्षक', 'मेंट', 'परिवार', 'শিক্ষক', 'মেন্টর', 'পরিবার']);
  const mentionsStress = includesAny(joinedAnswers, ['stress', 'pressure', 'anxious', 'तनाव', 'दबाव', 'চাপ', 'উদ্বিগ্ন']);
  const mentionsChallenge = includesAny(joinedAnswers, ['difficult', 'challenge', 'struggle', 'चुनौती', 'मुश्किल', 'কঠিন', 'চ্যালেঞ্জ', 'সংগ্রাম']);
  const mentionsHabit = includesAny(joinedAnswers, ['habit', 'आदत', 'অভ্যাস']);

  const strengths = [
    mentionsProgress
      ? 'Shows self-awareness and can identify personal progress.'
      : 'Participated consistently through the guided interview.',
    mentionsSupport
      ? 'Can clearly identify the support systems that improve performance.'
      : 'Provided enough context to support follow-up mentoring.',
  ];

  const concerns = [
    mentionsStress
      ? 'Reported stressors that may affect academic consistency and emotional stability.'
      : 'No major emotional risk language was explicitly detected in the transcript.',
    mentionsChallenge
      ? 'Described active challenges that should be revisited by a mentor.'
      : 'Needs continued monitoring to validate whether low-detail answers reflect comfort or hesitation.',
  ];

  const actionItems = [
    mentionsHabit
      ? 'Review the student’s chosen improvement habit and set a one-month check-in.'
      : 'Help the student define one measurable habit goal for the next month.',
    mentionsSupport
      ? 'Coordinate support between family, mentor, and teachers around the student’s stated needs.'
      : 'Schedule a short follow-up to clarify what kind of support feels most effective to the student.',
    'Repeat the interview after a short interval to compare changes in confidence, stress, and communication clarity.',
  ];

  return { strengths, concerns, actionItems };
};

const buildSummary = (body: InterviewRequestBody): InterviewReport => {
  const { formData, transcript, durationSeconds } = body;
  const answers = transcript.map((entry) => entry.answer.trim()).filter(Boolean);
  const totalWords = answers.reduce((sum, answer) => sum + answer.split(/\s+/).filter(Boolean).length, 0);
  const answeredQuestions = answers.filter(
    (answer) => !includesAny(answer.toLowerCase(), ['no answer captured', 'कोई उत्तर रिकॉर्ड नहीं हुआ', 'কোনো উত্তর ধরা পড়েনি']),
  ).length;
  const engagementScore = Math.max(
    35,
    Math.min(100, Math.round(answeredQuestions * 10 + totalWords / Math.max(answeredQuestions || 1, 1))),
  );
  const preferredLanguage = formatLanguage(formData.language, formData.otherLanguage);
  const reportLanguage = REPORT_COPY[getReportLanguageKey(preferredLanguage)];
  const purpose = getPurposeLabel(formData.purpose, formData.otherPurpose);
  const themes = extractThemes(answers);
  const fallbackStrengths = [...reportLanguage.fallbackStrengths];
  const fallbackConcerns = [...reportLanguage.fallbackConcerns];
  const fallbackActionItems = [...reportLanguage.fallbackActionItems];

  if (!themes.strengths[0]?.includes('Participated consistently')) {
    fallbackStrengths[0] = reportLanguage.fallbackStrengths[0];
  } else {
    fallbackStrengths[0] =
      reportLanguage === REPORT_COPY.English || reportLanguage === REPORT_COPY.Other
        ? 'Participated consistently through the guided interview.'
        : fallbackStrengths[0];
  }

  if (!themes.strengths[1]?.includes('Provided enough context')) {
    fallbackStrengths[1] = reportLanguage.fallbackStrengths[1];
  } else {
    fallbackStrengths[1] =
      reportLanguage === REPORT_COPY.English || reportLanguage === REPORT_COPY.Other
        ? 'Provided enough context to support follow-up mentoring.'
        : fallbackStrengths[1];
  }

  if (themes.concerns[0]?.includes('No major emotional risk language')) {
    fallbackConcerns[0] =
      reportLanguage === REPORT_COPY.English || reportLanguage === REPORT_COPY.Other
        ? 'No major emotional risk language was explicitly detected in the transcript.'
        : reportLanguage.emotionalStable;
  }

  if (themes.concerns[1]?.includes('Needs continued monitoring')) {
    fallbackConcerns[1] =
      reportLanguage === REPORT_COPY.English || reportLanguage === REPORT_COPY.Other
        ? 'Needs continued monitoring to validate whether low-detail answers reflect comfort or hesitation.'
        : reportLanguage.communicationConcise;
  }

  if (themes.actionItems[0]?.includes('Review the student')) {
    fallbackActionItems[0] =
      reportLanguage === REPORT_COPY.English || reportLanguage === REPORT_COPY.Other
        ? 'Review the student’s chosen improvement habit and set a one-month check-in.'
        : reportLanguage.fallbackActionItems[0];
  }

  if (themes.actionItems[1]?.includes('Schedule a short follow-up')) {
    fallbackActionItems[1] =
      reportLanguage === REPORT_COPY.English || reportLanguage === REPORT_COPY.Other
        ? 'Schedule a short follow-up to clarify what kind of support feels most effective to the student.'
        : reportLanguage.fallbackActionItems[1];
  }

  return {
    student: {
      name: formData.fullName,
      institution: formData.institution,
      preferredLanguage,
      purpose,
    },
    summary: reportLanguage.fallbackSummary({
      fullName: formData.fullName,
      durationMinutes: Math.round(durationSeconds / 60) || 1,
      preferredLanguage,
      answeredQuestions,
      engagementScore,
      confidenceLevel: formData.confidenceLevel,
      stressLevel: formData.stressLevel,
    }),
    strengths: fallbackStrengths,
    concerns: fallbackConcerns,
    actionItems: fallbackActionItems,
    engagementScore,
    emotionalSignals: {
      stressLevel: formData.stressLevel,
      confidenceLevel: formData.confidenceLevel,
      cameraComfort: formData.comfortLevel,
    },
    communicationStyle:
      totalWords > 120
        ? reportLanguage.communicationDetailed
        : reportLanguage.communicationConcise,
    emotionalOverview:
      formData.stressLevel >= 4
        ? reportLanguage.emotionalHighStress
        : formData.confidenceLevel <= 2
          ? reportLanguage.emotionalLowConfidence
          : reportLanguage.emotionalStable,
    followUpPriority: formData.stressLevel >= 4 || formData.confidenceLevel <= 2 ? 'high' : totalWords < 40 ? 'medium' : 'low',
    faceAnalysis: {
      faceVisible: false,
      dominantExpression: 'Not available',
      engagement: 'Not available',
      eyeContact: 'Not available',
      observations: ['Facial analysis was not available for this session.'],
      reportSummary: 'Facial analysis was not available for this session.',
    },
    transcript,
  };
};

const buildAiReport = async (body: InterviewRequestBody): Promise<InterviewReport> => {
  const { formData, transcript, durationSeconds } = body;
  const preferredLanguage = formatLanguage(formData.language, formData.otherLanguage);
  const purpose = getPurposeLabel(formData.purpose, formData.otherPurpose);

  const data = await generateJsonFromAi<{
    summary: string;
    strengths: string[];
    concerns: string[];
    actionItems: string[];
    engagementScore: number;
    communicationStyle: string;
    emotionalOverview: string;
    followUpPriority: 'low' | 'medium' | 'high';
  }>([
    {
      role: 'system',
      content:
        `You write concise but thoughtful student interview analysis reports for parents and mentors. Return JSON only with keys: summary, strengths, concerns, actionItems, engagementScore, communicationStyle, emotionalOverview, followUpPriority. strengths, concerns, and actionItems must each contain exactly 3 short bullet strings. engagementScore must be an integer from 0 to 100. followUpPriority must be one of: low, medium, high. Do not diagnose mental health conditions. Use careful, non-alarmist language. Base the report only on the form data and transcript. Write the report entirely in ${preferredLanguage}. Do not mix languages.`,
    },
    {
      role: 'user',
      content: JSON.stringify({
        student: {
          name: formData.fullName,
          age: formData.age,
          gender: formData.gender,
          institution: formData.institution,
          studentId: formData.studentId,
          preferredLanguage,
          purpose,
          comfortLevel: formData.comfortLevel,
          stressLevel: formData.stressLevel,
          confidenceLevel: formData.confidenceLevel,
          personalComfortLevel: formData.personalComfortLevel,
        },
        durationSeconds,
        transcript,
      }),
    },
  ]);

  const fallback = buildSummary(body);

  return {
    student: fallback.student,
    summary: data.summary || fallback.summary,
    strengths: Array.isArray(data.strengths) && data.strengths.length > 0 ? data.strengths.slice(0, 3) : fallback.strengths,
    concerns: Array.isArray(data.concerns) && data.concerns.length > 0 ? data.concerns.slice(0, 3) : fallback.concerns,
    actionItems: Array.isArray(data.actionItems) && data.actionItems.length > 0 ? data.actionItems.slice(0, 3) : fallback.actionItems,
    engagementScore:
      typeof data.engagementScore === 'number' ? Math.max(0, Math.min(100, Math.round(data.engagementScore))) : fallback.engagementScore,
    emotionalSignals: fallback.emotionalSignals,
    communicationStyle: data.communicationStyle || fallback.communicationStyle,
    emotionalOverview: data.emotionalOverview || fallback.emotionalOverview,
    followUpPriority:
      data.followUpPriority === 'low' || data.followUpPriority === 'medium' || data.followUpPriority === 'high'
        ? data.followUpPriority
        : fallback.followUpPriority,
    faceAnalysis: fallback.faceAnalysis,
    transcript,
  };
};

const appendFaceAnalysis = (report: InterviewReport, faceAnalysis: FaceAnalysis): InterviewReport => ({
  ...report,
  faceAnalysis,
});

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const clientId = process.env.CLIENT_ID || process.env.SMTP_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.SMTP_CLIENT_SECRET || process.env.SMTP_PASS;
  const refreshToken = process.env.REFRESH_TOKEN || process.env.SMTP_REFRESH_TOKEN;

  if (!host || !user) {
    return null;
  }

  if (clientId && clientSecret && refreshToken) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
      },
    });
  }

  if (!pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const buildEmailHtml = (
  report: InterviewReport,
  language: string,
  parentName?: string,
  mentorName?: string,
) => {
  const copy = REPORT_COPY[getReportLanguageKey(language)];
  return `
  <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <h2 style="margin-bottom: 8px;">${escapeHtml(copy.reportTitle)}</h2>
    <p>${escapeHtml(copy.greeting(parentName || 'Parent', mentorName || 'Mentor'))}</p>
    <p>${escapeHtml(copy.latestSummary(report.student.name))}</p>
    <p>${escapeHtml(report.summary)}</p>
    <h3>${escapeHtml(copy.strengths)}</h3>
    <ul>${report.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h3>${escapeHtml(copy.concerns)}</h3>
    <ul>${report.concerns.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h3>${escapeHtml(copy.nextSteps)}</h3>
    <ul>${report.actionItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h3>${escapeHtml(copy.communicationStyle)}</h3>
    <p>${escapeHtml(report.communicationStyle)}</p>
    <h3>${escapeHtml(copy.emotionalOverview)}</h3>
    <p>${escapeHtml(report.emotionalOverview)}</p>
    <h3>${escapeHtml(copy.followUpPriority)}</h3>
    <p style="text-transform: capitalize;">${escapeHtml(report.followUpPriority)}</p>
    <h3>${escapeHtml(copy.emotionalSignals)}</h3>
    <p>${escapeHtml(copy.stressLevel)}: ${report.emotionalSignals.stressLevel}/5<br />${escapeHtml(copy.confidenceLevel)}: ${report.emotionalSignals.confidenceLevel}/5<br />${escapeHtml(copy.cameraComfort)}: ${escapeHtml(report.emotionalSignals.cameraComfort)}</p>
    <h3>${escapeHtml(copy.faceAnalysis)}</h3>
    <p>${escapeHtml(report.faceAnalysis.reportSummary)}</p>
    <p>${escapeHtml(copy.faceVisible)}: ${report.faceAnalysis.faceVisible ? 'Yes' : 'No'}<br />${escapeHtml(copy.dominantExpression)}: ${escapeHtml(report.faceAnalysis.dominantExpression)}<br />${escapeHtml(copy.engagement)}: ${escapeHtml(report.faceAnalysis.engagement)}<br />${escapeHtml(copy.eyeContact)}: ${escapeHtml(report.faceAnalysis.eyeContact)}</p>
    <h4>${escapeHtml(copy.observations)}</h4>
    <ul>${report.faceAnalysis.observations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
  </div>
`;
};

ReportRouter.post('/test-email', async (req: Request, res: Response) => {
  const { to } = req.body as {
    to?: string;
  };

  if (!to?.trim()) {
    res.status(400).json({ error: 'Recipient email is required.' });
    return;
  }

  const transporter = getTransporter();

  if (!transporter) {
    res.status(503).json({
      error: 'SMTP credentials are not configured on the backend.',
    });
    return;
  }

  try {
    await transporter.verify();

    await transporter.sendMail({
      from: process.env.REPORT_SENDER_EMAIL || process.env.SMTP_USER,
      to: to.trim(),
      subject: 'EmotiSense SMTP test email',
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin-bottom: 8px;">EmotiSense Email Test</h2>
          <p>This is a test email from the EmotiSense backend.</p>
          <p>If you received this message, the SMTP configuration is working.</p>
        </div>
      `,
      text: 'This is a test email from the EmotiSense backend. If you received this message, the SMTP configuration is working.',
    });

    res.status(200).json({
      sent: true,
      recipient: to.trim(),
      message: 'Test email sent successfully.',
    });
  } catch (error) {
    console.error('Failed to send test email', error);
    res.status(500).json({
      sent: false,
      recipient: to.trim(),
      error: error instanceof Error ? error.message : 'Failed to send test email.',
    });
  }
});

ReportRouter.post('/interview', async (req: Request, res: Response) => {
  const body = req.body as InterviewRequestBody;

  if (!body?.formData?.fullName || !body?.formData?.parentEmail || !body?.formData?.mentorEmail) {
    res.status(400).json({ error: 'Student name, parent email, and mentor email are required.' });
    return;
  }

  if (!Array.isArray(body.transcript) || body.transcript.length === 0) {
    res.status(400).json({ error: 'Interview transcript is required to generate the report.' });
    return;
  }

  let report: InterviewReport = buildSummary(body);
  const preferredLanguage = formatLanguage(body.formData.language, body.formData.otherLanguage);
  const emailCopy = REPORT_COPY[getReportLanguageKey(preferredLanguage)];

  if (isAiConfigured()) {
    try {
      report = await buildAiReport(body);
    } catch (error) {
      console.error('Failed to generate AI report, using fallback summary', error);
    }
  }

  if (isHuggingFaceConfigured() && Array.isArray(body.faceFrames) && body.faceFrames.length > 0) {
    try {
      const faceAnalysis = await analyzeFaceFrames(body.faceFrames.slice(0, 5));
      report = appendFaceAnalysis(report, faceAnalysis);
    } catch (error) {
      console.error('Failed to generate face analysis, using fallback summary', error);
    }
  }

  const recipients = [body.formData.parentEmail, body.formData.mentorEmail];
  const transporter = getTransporter();

  if (!transporter) {
    res.status(503).json({
      report,
      email: {
        sent: false,
        skipped: true,
        recipients,
        message: 'Report generated, but email was not sent because SMTP credentials are not configured on the backend.',
      },
    });
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.REPORT_SENDER_EMAIL || process.env.SMTP_USER,
      to: recipients.join(','),
      subject: `EmotiSense interview report for ${body.formData.fullName}`,
      html: buildEmailHtml(report, preferredLanguage, body.formData.parentName, body.formData.mentorName),
      text: [
        emailCopy.textTitle(body.formData.fullName),
        '',
        report.summary,
        '',
        `${emailCopy.strengths}:`,
        ...report.strengths.map((item) => `- ${item}`),
        '',
        `${emailCopy.concerns}:`,
        ...report.concerns.map((item) => `- ${item}`),
        '',
        `${emailCopy.nextSteps}:`,
        ...report.actionItems.map((item) => `- ${item}`),
        '',
        `${emailCopy.communicationStyle}:`,
        report.communicationStyle,
        '',
        `${emailCopy.emotionalOverview}:`,
        report.emotionalOverview,
        '',
        `${emailCopy.followUpPriority}: ${report.followUpPriority}`,
        '',
        `${emailCopy.faceAnalysis}:`,
        report.faceAnalysis.reportSummary,
        '',
        `${emailCopy.faceVisible}: ${report.faceAnalysis.faceVisible ? 'Yes' : 'No'}`,
        `${emailCopy.dominantExpression}: ${report.faceAnalysis.dominantExpression}`,
        `${emailCopy.engagement}: ${report.faceAnalysis.engagement}`,
        `${emailCopy.eyeContact}: ${report.faceAnalysis.eyeContact}`,
        '',
        `${emailCopy.observations}:`,
        ...report.faceAnalysis.observations.map((item) => `- ${item}`),
      ].join('\n'),
    });

    res.status(200).json({
      report,
      email: {
        sent: true,
        recipients,
        message: 'Interview report generated and emailed to the parent and mentor successfully.',
      },
    });
  } catch (error) {
    console.error('Failed to send interview report email', error);
    res.status(500).json({
      report,
      email: {
        sent: false,
        recipients,
        message: 'Report generated, but email delivery failed. Check SMTP credentials and server connectivity.',
      },
      error: 'Email delivery failed.',
    });
  }
});

export default ReportRouter;
