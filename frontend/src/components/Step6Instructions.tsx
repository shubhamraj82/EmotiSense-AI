import React, { useEffect, useState, useRef } from 'react';
import { Info, AlertCircle, Volume2, VolumeX, MessageSquare, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askAssistant, SpeechController, speakText } from '../service/geminiService';

const INSTRUCTIONS = [
  'Sit in a well-lit environment',
  'Ensure your face is clearly visible to the camera',
  'Speak clearly and naturally',
  'Answer questions honestly',
  'Avoid background noise'
];

export const Step6Instructions: React.FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  const audioRef = useRef<SpeechController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const instructionsText = `Welcome to the final step. Before we begin, please follow these guidelines: 
    First, ${INSTRUCTIONS[0]}. 
    Second, ${INSTRUCTIONS[1]}. 
    Third, ${INSTRUCTIONS[2]}. 
    Fourth, ${INSTRUCTIONS[3]}. 
    And finally, ${INSTRUCTIONS[4]}. 
    Do you have any questions about these instructions?`;

  useEffect(() => {
    // Auto-read instructions when component mounts
    handleSpeak();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSpeak = async () => {
    if (isSpeaking) {
      if (audioRef.current) audioRef.current.pause();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const audio = await speakText(instructionsText);
    if (audio) {
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
    } else {
      setIsSpeaking(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const userMsg = question;
    setQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAsking(true);

    const answer = await askAssistant(userMsg, INSTRUCTIONS.join(', '));
    setChatHistory(prev => [...prev, { role: 'assistant', text: answer || '' }]);
    setIsAsking(false);

    // Speak the answer
    if (answer) {
      const audio = await speakText(answer);
      if (audio) {
        audioRef.current = audio;
        setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <Info size={20} />
          </div>
          <h2 className="text-xl font-semibold">Pre-Session Instructions</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSpeak}
            className={`p-2 rounded-xl transition-all ${isSpeaking ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title={isSpeaking ? "Stop Assistant" : "Read Instructions"}
          >
            {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-xl transition-all ${showChat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title="Ask Assistant"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 space-y-6">
          <h3 className="text-lg font-bold text-amber-900">Session Guidelines:</h3>
          <ul className="space-y-4">
            {INSTRUCTIONS.map((instruction, i) => (
              <li key={i} className="flex items-center gap-4 text-amber-800">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <span className="font-medium">{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        <AnimatePresence>
          {showChat ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[400px] overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">AI Voice Assistant</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Ask me anything about the instructions!</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleAsk} className="p-4 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isAsking || !question.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {isAsking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </motion.div>
          ) : (
            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4 h-fit">
              <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-900 mb-1">Ready to start?</h4>
                <p className="text-xs text-indigo-700 leading-relaxed mb-4">
                  Once you click the button below, the live session will begin. Please ensure you are in a quiet place and ready to interact with the AI assistant.
                </p>
                <button 
                  onClick={() => setShowChat(true)}
                  className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                >
                  <MessageSquare size={14} />
                  Ask the assistant a question
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
