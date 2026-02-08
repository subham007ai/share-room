import { Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="w-full bg-black/50 border-t border-white/5 mt-0 pt-16 pb-8">
            <div className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                    {/* Column 1: Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-md"></div>
                            <span className="font-bold tracking-tight text-white">ShareRoom</span>
                        </div>
                        <p className="text-sm text-neutral-500">
                            Temporary rooms for quick sharing.
                        </p>
                    </div>

                    {/* Column 2: Product */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-white">Product</h4>
                        <ul className="space-y-3 text-sm text-neutral-500">
                            <li>
                                <button
                                    onClick={() => scrollToSection('how-it-works')}
                                    className="hover:text-neutral-300 transition-colors"
                                >
                                    How it works
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => scrollToSection('data-policy')}
                                    className="hover:text-neutral-300 transition-colors"
                                >
                                    Data & expiry
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => scrollToSection('faq')}
                                    className="hover:text-neutral-300 transition-colors"
                                >
                                    FAQ
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Meta */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-white">Project</h4>
                        <div className="flex flex-col gap-3 text-sm text-neutral-500">
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 hover:text-white transition-colors w-fit"
                            >
                                <Github className="w-4 h-4" />
                                <span>GitHub</span>
                            </a>
                            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-600">
                    <p>© 2026 ShareRoom</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
