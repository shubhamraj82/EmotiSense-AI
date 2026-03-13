type ChatMessage = {
  role: 'system' | 'user';
  content: string;
};

const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const AI_API_KEY = process.env.AI_API_KEY;

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

export const isAiConfigured = () => Boolean(AI_API_KEY);

export const generateJsonFromAi = async <T>(messages: ChatMessage[]) => {
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured.');
  }

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI response did not include content.');
  }

  return extractJson<T>(content);
};
