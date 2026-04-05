type FaceAnalysis = {
  faceVisible: boolean;
  dominantExpression: string;
  engagement: string;
  eyeContact: string;
  observations: string[];
  reportSummary: string;
};

type ChatMessage = {
  role: 'system' | 'user';
  content: Array<
    | {
        type: 'text';
        text: string;
      }
    | {
        type: 'image_url';
        image_url: {
          url: string;
        };
      }
  >;
};

const HUGGING_FACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HUGGING_FACE_API_URL =
  process.env.HUGGINGFACE_API_URL || 'https://router.huggingface.co/v1/chat/completions';
const HUGGING_FACE_MODEL = process.env.HUGGINGFACE_VISION_MODEL || 'Qwen/Qwen2.5-VL-7B-Instruct';

const extractJson = <T>(content: string): T => {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```([\s\S]*?)```/i);
    if (!match) {
      throw new Error('Hugging Face response did not contain valid JSON.');
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

export const isHuggingFaceConfigured = () => Boolean(HUGGING_FACE_API_KEY);

export const analyzeFaceFrames = async (frames: string[]): Promise<FaceAnalysis> => {
  if (!HUGGING_FACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY is not configured.');
  }

  if (frames.length === 0) {
    throw new Error('No video frames were provided for facial analysis.');
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text:
            'You analyze student interview frames for a supportive educational report. Return JSON only with keys: faceVisible, dominantExpression, engagement, eyeContact, observations, reportSummary. observations must contain exactly 3 short bullet strings. Avoid identity claims, diagnosis, or sensitive trait inference. Keep the assessment observational and cautious.',
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text:
            'Analyze these sampled interview frames and summarize visible expression, attentiveness, and eye-contact consistency for a mentor/parent report.',
        },
        ...frames.map((frame) => ({
          type: 'image_url' as const,
          image_url: {
            url: frame,
          },
        })),
      ],
    },
  ];

  const response = await fetch(HUGGING_FACE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
    },
    body: JSON.stringify({
      model: HUGGING_FACE_MODEL,
      temperature: 0.2,
      max_tokens: 400,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face request failed: ${errorText}`);
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
    throw new Error('Hugging Face response did not include content.');
  }

  const parsed = extractJson<Partial<FaceAnalysis>>(content);

  return {
    faceVisible: Boolean(parsed.faceVisible),
    dominantExpression: parsed.dominantExpression?.trim() || 'Not available',
    engagement: parsed.engagement?.trim() || 'Not available',
    eyeContact: parsed.eyeContact?.trim() || 'Not available',
    observations:
      Array.isArray(parsed.observations) && parsed.observations.length > 0
        ? parsed.observations
            .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
            .filter(Boolean)
            .slice(0, 3)
        : ['Face analysis observations were not available.'],
    reportSummary: parsed.reportSummary?.trim() || 'Face analysis summary was not available.',
  };
};

export type { FaceAnalysis };
