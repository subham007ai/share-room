import { memo, useState, useEffect, useRef } from 'react';
import { SmilePlus } from 'lucide-react';

interface Reaction {
    id: string;
    message_id: string;
    session_id: string;
    emoji: string;
    created_at: string;
}

interface ReactionBarProps {
    reactions: Reaction[];
    sessionId: string | null;
    onToggleReaction: (emoji: string) => void;
}

const EMOJI_OPTIONS = ['👍', '❤️', '🔥', '😂', '👀', '✅'];

export const ReactionBar = memo(({ reactions, sessionId, onToggleReaction }: ReactionBarProps) => {
    const [showPicker, setShowPicker] = useState(false);
    const firstEmojiRef = useRef<HTMLButtonElement>(null);

    // Group reactions by emoji
    const grouped = reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>((acc, r) => {
        if (!acc[r.emoji]) {
            acc[r.emoji] = { count: 0, hasOwn: false };
        }
        acc[r.emoji].count++;
        if (r.session_id === sessionId) {
            acc[r.emoji].hasOwn = true;
        }
        return acc;
    }, {});

    const handleEmojiClick = (emoji: string) => {
        onToggleReaction(emoji);
        setShowPicker(false);
    };

    // Handle Escape key to close picker
    useEffect(() => {
        if (!showPicker) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowPicker(false);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showPicker]);

    // Focus first emoji when picker opens
    useEffect(() => {
        if (showPicker && firstEmojiRef.current) {
            firstEmojiRef.current.focus();
        }
    }, [showPicker]);

    return (
        <div className="flex items-center gap-1 flex-wrap mt-1 relative">
            {/* Existing reaction chips */}
            {Object.entries(grouped).map(([emoji, { count, hasOwn }]) => (
                <button
                    key={emoji}
                    onClick={() => onToggleReaction(emoji)}
                    aria-label={`${hasOwn ? 'Remove' : 'Add'} ${emoji} reaction (${count} total)`}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all border ${hasOwn
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                >
                    <span>{emoji}</span>
                    <span className="font-mono text-[10px]">{count}</span>
                </button>
            ))}

            {/* Add reaction button */}
            <div className="relative">
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    aria-label="Add reaction"
                    aria-expanded={showPicker}
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
                >
                    <SmilePlus className="w-3 h-3" />
                </button>

                {/* Emoji picker */}
                {showPicker && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowPicker(false)}
                        />
                        <div 
                            className="absolute bottom-full left-0 mb-1 z-50 flex items-center gap-0.5 p-1.5 bg-neutral-900 border border-white/20 rounded-full shadow-xl backdrop-blur-md"
                            role="listbox"
                            aria-label="Select emoji reaction"
                        >
                            {EMOJI_OPTIONS.map((emoji, index) => (
                                <button
                                    key={emoji}
                                    ref={index === 0 ? firstEmojiRef : undefined}
                                    onClick={() => handleEmojiClick(emoji)}
                                    aria-label={`Add ${emoji} reaction`}
                                    role="option"
                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-sm"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

ReactionBar.displayName = 'ReactionBar';
