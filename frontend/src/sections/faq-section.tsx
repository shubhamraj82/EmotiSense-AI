import SectionTitle from '../components/section-title';
import { ChevronDownIcon } from 'lucide-react';
import { JSX, useState } from 'react';
import { motion } from "framer-motion";

interface FaqItem {
    question: string;
    answer: string;
}

export default function FaqSection(): JSX.Element {
        const [isOpen, setIsOpen] = useState<number | null>(null);
        const data: FaqItem[] = [
             {
        question: 'Do I need technical knowledge to participate in the AI speech and facial analysis session?',
        answer: "No technical or coding knowledge is required. Users only need to fill out a short pre-session form and respond to questions during the live video session."
},
{
        question: 'What is the AI-Based Speech and Facial Analysis System?',
        answer: 'It is an AI-powered system that analyzes a user\'s speech patterns and facial expressions during a live video question-answer session to understand emotional and behavioral patterns.'
},
{
        question: 'How does the live video question-answer session work?',
        answer: 'After completing the pre-session form, users enter a live video interaction where questions appear on the screen one by one. The system records video and audio responses for AI-based analysis.'
},
{
        question: 'What kind of analysis does the system perform?',
        answer: 'The system performs speech analysis to evaluate tone, pauses, and speaking patterns, along with facial emotion recognition to detect expressions and behavioral responses.'
},
{
        question: 'Is my video and audio data secure?',
        answer: "Yes, all recorded data is securely processed. The generated analysis report is accessible only to authorized individuals such as mentors and parents."
},
{
        question: 'What happens after the session is completed?',
        answer: 'Once the session ends, the system processes the recorded data and generates a detailed PDF report containing the user\'s responses, speech analysis insights, facial emotion detection results, and behavioral observations.'
},
{
        question: 'Can users choose their preferred language for the session?',
        answer: 'Yes, the system supports multiple languages. Users can select their preferred language in the pre-session form before starting the live video interaction.'
},
{
        question: 'Who can access the final analysis report?',
        answer: 'The final report is shared only with authorized individuals such as parents and mentors to ensure privacy and responsible use of the insights.'
},
        ];

        return (
                <section className='mt-32'>
                        <SectionTitle title="FAQ's" description="Looking for answers to your frequently asked questions? Check out our FAQ's section below to find." />
                        <div className='mx-auto mt-12 space-y-4 w-full max-w-xl'>
                                {data.map((item, index) => (
                                        <motion.div key={index} className='flex flex-col glass rounded-md'
                                                initial={{ y: 150, opacity: 0 }}
                                                whileInView={{ y: 0, opacity: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: index * 0.15, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
                                        >
                                                <h3 className='flex cursor-pointer hover:bg-white/10 transition items-start justify-between gap-4 p-4 font-medium' onClick={() => setIsOpen(isOpen === index ? null : index)}>
                                                        {item.question}
                                                        <ChevronDownIcon className={`size-5 transition-all shrink-0 duration-400 ${isOpen === index ? 'rotate-180' : ''}`} />
                                                </h3>
                                                <p className={`px-4 text-sm/6 transition-all duration-400 overflow-hidden ${isOpen === index ? 'pt-2 pb-4 max-h-80' : 'max-h-0'}`}>{item.answer}</p>
                                        </motion.div>
                                ))}
                        </div>
                </section>
        );
}