import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Circle, Download, Mic, PauseCircle, PlayCircle, SkipForward, Square, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormData, initialFormData } from '../lib/types';
import { cancelSpeech, speakText } from '../service/geminiService';

type TranscriptEntry = {
  id: number;
  question: string;
  answer: string;
};

type SpeechRecognitionCtor = new () => SpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
  }

  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
  }

  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
    length: number;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
  }
}

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

const createQuestions = (formData: FormData) => {
  const focus = formData.purpose || 'self-reflection';
  const name = formData.fullName || 'student';
  const language = formData.otherLanguage || formData.language || 'English';

  return [
    `Hello ${name}. Please introduce yourself and tell me how you are feeling right now.`,
    `What motivated you to join this ${focus} session today?`,
    `Tell me about a recent situation in your studies where you felt proud of yourself.`,
    `Describe a challenge that has been causing you stress and how you usually respond to it.`,
    `How comfortable are you expressing your thoughts in ${language}, and what helps you communicate clearly?`,
    `What kind of support from teachers, mentors, or family helps you perform at your best?`,
    'If you could improve one habit over the next month, what would it be and why?',
    'Thank you. Is there anything else you want this assessment to understand about you before we finish?',
  ];
};

export default function InterviewSession() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
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

  const questions = useMemo(() => createQuestions(formData), [formData]);
  const currentQuestion = questions[questionIndex] ?? '';

  const speakPrompt = async (text: string) => {
    const controller = await speakText(text);
    if (!controller) {
      return;
    }

    await new Promise<void>((resolve) => {
      controller.onended = () => resolve();
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
        setSessionReady(true);
      } catch (error) {
        console.error(error);
        setCameraError('Camera or microphone access was denied. Please allow permissions and reload the session.');
      }
    };

    setupMedia();

    return () => {
      cancelSpeech();
      recognitionRef.current?.stop();
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
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let nextTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        nextTranscript += event.results[index][0].transcript;
      }
      setCurrentAnswer(nextTranscript.trim());
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const askQuestion = async (index: number) => {
    const question = questions[index];
    if (!question) {
      return;
    }

    setQuestionIndex(index);
    setCurrentAnswer('');
    stopListening();
    await speakPrompt(question);
    if (!isPaused) {
      startListening();
    }
  };

  const startInterview = async () => {
    if (!sessionReady || !mediaRecorderRef.current) {
      return;
    }

    chunksRef.current = [];
    setTranscript([]);
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl('');
    }
    setElapsedSeconds(0);
    mediaRecorderRef.current.start(1000);
    setIsRecording(true);
    setIsInterviewActive(true);
    setIsPaused(false);
    await askQuestion(0);
  };

  const saveCurrentAnswer = () => {
    if (!currentQuestion) {
      return;
    }

    setTranscript((entries) => {
      const filteredEntries = entries.filter((entry) => entry.id !== questionIndex);
      return [
        ...filteredEntries,
        {
          id: questionIndex,
          question: currentQuestion,
          answer: currentAnswer || 'No answer captured.',
        },
      ].sort((left, right) => left.id - right.id);
    });
  };

  const handleNextQuestion = async () => {
    saveCurrentAnswer();
    const nextIndex = questionIndex + 1;
    if (nextIndex >= questions.length) {
      handleEndInterview();
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
      stopListening();
      mediaRecorderRef.current?.pause();
      setIsRecording(false);
      return;
    }

    mediaRecorderRef.current?.resume();
    setIsRecording(true);
    void (async () => {
      await speakPrompt(`Continuing session. ${currentQuestion}`);
      startListening();
    })();
  };

  const handleEndInterview = () => {
    saveCurrentAnswer();
    cancelSpeech();
    stopListening();
    mediaRecorderRef.current?.stop();
    setIsInterviewActive(false);
    setIsRecording(false);
    setIsPaused(false);
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
                  disabled={!sessionReady || Boolean(cameraError)}
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
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-200">
                  <Mic className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.3em]">Student response</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isListening ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/10 text-slate-300'}`}>
                  {isListening ? 'Listening' : 'Waiting'}
                </div>
              </div>
              <div className="mt-4 min-h-40 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-200">
                {currentAnswer || 'The browser will capture live transcript here when speech recognition is supported.'}
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
          </section>
        </div>
      </div>
    </div>
  );
}
