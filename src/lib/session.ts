import FingerprintJS from '@fingerprintjs/fingerprintjs';

let sessionPromise: Promise<string> | null = null;

export const getSessionId = async (): Promise<string> => {
  // Check localStorage first
  const stored = localStorage.getItem('shareroom_session_id');
  if (stored) return stored;

  // Fallback check for old key during migration
  const oldStored = localStorage.getItem('shareroom_fingerprint');
  if (oldStored) {
    localStorage.setItem('shareroom_session_id', oldStored);
    localStorage.removeItem('shareroom_fingerprint');
    return oldStored;
  }

  if (!sessionPromise) {
    sessionPromise = (async () => {
      let visitorId: string;
      try {
        console.log('Initializing session identifier...');

        // Create a timeout promise
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('FingerprintJS timeout')), 2500);
        });

        // Race between FingerprintJS and timeout
        const fpPromise = (async () => {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          return result.visitorId;
        })();

        visitorId = await Promise.race([fpPromise, timeoutPromise]);
      } catch (error) {
        console.warn('Session ID generation fallback:', error);
        // Fallback to a simple random ID if fingerprinting fails or times out
        visitorId = 'sess_' + Math.random().toString(36).substr(2, 9);
      }

      localStorage.setItem('shareroom_session_id', visitorId);
      return visitorId;
    })();
  }
  return sessionPromise;
};

// Removed generateRoomCode from here as it is now server-side only.
