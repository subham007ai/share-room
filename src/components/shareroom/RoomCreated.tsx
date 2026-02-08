import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ArrowRight } from 'lucide-react';

interface RoomCreatedProps {
  roomCode: string;
  onGoToRoom: () => void;
}

export const RoomCreated = ({ roomCode, onGoToRoom }: RoomCreatedProps) => {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-sm space-y-6 animate-fade-in text-center mx-auto">
      <div className="space-y-2">
        <p className="text-sm text-white/70">Room created successfully!</p>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-white/60 uppercase tracking-wider">Room Code</p>
            <p className="text-4xl font-mono font-bold tracking-[0.3em] pl-[0.3em] text-white">
              {roomCode}
            </p>
          </div>

          <Button
            onClick={copyCode}
            variant="outline"
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Code'}
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
