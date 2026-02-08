import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/shareroom/Logo';
import { UsernameForm } from '@/components/shareroom/UsernameForm';
import { RoomOptions } from '@/components/shareroom/RoomOptions';
import { RoomCreated } from '@/components/shareroom/RoomCreated';
import { getSessionId } from '@/lib/session';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FlipWordsDemo } from '@/components/ui/flip-words-demo';
import { Typewriter } from '@/components/ui/typewriter';
import { TextAnimate } from "@/components/magicui/text-animate";
import { Particles } from "@/components/magicui/particles";
import { FaqSection } from '@/components/shareroom/FaqSection';
import { LandingSections } from '@/components/shareroom/LandingSections';
import { Footer } from '@/components/shareroom/Footer';

type Step = 'username' | 'options' | 'created';

const Index = () => {
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Check for deep link
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setJoinCode(code.toUpperCase());
    }
  }, [searchParams]);

  // Handle page load
  useEffect(() => {
    let mounted = true;

    const checkLoaded = () => {
      if (!mounted) return;

      if (document.readyState === 'complete') {
        setTimeout(() => {
          if (mounted) setIsPageLoaded(true);
        }, 1500);
      } else {
        setTimeout(checkLoaded, 100);
      }
    };

    checkLoaded();

    return () => {
      mounted = false;
    };
  }, []);

  const handleUsernameSubmit = (name: string) => {
    setUsername(name);

    // If we have a join code from deep link, go directly to room
    if (joinCode) {
      navigate(`/room/${joinCode}?username=${encodeURIComponent(name)}`);
    } else {
      setStep('options');
    }
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const sessionId = await getSessionId();

      const { data: code, error } = await supabase.rpc('create_room', {
        name: `${username}'s Room`,
        host_session_id: sessionId,
      });

      if (error) throw error;

      setRoomCode(code);
      setStep('created');
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (code: string) => {
    navigate(`/room/${code}?username=${encodeURIComponent(username)}`);
  };

  const handleGoToRoom = () => {
    navigate(`/room/${roomCode}?username=${encodeURIComponent(username)}`);
  };

  const handleStartClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Small delay to ensure smooth scroll starts before focus potentially jumps
    setTimeout(() => {
      if (usernameInputRef.current) {
        usernameInputRef.current.focus();
      }
    }, 100);
  };

  return (

    <div className="min-h-screen w-full relative bg-black overflow-x-hidden selection:bg-indigo-500/30 font-sans text-neutral-200">

      {/* Cyan Spotlight Background */}
      <div
        className="absolute top-0 left-0 w-full h-[120vh] z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              circle at center,
              rgba(6, 182, 212, 0.12) 0%,
              rgba(6, 182, 212, 0.06) 20%,
              rgba(0, 0, 0, 0.0) 60%
            )
          `,
        }}
      />

      {/* Particles Background */}
      <Particles
        className="fixed inset-0 z-0"
        quantity={100}
        ease={80}
        color="#ffffff"
        refresh
      />

      <div className="flex flex-col min-h-screen relative z-10">

        {/* Header - Minimal */}
        <header className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg"></div>
            <span className="font-bold tracking-tight text-white text-lg">ShareRoom</span>
          </div>
          <a href="https://github.com/subham007ai/share-room" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
          </a>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-20 sm:px-6 min-h-[90vh]">
          <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-8">

            {/* Badge */}




            {/* Headline */}
            <div className="mb-4">
              <TextAnimate animation="blurInUp" by="character" once className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white">
                Temporary rooms for quick sharing
              </TextAnimate>
            </div>

            {/* Subtext */}
            <p className="text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed">
              Create a temporary room to chat and share files.
              <span className="text-neutral-300 block mt-1">Everything is deleted automatically after expiry.</span>
            </p>

            {/* Input & Action Area */}
            <div className="w-full max-w-md mt-8 relative group">


              {step === 'username' && (
                <div className="relative bg-neutral-900 ring-1 ring-white/10 rounded-xl p-1.5 flex items-center gap-2 shadow-2xl">
                  <input
                    ref={usernameInputRef}
                    type="text"
                    placeholder="Enter a username..."
                    className="flex-1 bg-transparent border-none text-white placeholder-neutral-500 focus:ring-0 focus:outline-none px-4 py-2 font-medium"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && username.trim().length > 1 && handleUsernameSubmit(username)}
                    autoFocus
                  />
                  <button
                    onClick={() => username.trim().length > 1 && handleUsernameSubmit(username)}
                    disabled={username.trim().length < 2}
                    className="bg-white text-black p-2 rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M16.72 7.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H3a.75.75 0 0 1 0-1.5h16.19l-2.47-2.47a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {step === 'options' && (
                <RoomOptions
                  onCreateRoom={handleCreateRoom}
                  onJoinRoom={handleJoinRoom}
                  loading={loading}
                />
              )}

              {step === 'created' && (
                <RoomCreated roomCode={roomCode} onGoToRoom={handleGoToRoom} />
              )}
            </div>

            {/* Microcopy/Trust */}
            <div className="pt-8 flex items-center justify-center gap-6 text-sm text-neutral-600">
              <span>No accounts · No history · Auto-deletion</span>
            </div>

          </div>
        </main>

        {/* Info Sections */}
        {/* Info Sections - Hide when room is created to focus on the code */}
        {step !== 'created' && (
          <>
            <LandingSections onStartClick={handleStartClick} />
            <div className="max-w-3xl mx-auto px-6 pb-20">
              <FaqSection />
            </div>
            <Footer />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
