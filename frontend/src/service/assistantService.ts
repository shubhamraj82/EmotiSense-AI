const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const FAQ_RESPONSES: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['camera', 'video', 'face'],
    answer: 'Keep your face visible, centered, and well lit so the session can capture clear video.',
  },
  {
    keywords: ['mic', 'microphone', 'audio', 'voice'],
    answer: 'Use a quiet space and speak naturally at a steady pace so the microphone can capture your response clearly.',
  },
  {
    keywords: ['record', 'recording', 'privacy', 'consent'],
    answer: 'This session records the student camera and microphone for analysis only after consent has been accepted in setup.',
  },
  {
    keywords: ['parent', 'mentor', 'report'],
    answer: 'Parents and mentors receive the final behavioral report based on the permissions selected during setup.',
  },
];

export const cancelSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

const getFallbackAssistantAnswer = (question: string, context: string) => {
  const normalizedQuestion = question.toLowerCase();
  const matchedEntry = FAQ_RESPONSES.find((entry) =>
    entry.keywords.some((keyword) => normalizedQuestion.includes(keyword)),
  );

  if (matchedEntry) {
    return matchedEntry.answer;
  }

  return `Please follow the session guidelines carefully. ${context}. If you are unsure, stay visible on camera, speak clearly, and continue with the interview.`;
};

export const askAssistant = async (question: string, context: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sarvam/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt:
          'You are a concise session assistant for a student emotional check-in app. Answer only about setup, consent, recording, speaking clearly, visibility on camera, interview flow, and report sharing. Keep responses short, supportive, and practical. If the user asks something unrelated, redirect them to the interview instructions.',
        messages: [
          {
            role: 'user',
            content: `Question: ${question}\n\nSession guidelines: ${context}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get assistant response.');
    }

    const data = (await response.json()) as {
      answer?: string;
    };

    return data.answer?.trim() || getFallbackAssistantAnswer(question, context);
  } catch {
    return getFallbackAssistantAnswer(question, context);
  }
};
