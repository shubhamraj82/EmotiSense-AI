const SARVAM_API_BASE_URL = process.env.SARVAM_API_BASE_URL || 'https://api.sarvam.ai';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_TTS_MODEL = process.env.SARVAM_TTS_MODEL || 'bulbul:v3';
const SARVAM_STT_MODEL = process.env.SARVAM_STT_MODEL || 'saarika:v2.5';
const SARVAM_TTS_SPEAKER = process.env.SARVAM_TTS_SPEAKER || 'shubh';

type SynthesizeSpeechParams = {
  text: string;
  languageCode: string;
};

type TranscribeAudioParams = {
  audioBase64: string;
  mimeType?: string;
  languageCode?: string;
};

export const isSarvamConfigured = () => Boolean(SARVAM_API_KEY);

const getHeaders = () => {
  if (!SARVAM_API_KEY) {
    throw new Error('SARVAM_API_KEY is not configured.');
  }

  return {
    'Content-Type': 'application/json',
    'api-subscription-key': SARVAM_API_KEY,
  };
};

export const synthesizeSpeech = async ({ text, languageCode }: SynthesizeSpeechParams) => {
  const response = await fetch(`${SARVAM_API_BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      text,
      target_language_code: languageCode,
      model: SARVAM_TTS_MODEL,
      speaker: SARVAM_TTS_SPEAKER,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sarvam TTS request failed: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    audios?: string[];
  };

  const audioBase64 = Array.isArray(data.audios) ? data.audios[0] : '';
  if (!audioBase64) {
    throw new Error('Sarvam TTS response did not include audio.');
  }

  return Buffer.from(audioBase64, 'base64');
};

export const transcribeAudio = async ({
  audioBase64,
  mimeType = 'audio/webm',
  languageCode,
}: TranscribeAudioParams) => {
  if (!SARVAM_API_KEY) {
    throw new Error('SARVAM_API_KEY is not configured.');
  }

  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const formData = new FormData();
  const normalizedMimeType = mimeType.split(';')[0]?.trim() || 'audio/webm';
  const blob = new Blob([audioBuffer], { type: normalizedMimeType });
  const extension = normalizedMimeType.includes('wav')
    ? 'wav'
    : normalizedMimeType.includes('mp4') || normalizedMimeType.includes('m4a')
      ? 'm4a'
      : 'webm';

  formData.append('file', blob, `answer.${extension}`);
  formData.append('model', SARVAM_STT_MODEL);
  if (languageCode) {
    formData.append('language_code', languageCode);
  }

  const response = await fetch(`${SARVAM_API_BASE_URL}/speech-to-text`, {
    method: 'POST',
    headers: {
      'api-subscription-key': SARVAM_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Sarvam STT request failed: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    transcript?: string;
    language_code?: string | null;
  };

  return {
    transcript: data.transcript?.trim() || '',
    languageCode: data.language_code || null,
  };
};
