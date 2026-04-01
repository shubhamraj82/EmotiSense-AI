type ChatMessage = {
  role: 'system' | 'user';
  content: string;
};

const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

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

export const isAiConfigured = () => Boolean(CLAUDE_API_KEY);

export const generateJsonFromAi = async <T>(messages: ChatMessage[]) => {
  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY is not configured.');
  }

  const systemPrompt = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join('\n\n');

  const userPrompt = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join('\n\n');

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      temperature: 0.4,
      max_tokens: 1024,
      system: systemPrompt || undefined,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };

  const content = data.content
    ?.filter((entry) => entry.type === 'text' && typeof entry.text === 'string')
    .map((entry) => entry.text?.trim() || '')
    .filter(Boolean)
    .join('\n');

  if (!content) {
    throw new Error('AI response did not include content.');
  }

  return extractJson<T>(content);
};
