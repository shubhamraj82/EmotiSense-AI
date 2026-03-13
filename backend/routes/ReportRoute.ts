import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { generateJsonFromAi, isAiConfigured } from '../lib/ai.js';

type TranscriptEntry = {
  id: number;
  question: string;
  answer: string;
};

type InterviewRequestBody = {
  formData: {
    fullName: string;
    institution: string;
    language: string;
    otherLanguage?: string;
    purpose: string;
    otherPurpose?: string;
    comfortLevel: string;
    stressLevel: number;
    confidenceLevel: number;
    parentName?: string;
    parentEmail: string;
    mentorName?: string;
    mentorEmail: string;
  };
  transcript: TranscriptEntry[];
  durationSeconds: number;
};

const ReportRouter = Router();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatLanguage = (language: string, otherLanguage?: string) => {
  return language === 'Other' && otherLanguage?.trim() ? otherLanguage.trim() : language;
};

const getPurposeLabel = (purpose: string, otherPurpose?: string) => {
  return purpose === 'Other' && otherPurpose?.trim() ? otherPurpose.trim() : purpose;
};

const includesAny = (value: string, keywords: string[]) => keywords.some((keyword) => value.includes(keyword));

const extractThemes = (answers: string[]) => {
  const joinedAnswers = answers.join(' ').toLowerCase();
  const mentionsProgress = includesAny(joinedAnswers, ['proud', 'achievement', 'improve', 'गर्व', 'बेहतर', 'উন্নতি', 'গর্ব']);
  const mentionsSupport = includesAny(joinedAnswers, ['teacher', 'mentor', 'family', 'शिक्षक', 'मेंट', 'परिवार', 'শিক্ষক', 'মেন্টর', 'পরিবার']);
  const mentionsStress = includesAny(joinedAnswers, ['stress', 'pressure', 'anxious', 'तनाव', 'दबाव', 'চাপ', 'উদ্বিগ্ন']);
  const mentionsChallenge = includesAny(joinedAnswers, ['difficult', 'challenge', 'struggle', 'चुनौती', 'मुश्किल', 'কঠিন', 'চ্যালেঞ্জ', 'সংগ্রাম']);
  const mentionsHabit = includesAny(joinedAnswers, ['habit', 'आदत', 'অভ্যাস']);

  const strengths = [
    mentionsProgress
      ? 'Shows self-awareness and can identify personal progress.'
      : 'Participated consistently through the guided interview.',
    mentionsSupport
      ? 'Can clearly identify the support systems that improve performance.'
      : 'Provided enough context to support follow-up mentoring.',
  ];

  const concerns = [
    mentionsStress
      ? 'Reported stressors that may affect academic consistency and emotional stability.'
      : 'No major emotional risk language was explicitly detected in the transcript.',
    mentionsChallenge
      ? 'Described active challenges that should be revisited by a mentor.'
      : 'Needs continued monitoring to validate whether low-detail answers reflect comfort or hesitation.',
  ];

  const actionItems = [
    mentionsHabit
      ? 'Review the student’s chosen improvement habit and set a one-month check-in.'
      : 'Help the student define one measurable habit goal for the next month.',
    mentionsSupport
      ? 'Coordinate support between family, mentor, and teachers around the student’s stated needs.'
      : 'Schedule a short follow-up to clarify what kind of support feels most effective to the student.',
    'Repeat the interview after a short interval to compare changes in confidence, stress, and communication clarity.',
  ];

  return { strengths, concerns, actionItems };
};

const buildSummary = (body: InterviewRequestBody) => {
  const { formData, transcript, durationSeconds } = body;
  const answers = transcript.map((entry) => entry.answer.trim()).filter(Boolean);
  const totalWords = answers.reduce((sum, answer) => sum + answer.split(/\s+/).filter(Boolean).length, 0);
  const answeredQuestions = answers.filter(
    (answer) => !includesAny(answer.toLowerCase(), ['no answer captured', 'कोई उत्तर रिकॉर्ड नहीं हुआ', 'কোনো উত্তর ধরা পড়েনি']),
  ).length;
  const engagementScore = Math.max(
    35,
    Math.min(100, Math.round(answeredQuestions * 10 + totalWords / Math.max(answeredQuestions || 1, 1))),
  );
  const preferredLanguage = formatLanguage(formData.language, formData.otherLanguage);
  const purpose = getPurposeLabel(formData.purpose, formData.otherPurpose);
  const themes = extractThemes(answers);

  return {
    student: {
      name: formData.fullName,
      institution: formData.institution,
      preferredLanguage,
      purpose,
    },
    summary: `${formData.fullName} completed a ${Math.round(durationSeconds / 60) || 1}-minute AI interview in ${preferredLanguage}. The student answered ${answeredQuestions} prompts with an overall engagement score of ${engagementScore}/100. Responses suggest a current confidence level of ${formData.confidenceLevel}/5 and self-reported stress level of ${formData.stressLevel}/5.`,
    strengths: themes.strengths,
    concerns: themes.concerns,
    actionItems: themes.actionItems,
    engagementScore,
    emotionalSignals: {
      stressLevel: formData.stressLevel,
      confidenceLevel: formData.confidenceLevel,
      cameraComfort: formData.comfortLevel,
    },
    transcript,
  };
};

const buildAiReport = async (body: InterviewRequestBody) => {
  const { formData, transcript, durationSeconds } = body;
  const preferredLanguage = formatLanguage(formData.language, formData.otherLanguage);
  const purpose = getPurposeLabel(formData.purpose, formData.otherPurpose);

  const data = await generateJsonFromAi<{
    summary: string;
    strengths: string[];
    concerns: string[];
    actionItems: string[];
    engagementScore: number;
  }>([
    {
      role: 'system',
      content:
        'You write concise student interview reports for parents and mentors. Return JSON only with keys: summary, strengths, concerns, actionItems, engagementScore. strengths, concerns, and actionItems must each contain exactly 3 short bullet strings. engagementScore must be an integer from 0 to 100. Write the report in English.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        student: {
          name: formData.fullName,
          institution: formData.institution,
          preferredLanguage,
          purpose,
          comfortLevel: formData.comfortLevel,
          stressLevel: formData.stressLevel,
          confidenceLevel: formData.confidenceLevel,
        },
        durationSeconds,
        transcript,
      }),
    },
  ]);

  const fallback = buildSummary(body);

  return {
    student: fallback.student,
    summary: data.summary || fallback.summary,
    strengths: Array.isArray(data.strengths) && data.strengths.length > 0 ? data.strengths.slice(0, 3) : fallback.strengths,
    concerns: Array.isArray(data.concerns) && data.concerns.length > 0 ? data.concerns.slice(0, 3) : fallback.concerns,
    actionItems: Array.isArray(data.actionItems) && data.actionItems.length > 0 ? data.actionItems.slice(0, 3) : fallback.actionItems,
    engagementScore:
      typeof data.engagementScore === 'number' ? Math.max(0, Math.min(100, Math.round(data.engagementScore))) : fallback.engagementScore,
    emotionalSignals: fallback.emotionalSignals,
    transcript,
  };
};

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const buildEmailHtml = (
  report: ReturnType<typeof buildSummary>,
  parentName?: string,
  mentorName?: string,
) => `
  <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <h2 style="margin-bottom: 8px;">EmotiSense Interview Report</h2>
    <p>Hello ${escapeHtml(parentName || 'Parent')} and ${escapeHtml(mentorName || 'Mentor')},</p>
    <p>Please find the latest interview summary for <strong>${escapeHtml(report.student.name)}</strong>.</p>
    <p>${escapeHtml(report.summary)}</p>
    <h3>Strengths</h3>
    <ul>${report.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h3>Concerns</h3>
    <ul>${report.concerns.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h3>Recommended Next Steps</h3>
    <ul>${report.actionItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h3>Emotional Signals</h3>
    <p>Stress Level: ${report.emotionalSignals.stressLevel}/5<br />Confidence Level: ${report.emotionalSignals.confidenceLevel}/5<br />Camera Comfort: ${escapeHtml(report.emotionalSignals.cameraComfort)}</p>
  </div>
`;

ReportRouter.post('/interview', async (req: Request, res: Response) => {
  const body = req.body as InterviewRequestBody;

  if (!body?.formData?.fullName || !body?.formData?.parentEmail || !body?.formData?.mentorEmail) {
    res.status(400).json({ error: 'Student name, parent email, and mentor email are required.' });
    return;
  }

  if (!Array.isArray(body.transcript) || body.transcript.length === 0) {
    res.status(400).json({ error: 'Interview transcript is required to generate the report.' });
    return;
  }

  let report = buildSummary(body);

  if (isAiConfigured()) {
    try {
      report = await buildAiReport(body);
    } catch (error) {
      console.error('Failed to generate AI report, using fallback summary', error);
    }
  }
  const recipients = [body.formData.parentEmail, body.formData.mentorEmail];
  const transporter = getTransporter();

  if (!transporter) {
    res.status(503).json({
      report,
      email: {
        sent: false,
        skipped: true,
        recipients,
        message: 'Report generated, but email was not sent because SMTP credentials are not configured on the backend.',
      },
    });
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.REPORT_SENDER_EMAIL || process.env.SMTP_USER,
      to: recipients.join(','),
      subject: `EmotiSense interview report for ${body.formData.fullName}`,
      html: buildEmailHtml(report, body.formData.parentName, body.formData.mentorName),
      text: [
        `EmotiSense Interview Report for ${body.formData.fullName}`,
        '',
        report.summary,
        '',
        'Strengths:',
        ...report.strengths.map((item) => `- ${item}`),
        '',
        'Concerns:',
        ...report.concerns.map((item) => `- ${item}`),
        '',
        'Recommended Next Steps:',
        ...report.actionItems.map((item) => `- ${item}`),
      ].join('\n'),
    });

    res.status(200).json({
      report,
      email: {
        sent: true,
        recipients,
        message: 'Interview report generated and emailed to the parent and mentor successfully.',
      },
    });
  } catch (error) {
    console.error('Failed to send interview report email', error);
    res.status(500).json({
      report,
      email: {
        sent: false,
        recipients,
        message: 'Report generated, but email delivery failed. Check SMTP credentials and server connectivity.',
      },
      error: 'Email delivery failed.',
    });
  }
});

export default ReportRouter;
