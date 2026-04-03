type ChatMessage = {
  role: 'system' | 'user';
  content: string;
};

const SARVAM_API_BASE_URL = process.env.SARVAM_API_BASE_URL || 'https://api.sarvam.ai';
const SARVAM_CHAT_API_URL = process.env.SARVAM_CHAT_API_URL || `${SARVAM_API_BASE_URL}/v1/chat/completions`;
const SARVAM_CHAT_MODEL = process.env.SARVAM_CHAT_MODEL || 'sarvam-m';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

const extractJson = <T>(content: string): T => {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```([\s\S]*?)```/i);
    if (!match) {
      throw new Error('AI response did not contain valid JSON.');
    }

    return JSON.parse(match[1].trim()) as T;
  }
};

const getTextContent = (content: unknown) => {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry.trim();
        }

        if (entry && typeof entry === 'object' && 'text' in entry && typeof entry.text === 'string') {
          return entry.text.trim();
        }

        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

export const isAiConfigured = () => Boolean(SARVAM_API_KEY);

export const generateTextFromAi = async (messages: ChatMessage[]) => {
  if (!SARVAM_API_KEY) {
    throw new Error('SARVAM_API_KEY is not configured.');
  }

  const response = await fetch(SARVAM_CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': SARVAM_API_KEY,
    },
    body: JSON.stringify({
      model: SARVAM_CHAT_MODEL,
      temperature: 0.4,
      max_tokens: 1024,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content.trim(),
      })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam chat request failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };

  const content = getTextContent(data.choices?.[0]?.message?.content);

  if (!content) {
    throw new Error('AI response did not include content.');
  }

  return content;
};

export const generateJsonFromAi = async <T>(messages: ChatMessage[]) => {
  const content = await generateTextFromAi(messages);
  return extractJson<T>(content);
};
