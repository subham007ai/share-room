import FingerprintJS from '@fingerprintjs/fingerprintjs';

let sessionPromise: Promise<string> | null = null;
let inMemorySessionId: string | null = null;

const getStoredItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStoredItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    inMemorySessionId = value;
  }
};

const removeStoredItem = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
};

export const getSessionId = async (): Promise<string> => {
  if (inMemorySessionId) return inMemorySessionId;

  // Check localStorage first
  const stored = getStoredItem('shareroom_session_id');
  if (stored) return stored;

  // Fallback check for old key during migration
  const oldStored = getStoredItem('shareroom_fingerprint');
  if (oldStored) {
    setStoredItem('shareroom_session_id', oldStored);
    removeStoredItem('shareroom_fingerprint');
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

      setStoredItem('shareroom_session_id', visitorId);
      return visitorId;
    })();
  }
  return sessionPromise;
};

// Removed generateRoomCode from here as it is now server-side only.
