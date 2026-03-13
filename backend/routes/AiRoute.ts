import { Request, Response, Router } from 'express';
import { generateJsonFromAi, isAiConfigured } from '../lib/ai.js';

const AiRouter = Router();

const createFallbackQuestions = (name: string, purpose: string, language: string) => [
  `Hello ${name}. Please introduce yourself and tell me how you are feeling right now.`,
  `What motivated you to join this ${purpose} session today?`,
  `Tell me about a recent moment in your studies where you felt proud of yourself.`,
  'Describe a challenge that has been causing you stress and how you usually respond to it.',
  `How comfortable are you expressing your thoughts in ${language}?`,
  'What kind of support from teachers, mentors, or family helps you perform at your best?',
  'If you could improve one habit over the next month, what would it be and why?',
  'Before we finish, is there anything else you want us to understand about you?',
];

AiRouter.post('/interview-questions', async (req: Request, res: Response) => {
  const { fullName, purpose, language } = req.body as {
    fullName?: string;
    purpose?: string;
    language?: string;
  };

  const safeName = fullName?.trim() || 'student';
  const safePurpose = purpose?.trim() || 'self-reflection';
  const safeLanguage = language?.trim() || 'English';

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
          'You create emotionally safe interview questions for students. Return JSON only with key "questions". Generate exactly 8 short, supportive, age-appropriate questions. Every question must be written only in the requested language. Do not mix languages. Do not add numbering.',
      },
      {
        role: 'user',
        content: `Student name: ${safeName}
Purpose: ${safePurpose}
Language: ${safeLanguage}

Generate 8 interview questions for a live emotional and academic check-in.`,
      },
    ]);

    const questions = Array.isArray(data.questions)
      ? data.questions.map((question) => question.trim()).filter(Boolean).slice(0, 8)
      : [];

    if (questions.length !== 8) {
      throw new Error('AI did not return exactly 8 questions.');
    }

    res.status(200).json({ source: 'ai', questions });
  } catch (error) {
    console.error('Failed to generate AI interview questions', error);
    res.status(200).json({
      source: 'fallback',
      questions: createFallbackQuestions(safeName, safePurpose, safeLanguage),
    });
  }
});

export default AiRouter;
