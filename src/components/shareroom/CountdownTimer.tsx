import { useState, useEffect, useRef, memo } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    expiresAt: string;
}

export const CountdownTimer = memo(({ expiresAt }: CountdownTimerProps) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [urgency, setUrgency] = useState<'normal' | 'warning' | 'critical'>('normal');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const expiry = new Date(expiresAt).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('Expired');
                setUrgency('critical');
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                return;
            }

            const totalMinutes = Math.floor(diff / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const seconds = Math.floor((diff % 60000) / 1000);

            if (totalMinutes < 10) {
                setUrgency('critical');
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else if (totalMinutes < 60) {
                setUrgency('warning');
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setUrgency('normal');
                setTimeLeft(`${hours}h ${minutes}m`);
            }
        };

        tick();
        intervalRef.current = setInterval(tick, 1000);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [expiresAt]);

    const colorClass =
        urgency === 'critical'
            ? 'text-red-400 border-red-500/30 bg-red-500/10'
            : urgency === 'warning'
                ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                : 'text-white/60 border-white/10 bg-white/5';

    return (
        <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors duration-500 ${colorClass}`}
        >
            <Clock className="w-3 h-3" />
            <span>{timeLeft}</span>
        </div>
    );
});

CountdownTimer.displayName = 'CountdownTimer';
