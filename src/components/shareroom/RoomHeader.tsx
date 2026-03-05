import { useState } from 'react';
import { Participant } from '@/hooks/useRoom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Lock, Unlock, Users, Moon, Sun, Shield, MoreHorizontal, Link2 } from 'lucide-react';
import { Logo } from './Logo';
import { CountdownTimer } from './CountdownTimer';
import { QRShareModal } from './QRShareModal';
import { KeyboardShortcuts } from './KeyboardShortcuts';
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
  participants: Participant[];
  expiresAt: string;
  theme: 'dark' | 'light';
  encryptionKey?: string;
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
  expiresAt,
  theme,
  encryptionKey,
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

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/room/${roomCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 p-2 mobile-optimized">
      <div className="relative flex items-center justify-between">
        {/* Left side - Back button and room info */}
        <div className="flex items-center gap-2 pt-1 z-10">
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

          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg smooth-transition h-12">
            <Logo size="sm" showText={false} />
            <div className="ml-1">
              <h1 className="font-medium text-sm text-white/90 leading-tight">{roomName}</h1>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Users className="w-3 h-3" />
                <span>{participantCount} online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Timer */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          <CountdownTimer expiresAt={expiresAt} />
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-1 md:gap-1.5 px-2 sm:px-3 md:px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg smooth-transition h-12 z-10">
          <button
            onClick={copyCode}
            className="hidden sm:flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-mono-100/80 hover:bg-mono-200/80 transition-colors border border-mono-200/50 touch-target"
            title="Copy room code"
          >
            <span className="font-mono text-xs tracking-wider text-mono-700">{roomCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-mono-500" />
            )}
          </button>

          <button
            onClick={copyInviteLink}
            className="hidden md:flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-mono-100/80 hover:bg-mono-200/80 transition-colors border border-mono-200/50 touch-target text-xs text-mono-700"
            title="Copy invite link"
          >
            Invite
          </button>

          {/* QR Share */}
          <QRShareModal roomCode={roomCode} encryptionKey={encryptionKey} />

          {/* Keyboard shortcuts */}
          <KeyboardShortcuts />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-mono-100/80 hover:bg-mono-200/80 transition-colors border border-mono-200/50 touch-target">
                <Users className="w-3.5 h-3.5 text-mono-600" />
                <span className="text-xs text-mono-700">{participantCount}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-mono-100 border-mono-300">
              {participants.map((participant) => (
                <DropdownMenuItem key={participant.id} className="text-mono-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${participant.presence_status === 'away' ? 'bg-mono-400' : 'bg-success'}`} />
                    <span>{participant.username}</span>
                    {participant.role === 'host' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-mono-200 text-mono-600">Host</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full bg-mono-100/80 hover:bg-mono-200/80 transition-colors border border-mono-200/50">
                <MoreHorizontal className="w-4 h-4 text-mono-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-mono-100 border-mono-300 w-56">
              <DropdownMenuItem onClick={copyCode}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Room Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyInviteLink}>
                <Link2 className="w-4 h-4 mr-2" />
                Copy Invite Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleTheme}>
                {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
              </DropdownMenuItem>
              {isHost && (
                <DropdownMenuItem onClick={onToggleLock}>
                  {isLocked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  {isLocked ? 'Unlock Room' : 'Lock Room'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-mono-600">
                <Users className="w-4 h-4 mr-2" />
                {participantCount} participants
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isHost && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleLock}
              className={`hidden sm:inline-flex h-7 w-7 rounded-full touch-target ${isLocked ? 'text-warning hover:text-warning' : ''}`}
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
