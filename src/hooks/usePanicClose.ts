import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const usePanicClose = (onPanic: () => Promise<void>) => {
  const navigate = useNavigate();
  const escPressCount = useRef(0);
  const escTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPanicInProgress = useRef(false);

  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      escPressCount.current += 1;

      if (escTimeout.current) {
        clearTimeout(escTimeout.current);
        escTimeout.current = null;
      }

      if (escPressCount.current >= 2 && !isPanicInProgress.current) {
        escPressCount.current = 0;
        isPanicInProgress.current = true;
        
        try {
          // Call the cleanup function
          await onPanic();
        } catch (err) {
          console.error('Panic close error:', err);
        }
        
        // Navigate using replace to prevent back navigation
        navigate('/', { replace: true });
        isPanicInProgress.current = false;
      } else if (escPressCount.current === 1) {
        escTimeout.current = setTimeout(() => {
          escPressCount.current = 0;
        }, 600);
      }
    }
  }, [onPanic, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (escTimeout.current) {
        clearTimeout(escTimeout.current);
      }
    };
  }, [handleKeyDown]);
};
