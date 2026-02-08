import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Lock, Unlock, Users, Moon, Sun, Shield } from 'lucide-react';
import { Logo } from './Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RoomHeaderProps {
  roomCode: string;
  roomName: string;
  isLocked: boolean;
  isHost: boolean;
  participantCount: number;
  participants: any[];
  theme: 'dark' | 'light';
  onBack: () => void;
  onToggleLock: () => void;
  onToggleTheme: () => void;
}

export const RoomHeader = ({
  roomCode,
  roomName,
  isLocked,
  isHost,
  participantCount,
  participants,
  theme,
  onBack,
  onToggleLock,
  onToggleTheme,
}: RoomHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 p-2 mobile-optimized">
      <div className="flex items-center justify-between">
        {/* Left side - Back button and room info pills close together */}
        <div className="flex items-center gap-2 pt-1">
          {/* Back button pill */}
          <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg smooth-transition">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="shrink-0 h-7 w-7 rounded-full touch-target"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Room info pill - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg smooth-transition h-12">
            <Logo size="sm" showText={false} />
            <div className="ml-1">
              <h1 className="font-medium text-sm text-mono-800 leading-tight">{roomName}</h1>
              <div className="flex items-center gap-1.5 text-xs text-mono-500">
                <Users className="w-3 h-3" />
                <span>{participantCount} online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Controls pill */}
        <div className="flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg smooth-transition h-12">
          {/* Room code */}
          <button
            onClick={copyCode}
            className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-mono-100/80 hover:bg-mono-200/80 transition-colors border border-mono-200/50 touch-target"
          >
            <span className="font-mono text-xs tracking-wider text-mono-700">{roomCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-mono-500" />
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-mono-100/80 hover:bg-mono-200/80 transition-colors border border-mono-200/50 touch-target">
                <Users className="w-3.5 h-3.5 text-mono-600" />
                <span className="text-xs text-mono-700">{participantCount}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-mono-100 border-mono-300">
              {participants.map((participant) => (
                <DropdownMenuItem key={participant.id} className="text-mono-800">
                  {participant.username}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Host controls */}
          {isHost && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleLock}
              className={`h-7 w-7 rounded-full touch-target ${isLocked ? 'text-warning hover:text-warning' : ''}`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>
          )}

          {isHost && (
            <div className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-mono-100/80 text-mono-600 text-xs border border-mono-200/50">
              <Shield className="w-3 h-3" />
              Host
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
