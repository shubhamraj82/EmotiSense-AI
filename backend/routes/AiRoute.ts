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
    res.status(503).json({
      error: 'AI question generation is not configured on the backend.',
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
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to generate AI interview questions.',
    });
  }
});

export default AiRouter;
