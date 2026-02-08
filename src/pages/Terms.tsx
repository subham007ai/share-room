import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Particles } from "@/components/magicui/particles";

const Terms = () => {
    return (
        <div className="min-h-screen w-full relative bg-black font-sans text-neutral-200">

            {/* Background Elements */}
            <div
                className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none opacity-20"
                style={{
                    background: `
            radial-gradient(
              circle at top left,
              rgba(6, 182, 212, 0.1) 0%,
              rgba(0, 0, 0, 0) 50%
            )
          `,
                }}
            />
            <Particles
                className="fixed inset-0 z-0 opacity-30"
                quantity={50}
                ease={80}
                color="#ffffff"
                refresh
            />

            <div className="relative z-10 max-w-3xl mx-auto px-6 py-20">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <Link to="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-neutral-500">Last updated: 2026-02-08</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-12 text-neutral-300 leading-relaxed"
                >
                    <div className="prose prose-invert max-w-none">
                        <p className="text-lg text-neutral-400">
                            By accessing or using ShareRoom, you agree to these Terms of Service (“Terms”).
                            If you do not agree, do not use the service.
                        </p>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">1. Overview of the Service</h2>
                            <p>
                                ShareRoom provides temporary, account-free rooms for short-lived messaging and file sharing.
                                The service is designed for ephemeral use only. Rooms expire automatically and are not intended for permanent communication or storage.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">2. Eligibility</h2>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                                <li>You may use ShareRoom if you are legally permitted to do so under applicable laws.</li>
                                <li>ShareRoom does not require account registration or identity verification.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">3. No Accounts or Ownership Claims</h2>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                                <li>ShareRoom does not create user accounts.</li>
                                <li>Room access is controlled solely through possession of a room link or code.</li>
                                <li>ShareRoom does not guarantee exclusive access, persistence, or ownership of any room.</li>
                                <li>Rooms may become inaccessible at any time due to expiration or system limitations.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">4. Acceptable Use</h2>
                            <p>You agree not to use ShareRoom to:</p>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                                <li>Violate any applicable law or regulation</li>
                                <li>Share illegal, harmful, or abusive content</li>
                                <li>Distribute malware or attempt to compromise the service</li>
                                <li>Circumvent access controls or abuse system resources</li>
                            </ul>
                            <p className="mt-2 text-neutral-400">ShareRoom may restrict access to rooms or sessions that violate these Terms.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">5. Temporary Nature of Data</h2>
                            <p>ShareRoom is designed for temporary use.</p>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                                <li>Rooms expire automatically after a fixed period.</li>
                                <li>After expiration, messages and shared files become inaccessible.</li>
                                <li>Data may be removed as part of routine cleanup and cannot be recovered.</li>
                            </ul>
                            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm">
                                You are responsible for saving any information you wish to keep before a room expires.
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">6. No Guarantees of Availability or Retention</h2>
                            <p>ShareRoom is provided on an “as is” and “as available” basis.</p>
                            <p>We do not guarantee:</p>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                                <li>Continuous availability</li>
                                <li>Delivery of messages or files</li>
                                <li>Retention of data</li>
                                <li>Recovery of expired content</li>
                            </ul>
                            <p className="text-neutral-400 font-medium">Use the service with the expectation that data may be lost.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">7. Privacy</h2>
                            <p>
                                Use of ShareRoom is also governed by the <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">Privacy Policy</Link>.
                            </p>
                            <p>The Privacy Policy explains what data is handled, how long it is accessible, and the limits of privacy and retention guarantees.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">8. Security and Risk Acknowledgment</h2>
                            <p>While reasonable measures are taken to protect data during active use:</p>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                                <li>ShareRoom does not claim strong anonymity guarantees</li>
                                <li>ShareRoom does not claim audited end-to-end encryption</li>
                                <li>ShareRoom is not suitable for highly sensitive or regulated data</li>
                            </ul>
                            <p className="text-red-400/80">You use ShareRoom at your own risk.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">9. Third-Party Infrastructure</h2>
                            <p>
                                ShareRoom relies on third-party infrastructure providers to operate.
                                We are not responsible for outages, data loss, or limitations caused by third-party services.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">10. Termination of Access</h2>
                            <p>ShareRoom may suspend or restrict access to the service or specific rooms at any time, including for abuse, violation of these Terms, or system protection.</p>
                            <p>No notice is required due to the temporary nature of the service.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">11. Limitation of Liability</h2>
                            <p>To the maximum extent permitted by law:</p>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                                <li>ShareRoom shall not be liable for any indirect, incidental, or consequential damages</li>
                                <li>ShareRoom shall not be liable for loss of data, content, or access</li>
                                <li>Your sole remedy is to stop using the service.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">12. Changes to These Terms</h2>
                            <p>
                                These Terms may be updated as the service evolves.
                                Continued use of ShareRoom after changes constitutes acceptance of the updated Terms.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">13. Contact</h2>
                            <p>For questions about these Terms:</p>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                                <li>Email: legal@shareroom.io</li>
                                <li>Project repository: <a href="https://github.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">GitHub</a></li>
                            </ul>
                        </section>

                        <section className="pt-8 border-t border-white/10">
                            <p className="text-sm text-neutral-500 italic">
                                Final note: ShareRoom is intentionally minimal, temporary, and account-free. These Terms reflect that design philosophy and its technical limits.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Terms;
