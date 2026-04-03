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
    age?: string;
    gender?: string;
    institution: string;
    studentId?: string;
    language: string;
    otherLanguage?: string;
    purpose: string;
    otherPurpose?: string;
    comfortLevel: string;
    stressLevel: number;
    confidenceLevel: number;
    personalComfortLevel?: number;
    parentName?: string;
    parentEmail: string;
    mentorName?: string;
    mentorEmail: string;
  };
  transcript: TranscriptEntry[];
  durationSeconds: number;
};

type InterviewReport = {
  student: {
    name: string;
    institution: string;
    preferredLanguage: string;
    purpose: string;
  };
  summary: string;
  strengths: string[];
  concerns: string[];
  actionItems: string[];
  engagementScore: number;
  emotionalSignals: {
    stressLevel: number;
    confidenceLevel: number;
    cameraComfort: string;
  };
  communicationStyle: string;
  emotionalOverview: string;
  followUpPriority: 'low' | 'medium' | 'high';
  transcript: TranscriptEntry[];
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

const buildSummary = (body: InterviewRequestBody): InterviewReport => {
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
    communicationStyle:
      totalWords > 120
        ? 'The student gave relatively detailed responses and appeared willing to elaborate on personal experiences.'
        : 'The student gave concise responses. Follow-up conversation may help uncover more detail and context.',
    emotionalOverview:
      formData.stressLevel >= 4
        ? 'Self-reported stress is elevated and should be reviewed with a mentor or parent in the near term.'
        : formData.confidenceLevel <= 2
          ? 'The student reported lower confidence, suggesting a need for supportive follow-up and reassurance.'
          : 'The student’s self-reported emotional indicators do not suggest an immediate high-risk concern from this session alone.',
    followUpPriority: formData.stressLevel >= 4 || formData.confidenceLevel <= 2 ? 'high' : totalWords < 40 ? 'medium' : 'low',
    transcript,
  };
};

const buildAiReport = async (body: InterviewRequestBody): Promise<InterviewReport> => {
  const { formData, transcript, durationSeconds } = body;
  const preferredLanguage = formatLanguage(formData.language, formData.otherLanguage);
  const purpose = getPurposeLabel(formData.purpose, formData.otherPurpose);

  const data = await generateJsonFromAi<{
    summary: string;
    strengths: string[];
    concerns: string[];
    actionItems: string[];
    engagementScore: number;
    communicationStyle: string;
    emotionalOverview: string;
    followUpPriority: 'low' | 'medium' | 'high';
  }>([
    {
      role: 'system',
      content:
        'You write concise but thoughtful student interview analysis reports for parents and mentors. Return JSON only with keys: summary, strengths, concerns, actionItems, engagementScore, communicationStyle, emotionalOverview, followUpPriority. strengths, concerns, and actionItems must each contain exactly 3 short bullet strings. engagementScore must be an integer from 0 to 100. followUpPriority must be one of: low, medium, high. Do not diagnose mental health conditions. Use careful, non-alarmist language. Base the report only on the form data and transcript. Write the report in English.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        student: {
          name: formData.fullName,
          age: formData.age,
          gender: formData.gender,
          institution: formData.institution,
          studentId: formData.studentId,
          preferredLanguage,
          purpose,
          comfortLevel: formData.comfortLevel,
          stressLevel: formData.stressLevel,
          confidenceLevel: formData.confidenceLevel,
          personalComfortLevel: formData.personalComfortLevel,
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
    communicationStyle: data.communicationStyle || fallback.communicationStyle,
    emotionalOverview: data.emotionalOverview || fallback.emotionalOverview,
    followUpPriority:
      data.followUpPriority === 'low' || data.followUpPriority === 'medium' || data.followUpPriority === 'high'
        ? data.followUpPriority
        : fallback.followUpPriority,
    transcript,
  };
};

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const clientId = process.env.CLIENT_ID || process.env.SMTP_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.SMTP_CLIENT_SECRET || process.env.SMTP_PASS;
  const refreshToken = process.env.REFRESH_TOKEN || process.env.SMTP_REFRESH_TOKEN;

  if (!host || !user) {
    return null;
  }

  if (clientId && clientSecret && refreshToken) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
      },
    });
  }

  if (!pass) {
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
  report: InterviewReport,
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
    <h3>Communication Style</h3>
    <p>${escapeHtml(report.communicationStyle)}</p>
    <h3>Emotional Overview</h3>
    <p>${escapeHtml(report.emotionalOverview)}</p>
    <h3>Follow-up Priority</h3>
    <p style="text-transform: capitalize;">${escapeHtml(report.followUpPriority)}</p>
    <h3>Emotional Signals</h3>
    <p>Stress Level: ${report.emotionalSignals.stressLevel}/5<br />Confidence Level: ${report.emotionalSignals.confidenceLevel}/5<br />Camera Comfort: ${escapeHtml(report.emotionalSignals.cameraComfort)}</p>
  </div>
`;

ReportRouter.post('/test-email', async (req: Request, res: Response) => {
  const { to } = req.body as {
    to?: string;
  };

  if (!to?.trim()) {
    res.status(400).json({ error: 'Recipient email is required.' });
    return;
  }

  const transporter = getTransporter();

  if (!transporter) {
    res.status(503).json({
      error: 'SMTP credentials are not configured on the backend.',
    });
    return;
  }

  try {
    await transporter.verify();

    await transporter.sendMail({
      from: process.env.REPORT_SENDER_EMAIL || process.env.SMTP_USER,
      to: to.trim(),
      subject: 'EmotiSense SMTP test email',
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin-bottom: 8px;">EmotiSense Email Test</h2>
          <p>This is a test email from the EmotiSense backend.</p>
          <p>If you received this message, the SMTP configuration is working.</p>
        </div>
      `,
      text: 'This is a test email from the EmotiSense backend. If you received this message, the SMTP configuration is working.',
    });

    res.status(200).json({
      sent: true,
      recipient: to.trim(),
      message: 'Test email sent successfully.',
    });
  } catch (error) {
    console.error('Failed to send test email', error);
    res.status(500).json({
      sent: false,
      recipient: to.trim(),
      error: error instanceof Error ? error.message : 'Failed to send test email.',
    });
  }
});

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

  let report: InterviewReport = buildSummary(body);

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
        '',
        'Communication Style:',
        report.communicationStyle,
        '',
        'Emotional Overview:',
        report.emotionalOverview,
        '',
        `Follow-up Priority: ${report.followUpPriority}`,
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
