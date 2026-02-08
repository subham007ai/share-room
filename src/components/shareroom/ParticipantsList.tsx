import { Button } from '@/components/ui/button';
import { VolumeX, Volume2, UserX, Crown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Users } from 'lucide-react';

interface Participant {
  id: string;
  username: string;
  is_muted: boolean;
  session_id: string; // was fingerprint
}

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId: string | null;
  hostSessionId: string; // was hostFingerprint
  isHost: boolean;
  onMuteUser: (id: string) => void;
  onKickUser: (id: string) => void;
}

export const ParticipantsList = ({
  participants,
  currentUserId,
  hostSessionId,
  isHost,
  onMuteUser,
  onKickUser,
}: ParticipantsListProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative icon-btn">
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-mono-700 text-mono-100 text-xs rounded-full flex items-center justify-center">
            {participants.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-mono-50 border-mono-300 w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-mono-800">Participants ({participants.length})</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {participants.map((p) => {
            const isCurrentUser = p.id === currentUserId;
            const isParticipantHost = p.session_id === hostSessionId;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${isCurrentUser ? 'bg-mono-200 border border-mono-400' : 'bg-mono-100 border border-mono-300'
                  }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`avatar-md rounded-full font-bold ${isParticipantHost ? 'avatar-host' : 'bg-mono-300 text-mono-700'}`}>
                    {p.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="font-medium text-mono-800 text-sm truncate">{p.username}</span>
                      {isCurrentUser && (
                        <span className="text-xs text-mono-500 shrink-0">(you)</span>
                      )}
                      {isParticipantHost && (
                        <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning shrink-0" />
                      )}
                    </div>
                    {p.is_muted && (
                      <span className="text-xs text-destructive flex items-center gap-1">
                        <VolumeX className="w-3 h-3" />
                        Muted
                      </span>
                    )}
                  </div>
                </div>

                {isHost && !isCurrentUser && !isParticipantHost && (
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMuteUser(p.id)}
                      className="icon-btn-sm sm:h-8 sm:w-8"
                    >
                      {p.is_muted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onKickUser(p.id)}
                      className="icon-btn-sm sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
