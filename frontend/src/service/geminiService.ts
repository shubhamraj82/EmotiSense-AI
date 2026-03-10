import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const speakText = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioSrc = `data:audio/wav;base64,${base64Audio}`;
      const audio = new Audio(audioSrc);
      await audio.play();
      return audio;
    }
  } catch (error) {
    console.error("Error in TTS:", error);
  }
  return null;
};

export const askAssistant = async (question: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: ${context}\n\nQuestion: ${question}`,
      config: {
        systemInstruction: "You are a helpful AI voice assistant for a speech and facial analysis system. Answer questions briefly and clearly based on the provided instructions. If the question is not related to the instructions, politely redirect the user to the session guidelines.",
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error in Assistant Chat:", error);
    return "I'm sorry, I couldn't process that question right now.";
  }
};
