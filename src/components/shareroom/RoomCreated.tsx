import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ArrowRight } from 'lucide-react';

interface RoomCreatedProps {
  roomCode: string;
  encryptionKey?: string;
  onGoToRoom: () => void;
}

export const RoomCreated = ({ roomCode, encryptionKey, onGoToRoom }: RoomCreatedProps) => {
  const [copied, setCopied] = useState(false);

  const copyInviteLink = async () => {
    const hash = encryptionKey ? `#key=${encryptionKey}` : '';
    const url = `${window.location.origin}/room/${roomCode}${hash}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-sm space-y-6 animate-fade-in text-center mx-auto">
      <div className="space-y-2">
        <p className="text-sm text-white/70">Room created successfully!</p>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 space-y-4">
          <div className="space-y-1 relative">
            <p className="text-xs text-white/60 uppercase tracking-wider">Room Code</p>
            <p className="text-4xl font-mono font-bold tracking-[0.3em] pl-[0.3em] text-white">
              {roomCode}
            </p>
            {encryptionKey && (
              <div className="absolute top-0 right-0 py-0.5 px-2 bg-success/20 text-success text-[10px] rounded-full uppercase tracking-widest font-semibold flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                E2E Encrypted
              </div>
            )}
          </div>

          <Button
            onClick={copyInviteLink}
            variant="outline"
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full"
          >
            {copied ? <Check className="w-4 h-4 mr-2 text-success" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied Link!' : 'Copy Invite Link'}
          </Button>
        </div>
      </div>

      <Button
        onClick={onGoToRoom}
        className="w-full h-12 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white font-semibold rounded-full transition-all"
      >
        Go to Room
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
};
