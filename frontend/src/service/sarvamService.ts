const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const toBase64 = (arrayBuffer: ArrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
};

export const synthesizeInterviewSpeech = async (text: string, languageCode: string) => {
  const response = await fetch(`${API_BASE_URL}/api/sarvam/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      languageCode,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to synthesize speech.');
  }

  return response.blob();
};

export const transcribeInterviewAnswer = async (audioBlob: Blob, languageCode: string) => {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64 = toBase64(arrayBuffer);

  const response = await fetch(`${API_BASE_URL}/api/sarvam/stt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: audioBlob.type || 'audio/webm',
      languageCode,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to transcribe answer.');
  }

  return (await response.json()) as {
    transcript?: string;
    languageCode?: string | null;
  };
};
