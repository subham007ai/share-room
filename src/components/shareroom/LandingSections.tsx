import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowUp, Lock, Clock, FileX, Share2, ShieldAlert } from 'lucide-react';

export const LandingSections = ({ onStartClick }: { onStartClick: () => void }) => {
    const fadeUp = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.3, ease: "easeOut" }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-32 pb-8 px-6">

            {/* 1. How It Works (Linear) */}
            <motion.section
                id="how-it-works"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="space-y-12"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        {
                            step: "01",
                            title: "Create a room",
                            desc: "Enter a temporary name. No signup, no emails, no passwords."
                        },
                        {
                            step: "02",
                            title: "Share instantly",
                            desc: "Share the link or code with your peer to start chatting and sending files."
                        },
                        {
                            step: "03",
                            title: "It expires",
                            desc: "Room and all data are inaccessible after 24h or when you leave."
                        }
                    ].map((item, i) => (
                        <motion.div key={i} variants={fadeUp} className="flex flex-col space-y-4">
                            <span className="text-4xl font-mono font-bold text-white/20">{item.step}</span>
                            <h3 className="text-xl font-bold text-white">{item.title}</h3>
                            <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* 2. What Happens to Your Data (Focused Block) */}
            <motion.section
                id="data-policy"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl mx-auto text-center space-y-6"
            >
                <h2 className="text-2xl font-bold text-white">Data accessible only while room is active</h2>
                <p className="text-neutral-400 leading-relaxed">
                    Once a room expires, all data becomes inaccessible via the application.
                    Physical deletion of records occurs automatically as part of our cleanup process.
                </p>
            </motion.section>

            {/* 3. Designed for One-Time Sharing (Bento) */}
            <motion.section
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="space-y-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ShareRoom IS */}
                    <motion.div
                        variants={fadeUp}
                        className="p-8 rounded-3xl bg-neutral-900/50 border border-white/5 space-y-6"
                    >
                        <h3 className="text-lg font-semibold text-white">ShareRoom is</h3>
                        <ul className="space-y-4 text-neutral-400 text-sm">
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                <span>A tool for quick, ephemeral code sharing</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                <span>A way to send text without logging in</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                <span>Designed for immediate, real-time collaboration</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* ShareRoom IS NOT */}
                    <motion.div
                        variants={fadeUp}
                        className="p-8 rounded-3xl bg-neutral-900/50 border border-white/5 space-y-6"
                    >
                        <h3 className="text-lg font-semibold text-white">ShareRoom is not</h3>
                        <ul className="space-y-4 text-neutral-400 text-sm">
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                <span>A secure vault for passwords or secrets</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                <span>A long-term file storage solution</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                <span>An encrypted messenger like Signal</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </motion.section>

            {/* 4. When to Use It (Mini Bento) */}
            <motion.section
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {[
                    { title: "Debugging", desc: "Share a stack trace with a colleague." },
                    { title: "Snippets", desc: "Pass a config file without using Slack." },
                    { title: "Quick Links", desc: "Share a URL from phone to desktop." }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        variants={fadeUp}
                        className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                    >
                        <h4 className="font-medium text-white mb-2">{item.title}</h4>
                        <p className="text-sm text-neutral-400">{item.desc}</p>
                    </motion.div>
                ))}
            </motion.section>

            {/* 5. Final CTA */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-xl mx-auto pt-24"
            >
                <div className="relative group overflow-hidden rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur-sm transition-all duration-500 hover:bg-neutral-900/60 hover:border-white/20">

                    {/* Animated Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    {/* Content */}
                    <div className="relative z-10 p-10 flex flex-col items-center text-center space-y-8">

                        <div className="space-y-2">
                            <span className="text-sm font-medium uppercase tracking-widest text-indigo-400">
                                Ready when you are
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                Start sharing in seconds.
                            </h2>
                        </div>

                        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                            <Button
                                size="lg"
                                onClick={onStartClick}
                                className="w-full bg-white text-black hover:bg-neutral-100 hover:scale-[1.02] transition-all duration-300 rounded-xl py-6 text-lg font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                            >
                                Create a temporary room
                            </Button>

                            <div className="flex items-center gap-4 text-xs text-neutral-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                    No signup
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                    Auto-expires
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

        </div>
    );
};
