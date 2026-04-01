import { Request, Response, Router } from 'express';
import { isSarvamConfigured, synthesizeSpeech, transcribeAudio } from '../lib/sarvam.js';

const SarvamRouter = Router();

SarvamRouter.post('/tts', async (req: Request, res: Response) => {
  const { text, languageCode } = req.body as {
    text?: string;
    languageCode?: string;
  };

  if (!text?.trim()) {
    res.status(400).json({ message: 'Text is required.' });
    return;
  }

  if (!languageCode?.trim()) {
    res.status(400).json({ message: 'languageCode is required.' });
    return;
  }

  if (!isSarvamConfigured()) {
    res.status(503).json({ message: 'Sarvam API key is not configured.' });
    return;
  }

  try {
    const audioBuffer = await synthesizeSpeech({
      text: text.trim(),
      languageCode: languageCode.trim(),
    });

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(audioBuffer);
  } catch (error) {
    console.error('Failed to synthesize speech with Sarvam', error);
    res.status(502).json({
      message: error instanceof Error ? error.message : 'Failed to synthesize speech.',
    });
  }
});

SarvamRouter.post('/stt', async (req: Request, res: Response) => {
  const { audioBase64, mimeType, languageCode } = req.body as {
    audioBase64?: string;
    mimeType?: string;
    languageCode?: string;
  };

  if (!audioBase64?.trim()) {
    res.status(400).json({ message: 'audioBase64 is required.' });
    return;
  }

  if (!isSarvamConfigured()) {
    res.status(503).json({ message: 'Sarvam API key is not configured.' });
    return;
  }

  try {
    const result = await transcribeAudio({
      audioBase64,
      mimeType,
      languageCode,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to transcribe speech with Sarvam', error);
    res.status(502).json({
      message: error instanceof Error ? error.message : 'Failed to transcribe speech.',
    });
  }
});

export default SarvamRouter;
