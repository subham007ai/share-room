import { memo } from 'react';
import { ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollToBottomFABProps {
    show: boolean;
    unreadCount: number;
    onClick: () => void;
}

export const ScrollToBottomFAB = memo(({ show, unreadCount, onClick }: ScrollToBottomFABProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.button
                    type="button"
                    aria-label="Scroll to bottom"
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onClick={onClick}
                    className="fixed bottom-24 sm:bottom-28 right-4 sm:right-8 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/25 transition-colors"
                >
                    <ArrowDown className="w-4 h-4 text-white" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-green-500 rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </motion.button>
            )}
        </AnimatePresence>
    );
});

ScrollToBottomFAB.displayName = 'ScrollToBottomFAB';
