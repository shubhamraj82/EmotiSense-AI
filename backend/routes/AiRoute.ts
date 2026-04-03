import { Request, Response, Router } from 'express';
import { generateJsonFromAi, isAiConfigured } from '../lib/ai.js';

const AiRouter = Router();

type InterviewQuestionRequest = {
  fullName?: string;
  age?: string;
  gender?: string;
  institution?: string;
  studentId?: string;
  language?: string;
  comfortLevel?: string;
  duration?: string;
  purpose?: string;
  stressLevel?: number;
  confidenceLevel?: number;
  personalComfortLevel?: number;
  parentName?: string;
  mentorName?: string;
};

const createFallbackQuestions = (name: string, purpose: string, language: string) => {
  const normalizedLanguage = language.trim().toLowerCase();

  if (normalizedLanguage === 'hindi') {
    return [
      `नमस्ते ${name}। कृपया अपना परिचय दें और बताइए कि आप अभी कैसा महसूस कर रहे हैं।`,
      `आज इस ${purpose} सत्र में शामिल होने की आपकी क्या प्रेरणा थी?`,
      'अपनी पढ़ाई की किसी हाल की स्थिति के बारे में बताइए, जिसमें आपको अपने ऊपर गर्व महसूस हुआ हो।',
      'ऐसी किसी चुनौती के बारे में बताइए जो आपको तनाव देती है और आप आमतौर पर उसका सामना कैसे करते हैं।',
      `आप ${language} में अपने विचार व्यक्त करने में कितने सहज हैं?`,
      'शिक्षकों, मेंटर्स या परिवार से किस प्रकार का सहयोग आपको सबसे अधिक मदद करता है?',
      'यदि आप अगले एक महीने में एक आदत सुधार सकते हों, तो वह क्या होगी और क्यों?',
      'समाप्त करने से पहले क्या आप चाहते हैं कि हम आपके बारे में कुछ और समझें?',
    ];
  }

  if (normalizedLanguage === 'bengali') {
    return [
      `নমস্কার ${name}। অনুগ্রহ করে নিজের পরিচয় দিন এবং বলুন আপনি এখন কেমন অনুভব করছেন।`,
      `আজ এই ${purpose} সেশনে যোগ দিতে আপনাকে কী অনুপ্রাণিত করেছে?`,
      'তোমার পড়াশোনার সাম্প্রতিক এমন একটি ঘটনার কথা বলো, যেখানে তুমি নিজের জন্য গর্ব অনুভব করেছ।',
      'এমন একটি চ্যালেঞ্জের কথা বলো যা তোমার মধ্যে চাপ তৈরি করছে, এবং তুমি সাধারণত সেটার মোকাবিলা কীভাবে করো।',
      `তুমি ${language} ভাষায় নিজের ভাবনা প্রকাশ করতে কতটা স্বচ্ছন্দ?`,
      'শিক্ষক, মেন্টর বা পরিবারের কাছ থেকে কেমন সহায়তা পেলে তুমি সবচেয়ে বেশি উপকৃত হও?',
      'আগামী এক মাসে যদি তুমি একটি অভ্যাস উন্নত করতে পারো, সেটি কী হবে এবং কেন?',
      'শেষ করার আগে তুমি কি চাও আমরা তোমার সম্পর্কে আর কিছু জানি?',
    ];
  }

  if (normalizedLanguage === 'odia') {
    return [
      `ନମସ୍କାର ${name}। ଦୟାକରି ନିଜ ପରିଚୟ ଦିଅନ୍ତୁ ଏବଂ ଏବେ ଆପଣ କେମିତି ଅନୁଭବ କରୁଛନ୍ତି ସେଥି ଯାହାନ୍ତୁ।`,
      `ଆଜି ଏହି ${purpose} ସେସନ୍‌ରେ ଯୋଗ ଦେବାକୁ ଆପଣଙ୍କୁ କଣ ପ୍ରେରଣା ଦେଲା?`,
      'ଆପଣଙ୍କ ପଢ଼ାଶୁଣାର ଏକ ସମ୍ପ୍ରତିକ ଅନୁଭବ ବିଷୟରେ କହନ୍ତୁ ଯେଉଁଠାରେ ଆପଣ ନିଜପାଇଁ ଗର୍ବ ଅନୁଭବ କରିଥିଲେ।',
      'କୌଣସି ଏମିତି ଚ୍ୟାଲେଞ୍ଜ ବିଷୟରେ କହନ୍ତୁ ଯାହା ଆପଣଙ୍କୁ ଚାପ ଦେଉଛି, ଏବଂ ଆପଣ ସାଧାରଣତଃ ସେଥିପାଇଁ କିପରି ପ୍ରତିକ୍ରିୟା କରନ୍ତି।',
      `ଆପଣ ${language} ଭାଷାରେ ନିଜ ଚିନ୍ତାଧାରା ବ୍ୟକ୍ତ କରିବାରେ କେତେ ସୁବିଧାବାନ୍ ଅନୁଭବ କରନ୍ତି?`,
      'ଶିକ୍ଷକ, ମେଣ୍ଟର କିମ୍ବା ପରିବାରରୁ କେମିତି ସହଯୋଗ ଆପଣଙ୍କୁ ସର୍ବାଧିକ ସାହାଯ୍ୟ କରେ?',
      'ଆସନ୍ତା ଗୋଟିଏ ମାସରେ ଯଦି ଆପଣ ଗୋଟିଏ ଅଭ୍ୟାସ ସୁଧାରି ପାରିବେ, ସେଟା କଣ ହେବ ଏବଂ କାହିଁକି?',
      'ଶେଷ କରିବା ପୂର୍ବରୁ ଆପଣ ଚାହୁଁଛନ୍ତି କି ଆମେ ଆପଣଙ୍କ ବିଷୟରେ ଆଉ କିଛି ବୁଝୁ?',
    ];
  }

  return [
    `Hello ${name}. Please introduce yourself and tell me how you are feeling right now.`,
    `What motivated you to join this ${purpose} session today?`,
    `Tell me about a recent moment in your studies where you felt proud of yourself.`,
    'Describe a challenge that has been causing you stress and how you usually respond to it.',
    `How comfortable are you expressing your thoughts in ${language}?`,
    'What kind of support from teachers, mentors, or family helps you perform at your best?',
    'If you could improve one habit over the next month, what would it be and why?',
    'Before we finish, is there anything else you want us to understand about you?',
  ];
};

AiRouter.post('/interview-questions', async (req: Request, res: Response) => {
  const {
    fullName,
    age,
    gender,
    institution,
    studentId,
    language,
    comfortLevel,
    duration,
    purpose,
    stressLevel,
    confidenceLevel,
    personalComfortLevel,
    parentName,
    mentorName,
  } = req.body as InterviewQuestionRequest;

  const safeName = fullName?.trim() || 'student';
  const safePurpose = purpose?.trim() || 'self-reflection';
  const safeLanguage = language?.trim() || 'English';
  const safeAge = age?.trim() || 'not provided';
  const safeGender = gender?.trim() || 'not provided';
  const safeInstitution = institution?.trim() || 'not provided';
  const safeStudentId = studentId?.trim() || 'not provided';
  const safeComfortLevel = comfortLevel?.trim() || 'not provided';
  const safeDuration = duration?.trim() || 'not provided';
  const safeParentName = parentName?.trim() || 'not provided';
  const safeMentorName = mentorName?.trim() || 'not provided';

  if (!isAiConfigured()) {
    res.status(200).json({
      source: 'fallback',
      questions: createFallbackQuestions(safeName, safePurpose, safeLanguage),
    });
    return;
  }

  try {
    const data = await generateJsonFromAi<{ questions: string[] }>([
      {
        role: 'system',
        content:
          'You create emotionally safe interview questions for students. Return valid JSON only with the key "questions". Generate exactly 8 short, supportive, age-appropriate questions. Personalize them using the provided student form details. Focus on emotional wellbeing, communication comfort, confidence, academic context, and session purpose. Avoid sensitive or accusatory phrasing. Every question must be written only in the requested language. Do not mix languages. Do not add numbering.',
      },
      {
        role: 'user',
        content: `Student name: ${safeName}
Age: ${safeAge}
Gender: ${safeGender}
Institution: ${safeInstitution}
Student ID: ${safeStudentId}
Purpose: ${safePurpose}
Language: ${safeLanguage}
Preferred session duration: ${safeDuration}
Speaking comfort level: ${safeComfortLevel}
Stress level (1-5): ${stressLevel ?? 'not provided'}
Confidence level (1-5): ${confidenceLevel ?? 'not provided'}
Personal comfort level (1-5): ${personalComfortLevel ?? 'not provided'}
Parent/guardian name: ${safeParentName}
Mentor name: ${safeMentorName}

Generate 8 interview questions for a live emotional and academic check-in.`,
      },
    ]);

    const questions = Array.isArray(data.questions)
      ? data.questions.map((question) => question.trim()).filter(Boolean).slice(0, 8)
      : [];

    if (questions.length !== 8) {
      throw new Error('AI did not return exactly 8 questions.');
    }

    res.status(200).json({ source: 'sarvam', questions });
  } catch (error) {
    console.error('Failed to generate AI interview questions', error);
    res.status(200).json({
      source: 'fallback',
      questions: createFallbackQuestions(safeName, safePurpose, safeLanguage),
    });
  }
});

export default AiRouter;
