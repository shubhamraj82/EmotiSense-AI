import SectionTitle from "../components/section-title";
import { motion } from "framer-motion";
import { useRef, ReactNode } from "react";

interface Testimonial {
    review: string;
    name: string;
    about: string;
    rating: number;
    image: string;
}

export default function Testimonials(): ReactNode {
    const ref = useRef<(HTMLDivElement | null)[]>([]);

    const data: Testimonial[] = [
        {
            review: "This platform helped us understand students’ emotional responses during interviews. The speech and facial analysis report is incredibly insightful.",
            name: "Dr. Richard Nelson",
            about: "Academic Mentor",
            rating: 5,
            image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
        },
        {
            review: "The live video Q&A system combined with AI analysis is amazing. The generated report helps mentors identify behavioral patterns easily.",
            name: "Sophia Martinez",
            about: "Student Counselor",
            rating: 5,
            image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
        },
        {
            review: "As a parent, the detailed PDF report helped me understand my child's confidence and communication skills during the session.",
            name: "Ethan Roberts",
            about: "Parent",
            rating: 5,
            image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60",
        },
        {
            review: "The facial emotion recognition and speech tone analysis together provide deep behavioral insights that are extremely useful for mentoring.",
            name: "Isabella Kim",
            about: "Behavioral Analyst",
            rating: 5,
            image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60",
        },
        {
            review: "The multi-language support makes it accessible for students from different regions. The system feels intuitive and powerful.",
            name: "Liam Johnson",
            about: "Education Consultant",
            rating: 5,
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop",
        },
        {
            review: "This AI-driven behavioral analysis system is a great innovation for counseling and student evaluation. The automated reports save a lot of time.",
            name: "Ava Patel",
            about: "School Mentor",
            rating: 5,
            image: "https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/userImage/userImage1.png",
        },
    ];

    return (
        <section className="mt-32 flex flex-col items-center">
            <SectionTitle
                title="What Our Users Say About the AI Analysis System"
                description="Students, mentors, and parents use our platform to gain deeper insights into communication skills, emotions, and behavioral patterns through AI-powered speech and facial analysis."
            />

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.map((item, index) => (
                    <motion.div
                        key={index}
                        className="w-full max-w-88 space-y-5 rounded-lg glass p-5 hover:-translate-y-1"
                        initial={{ y: 150, opacity: 0 }}
                        ref={(el) => {
                            ref.current[index] = el;
                        }}
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
                            const card = ref.current[index];
                            if (card) {
                                card.classList.add("transition", "duration-300");
                            }
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <p className="font-medium">{item.about}</p>
                            <img
                                className="size-10 rounded-full"
                                src={item.image}
                                alt={item.name}
                            />
                        </div>

                        <p className="line-clamp-3">"{item.review}"</p>

                        <p className="text-gray-300">
                            - {item.name}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}