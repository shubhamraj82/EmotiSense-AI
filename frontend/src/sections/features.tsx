import SectionTitle from "../components/section-title";
import { MicIcon, ScanFaceIcon, FileTextIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

export default function Features() {
    const refs = useRef<(HTMLDivElement | null)[]>([]);

    const featuresData: Feature[] = [
        {
            icon: MicIcon,
            title: "Speech Analysis",
            description:
                "Analyze voice tone, pauses, and speaking patterns during the live Q&A session to understand emotional and behavioral signals.",
        },
        {
            icon: ScanFaceIcon,
            title: "Facial Emotion Recognition",
            description:
                "Detect facial expressions and micro-emotions in real time to identify behavioral patterns and emotional responses.",
        },
        {
            icon: FileTextIcon,
            title: "Automated PDF Report",
            description:
                "Generate a detailed analysis report including answers, speech insights, and facial emotion results, accessible only to mentors and parents.",
        },
    ];

    return (
        <section className="mt-32">
            <SectionTitle
                title="AI Analysis Features"
                description="An intelligent system that analyzes speech and facial expressions during live video sessions to generate behavioral insights."
            />

            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 px-6">
                {featuresData.map((feature, index) => (
                    <motion.div
                        key={index}
                        ref={(el) => {
                            refs.current[index] = el;
                        }}
                        className="hover:-translate-y-0.5 p-8 rounded-xl space-y-4 glass max-w-[26rem] w-full min-h-[16rem]"
                        initial={{ y: 150, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                            delay: index * 0.15,
                            type: "spring",
                            stiffness: 320,
                            damping: 70,
                            mass: 1,
                        }}
                        onAnimationComplete={() => {
                            const card = refs.current[index];
                            if (card) {
                                card.classList.add("transition", "duration-300");
                            }
                        }}
                    >
                        <feature.icon className="size-8.5" />
                        <h3 className="text-base font-medium text-white">
                            {feature.title}
                        </h3>
                        <p className="text-gray-100 leading-relaxed pb-2">
                            {feature.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}