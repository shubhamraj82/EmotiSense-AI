import { ArrowRightIcon } from "lucide-react";
import { motion } from "framer-motion";
import { JSX } from "react";
import { Link } from "react-router-dom";

export default function CallToAction(): JSX.Element {
    return (
        <motion.div
            className="flex flex-col max-w-5xl mt-40 px-4 mx-auto items-center justify-center text-center py-16 rounded-xl glass"
            initial={{ y: 150, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
        >
            <motion.h2
                className="text-2xl md:text-4xl font-medium mt-2"
                initial={{ y: 80, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
            >
                Ready to start your AI behavioral analysis session?
            </motion.h2>

            <motion.p
                className="mt-4 text-sm/7 max-w-md"
                initial={{ y: 80, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, damping: 70, mass: 1 }}
            >
                Experience how AI can analyze speech patterns and facial expressions
                during live video sessions to generate meaningful behavioral insights
                and detailed PDF reports for mentors and parents.
            </motion.p>

            <motion.div
                className="mt-8"
                initial={{ y: 80, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
            >
                <Link to="/setup/language" className="btn glass transition-none flex items-center gap-2">
                    Start Live Session
                    <ArrowRightIcon className="size-4" />
                </Link>
            </motion.div>
        </motion.div>
    );
}
