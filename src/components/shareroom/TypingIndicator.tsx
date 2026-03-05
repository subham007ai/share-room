import { memo } from 'react';

interface TypingIndicatorProps {
    typingUsers: string[];
}

export const TypingIndicator = memo(({ typingUsers }: TypingIndicatorProps) => {
    if (typingUsers.length === 0) return null;

    const text =
        typingUsers.length === 1
            ? `${typingUsers[0]} is typing`
            : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
                : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

    return (
        <div className="flex items-center gap-2 px-4 py-1.5 animate-fade-in">
            <div className="flex items-center gap-0.5">
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
            </div>
            <span className="text-xs text-white/50 truncate">{text}</span>
        </div>
    );
});

TypingIndicator.displayName = 'TypingIndicator';
