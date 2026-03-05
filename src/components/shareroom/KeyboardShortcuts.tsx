import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

const shortcuts = [
    { keys: ['/', 'Ctrl', 'K'], label: 'Focus message input' },
    { keys: ['Escape'], label: 'Cancel reply / close' },
    { keys: ['Enter'], label: 'Send message' },
    { keys: ['Shift', 'Enter'], label: 'New line in message' },
    { keys: ['?'], label: 'Open this cheatsheet' },
];

export const KeyboardShortcuts = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            if (e.key === '?' && !isEditable) {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-full bg-mono-100/80 hover:bg-mono-200/80 transition-colors border border-mono-200/50 touch-target"
                title="Keyboard shortcuts (?)"
            >
                <Keyboard className="w-3.5 h-3.5 text-mono-600" />
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative z-10 bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-[360px]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-white font-semibold">Keyboard Shortcuts</h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-white/70" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {shortcuts.map(({ keys, label }) => (
                                <div key={label} className="flex items-center justify-between gap-4">
                                    <span className="text-white/60 text-sm">{label}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {keys.map((k, i) => (
                                            <span key={i} className="flex items-center gap-1">
                                                <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-white/10 border border-white/20 rounded text-white/80">
                                                    {k}
                                                </kbd>
                                                {i < keys.length - 1 && k !== 'Ctrl' && k !== 'Shift' && (
                                                    <span className="text-white/30 text-[10px]">or</span>
                                                )}
                                                {(k === 'Ctrl' || k === 'Shift') && (
                                                    <span className="text-white/30 text-[10px]">+</span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="mt-5 text-[11px] text-white/30 text-center">Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">?</kbd> to toggle</p>
                    </div>
                </div>
            )}
        </>
    );
};
