import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Circle, Download, Mic, PauseCircle, PlayCircle, SkipForward, Square, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormData, initialFormData } from '../lib/types';
import { cancelSpeech } from '../service/assistantService';
import { createQuestions, getLanguageConfig, getLanguageLabel, getSarvamLanguageCode } from '../lib/interview';
import { submitInterviewReport, TranscriptEntry } from '../service/reportService';
import { fetchInterviewQuestions } from '../service/aiService';
import { synthesizeInterviewSpeech, transcribeInterviewAnswer } from '../service/sarvamService';

const STORAGE_KEY = 'emotisense-session';

const getRecorderOptions = (): MediaRecorderOptions | undefined => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return undefined;
  }

  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    return { mimeType: 'video/webm;codecs=vp8,opus' };
  }

  if (MediaRecorder.isTypeSupported('video/webm')) {
    return { mimeType: 'video/webm' };
  }

  return undefined;
};

const getAudioRecorderOptions = (): MediaRecorderOptions | undefined => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return undefined;
  }

  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return { mimeType: 'audio/webm;codecs=opus' };
  }

  if (MediaRecorder.isTypeSupported('audio/webm')) {
    return { mimeType: 'audio/webm' };
  }

  return undefined;
};

export default function InterviewSession() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const answerRecorderRef = useRef<MediaRecorder | null>(null);
  const currentAnswerChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [sessionReady, setSessionReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [reportMessage, setReportMessage] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsSource, setQuestionsSource] = useState<'sarvam' | 'fallback'>('fallback');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(true);
  const [isTranscribingAnswer, setIsTranscribingAnswer] = useState(false);
  const [speechError, setSpeechError] = useState('');

  const fallbackQuestions = useMemo(() => createQuestions(formData), [formData]);
  const languageConfig = useMemo(() => getLanguageConfig(formData), [formData]);
  const sarvamLanguageCode = useMemo(() => getSarvamLanguageCode(formData), [formData]);
  const currentQuestion = questions[questionIndex] ?? '';

  const speakPrompt = async (text: string) => {
    if (!sarvamLanguageCode) {
      return;
    }

    await new Promise<void>((resolve) => {
      void (async () => {
        try {
          setSpeechError('');
          currentAudioRef.current?.pause();
          const audioBlob = await synthesizeInterviewSpeech(text, sarvamLanguageCode);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            if (currentAudioRef.current === audio) {
              currentAudioRef.current = null;
            }
            resolve();
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            if (currentAudioRef.current === audio) {
              currentAudioRef.current = null;
            }
            setSpeechError('Sarvam voice playback failed for this question.');
            resolve();
          };

          await audio.play();
        } catch (error) {
          console.error(error);
          setSpeechError('Sarvam voice playback failed for this question.');
          resolve();
        }
      })();
    });
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      navigate('/setup');
      return;
    }

    try {
      setFormData(JSON.parse(stored) as FormData);
    } catch {
      navigate('/setup');
    }
  }, [navigate]);

  useEffect(() => {
    let timerId: number | undefined;

    if (isInterviewActive && !isPaused) {
      timerId = window.setInterval(() => {
        setElapsedSeconds((seconds) => seconds + 1);
      }, 1000);
    }

    return () => {
      if (timerId) {
        window.clearInterval(timerId);
      }
    };
  }, [isInterviewActive, isPaused]);

  useEffect(() => {
    if (!formData.fullName) {
      return;
    }

    let isMounted = true;

    const loadQuestions = async () => {
      setIsGeneratingQuestions(true);

      try {
        const result = await fetchInterviewQuestions(formData);
        if (!isMounted) {
          return;
        }

        setQuestions(result.source === 'sarvam' && result.questions.length > 0 ? result.questions : fallbackQuestions);
        setQuestionsSource(result.source);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setQuestions(fallbackQuestions);
          setQuestionsSource('fallback');
        }
      } finally {
        if (isMounted) {
          setIsGeneratingQuestions(false);
        }
      }
    };

    void loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [fallbackQuestions, formData]);

  useEffect(() => {
    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const recorder = new MediaRecorder(stream, getRecorderOptions());
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setRecordingUrl(URL.createObjectURL(blob));
        };

        mediaRecorderRef.current = recorder;
        const audioStream = new MediaStream(stream.getAudioTracks());
        answerRecorderRef.current = new MediaRecorder(audioStream, getAudioRecorderOptions());
        setSessionReady(true);
      } catch (error) {
        console.error(error);
        setCameraError('Camera or microphone access was denied. Please allow permissions and reload the session.');
      }
    };

    setupMedia();

    return () => {
      cancelSpeech();
      currentAudioRef.current?.pause();
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  const startListening = () => {
    if (!answerRecorderRef.current) {
      return;
    }
    if (answerRecorderRef.current.state !== 'inactive') {
      return;
    }

    currentAnswerChunksRef.current = [];
    answerRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        currentAnswerChunksRef.current.push(event.data);
      }
    };
    answerRecorderRef.current.start();
    setIsListening(true);
    setCurrentAnswer('Listening for student response...');
  };

  const stopListening = () => {
    if (!answerRecorderRef.current || answerRecorderRef.current.state === 'inactive') {
      setIsListening(false);
      return Promise.resolve<Blob | null>(null);
    }

    return new Promise<Blob | null>((resolve) => {
      const recorder = answerRecorderRef.current;
      recorder.onstop = () => {
        setIsListening(false);
        const mimeType = currentAnswerChunksRef.current[0]?.type || 'audio/webm';
        resolve(currentAnswerChunksRef.current.length > 0 ? new Blob(currentAnswerChunksRef.current, { type: mimeType }) : null);
      };
      recorder.stop();
    });
  };

  const transcribeCurrentAnswer = async () => {
    const audioBlob = await stopListening();
    if (!audioBlob || !sarvamLanguageCode) {
      return currentAnswer.trim();
    }

    setIsTranscribingAnswer(true);
    setCurrentAnswer('Transcribing response...');

    try {
      const result = await transcribeInterviewAnswer(audioBlob, sarvamLanguageCode);
      const answer = result.transcript?.trim() || '';
      setCurrentAnswer(answer || languageConfig.noAnswerLabel);
      return answer;
    } catch (error) {
      console.error(error);
      setCurrentAnswer(languageConfig.noAnswerLabel);
      return '';
    } finally {
      setIsTranscribingAnswer(false);
    }
  };

  const askQuestion = async (index: number) => {
    const question = questions[index];
    if (!question) {
      return;
    }

    setQuestionIndex(index);
    setCurrentAnswer('');
    await stopListening();
    await speakPrompt(question);
    if (!isPaused && sarvamLanguageCode) {
      startListening();
    }
  };

  const startInterview = async () => {
    if (!sessionReady || !mediaRecorderRef.current) {
      return;
    }
    if (questions.length === 0 || isGeneratingQuestions) {
      return;
    }

    chunksRef.current = [];
    setTranscript([]);
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl('');
    }
    setElapsedSeconds(0);
    setReportStatus('idle');
    setReportMessage('');
    mediaRecorderRef.current.start(1000);
    setIsRecording(true);
    setIsInterviewActive(true);
    setIsPaused(false);
    await askQuestion(0);
  };

  const buildTranscriptSnapshot = (answerOverride?: string) => {
    if (!currentQuestion) {
      return transcript;
    }

    const filteredEntries = transcript.filter((entry) => entry.id !== questionIndex);
    return [
      ...filteredEntries,
      {
        id: questionIndex,
        question: currentQuestion,
        answer: answerOverride || currentAnswer || languageConfig.noAnswerLabel,
      },
    ].sort((left, right) => left.id - right.id);
  };

  const handleNextQuestion = async () => {
    const answer = await transcribeCurrentAnswer();
    setTranscript(buildTranscriptSnapshot(answer));
    const nextIndex = questionIndex + 1;
    if (nextIndex >= questions.length) {
      await handleEndInterview();
      return;
    }

    await askQuestion(nextIndex);
  };

  const handlePauseToggle = () => {
    if (!isInterviewActive) {
      return;
    }

    const nextPaused = !isPaused;
    setIsPaused(nextPaused);

    if (nextPaused) {
      cancelSpeech();
      currentAudioRef.current?.pause();
      void stopListening();
      mediaRecorderRef.current?.pause();
      setIsRecording(false);
      return;
    }

    mediaRecorderRef.current?.resume();
    setIsRecording(true);
    void (async () => {
      await speakPrompt(`Continuing session. ${currentQuestion}`);
      if (sarvamLanguageCode) {
        startListening();
      }
    })();
  };

  const handleEndInterview = async () => {
    const answer = await transcribeCurrentAnswer();
    const finalizedTranscript = buildTranscriptSnapshot(answer);
    setTranscript(finalizedTranscript);
    cancelSpeech();
    currentAudioRef.current?.pause();
    mediaRecorderRef.current?.stop();
    setIsInterviewActive(false);
    setIsRecording(false);
    setIsPaused(false);

    setReportStatus('submitting');
    setReportMessage(languageConfig.finishMessage);

    try {
      const response = await submitInterviewReport({
        formData,
        transcript: finalizedTranscript,
        durationSeconds: elapsedSeconds,
      });

      setReportStatus(response.email.sent ? 'sent' : 'error');
      setReportMessage(response.email.message);
    } catch (error) {
      setReportStatus('error');
      setReportMessage(error instanceof Error ? error.message : 'Failed to send interview report.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_35%),linear-gradient(180deg,_#020617,_#0f172a_55%,_#111827)] px-4 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">AI Interview Room</p>
            <h1 className="mt-2 text-3xl font-semibold">Student video on, AI interviewer audio only</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              The student camera and microphone are recorded locally while the AI asks interview questions one by one.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/setup" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10">
              Back to setup
            </Link>
            <div className="rounded-full bg-emerald-400/15 px-5 py-2.5 text-sm font-medium text-emerald-200">
              Session time {formatTime(elapsedSeconds)}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <motion.section layout className="overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <Camera className="size-5 text-cyan-300" />
                <div>
                  <p className="text-sm font-semibold">Student video feed</p>
                  <p className="text-xs text-slate-400">AI joins as voice only</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isRecording ? 'bg-rose-500/20 text-rose-200' : 'bg-white/10 text-slate-300'}`}>
                <Circle className={`size-3 ${isRecording ? 'fill-current' : ''}`} />
                {isRecording ? 'Recording' : 'Idle'}
              </div>
            </div>

            <div className="relative aspect-video bg-slate-950">
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              {!sessionReady && (
                <div className="absolute inset-0 grid place-items-center bg-slate-950/80 text-sm text-slate-200">
                  Preparing camera and microphone...
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 grid place-items-center bg-slate-950/90 p-6 text-center text-sm text-rose-200">
                  {cameraError}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              {!isInterviewActive ? (
                <button
                  onClick={() => void startInterview()}
                  disabled={!sessionReady || Boolean(cameraError) || isGeneratingQuestions || questions.length === 0 || !sarvamLanguageCode}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  <PlayCircle className="size-4" />
                  Start interview
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseToggle}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <PauseCircle className="size-4" />
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={() => void handleNextQuestion()}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                  >
                    <SkipForward className="size-4" />
                    Next question
                  </button>
                  <button
                    onClick={handleEndInterview}
                    className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
                  >
                    <Square className="size-4" />
                    End session
                  </button>
                </>
              )}

              {recordingUrl && (
                <a
                  href={recordingUrl}
                  download={`${(formData.fullName || 'student').replace(/\s+/g, '-').toLowerCase()}-interview.webm`}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
                >
                  <Download className="size-4" />
                  Download recording
                </a>
              )}
            </div>
          </motion.section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-cyan-200">
                <Volume2 className="size-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.3em]">AI Prompt</p>
              </div>
              <p className="mt-4 text-xl font-semibold">{currentQuestion || 'Start the interview to hear the first question.'}</p>
              <p className="mt-3 text-sm text-slate-300">
                Question {Math.min(questionIndex + 1, questions.length)} of {questions.length}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Interview language: {getLanguageLabel(formData)}
              </p>
              {!sarvamLanguageCode && (
                <p className="mt-2 text-xs text-amber-300">
                  Voice interview is available for English, Hindi, Bengali, and Odia.
                </p>
              )}
              {speechError && (
                <p className="mt-2 text-xs text-amber-300">{speechError}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                {isGeneratingQuestions
                  ? 'Generating personalized Sarvam questions...'
                  : questionsSource === 'sarvam'
                    ? 'Question set generated by Sarvam.'
                    : 'Using fallback question set.'}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-200">
                  <Mic className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.3em]">Student response</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isListening ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/10 text-slate-300'}`}>
                  {isTranscribingAnswer ? 'Transcribing' : isListening ? 'Listening' : 'Waiting'}
                </div>
              </div>
              <div className="mt-4 min-h-40 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-200">
                {currentAnswer || 'Sarvam will capture and transcribe the student response here after each answer.'}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Interview log</p>
              <div className="mt-4 space-y-3">
                {transcript.length === 0 ? (
                  <p className="text-sm text-slate-400">Saved answers will appear here as the interview progresses.</p>
                ) : (
                  transcript.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-sm font-semibold text-white">{entry.question}</p>
                      <p className="mt-2 text-sm text-slate-300">{entry.answer}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Report delivery</p>
              <p className={`mt-4 text-sm ${
                reportStatus === 'sent'
                  ? 'text-emerald-200'
                  : reportStatus === 'error'
                    ? 'text-amber-200'
                    : 'text-slate-300'
              }`}>
                {reportMessage || 'The final interview report will be generated when the session ends and sent to the parent and mentor emails from setup.'}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
