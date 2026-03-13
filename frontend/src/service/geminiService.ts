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

export type SpeechController = {
  pause: () => void;
  onended: (() => void) | null;
};

export const cancelSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const speakText = async (text: string): Promise<SpeechController | null> => {
  if (!('speechSynthesis' in window)) {
    return null;
  }

  cancelSpeech();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    const controller: SpeechController = {
      onended: null,
      pause: () => {
        window.speechSynthesis.cancel();
      },
    };

    utterance.onend = () => {
      controller.onended?.();
    };

    window.speechSynthesis.speak(utterance);
    resolve(controller);
  });
};

export const askAssistant = async (question: string, context: string) => {
  const normalizedQuestion = question.toLowerCase();
  const matchedEntry = FAQ_RESPONSES.find((entry) =>
    entry.keywords.some((keyword) => normalizedQuestion.includes(keyword)),
  );

  if (matchedEntry) {
    return matchedEntry.answer;
  }

  return `Please follow the session guidelines carefully. ${context}. If you are unsure, stay visible on camera, speak clearly, and continue with the interview.`;
};
