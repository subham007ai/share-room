import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useRoom } from '@/hooks/useRoom';
import { usePanicClose } from '@/hooks/usePanicClose';
import { useTheme } from '@/hooks/useTheme';
import { RoomHeader } from '@/components/shareroom/RoomHeader';
import { MessageBubble } from '@/components/shareroom/MessageBubble';
import { ChatInput } from '@/components/shareroom/ChatInput';
import { FakeScreen } from '@/components/shareroom/FakeScreen';
import { ParticipantsList } from '@/components/shareroom/ParticipantsList';
import { Loader2, AlertCircle, EyeOff } from 'lucide-react';
import { LoaderOne } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const username = searchParams.get('username');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; content: string } | null>(null);
  const [fakeMode, setFakeMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);

  const {
    room,
    messages,
    participants,
    participant,
    isHost,
    loading,
    error,
    sendMessage,
    sendFile,
    toggleLock,
    deleteMessage,
    muteUser,
    kickUser,
    leaveRoom,
  } = useRoom(code || null, username);

  // Panic close handler
  usePanicClose(async () => {
    await leaveRoom();
  });

  // Room access guard - simplified for localStorage
  useEffect(() => {
    if (!username) {
      navigate(`/?code=${code}`, { replace: true });
      return;
    }
    setAccessChecked(true);
  }, [code, username, navigate]);

  // Track scroll position with throttling for better performance
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 150;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold);
    }
  }, []);

  // Throttled scroll handler for performance
  const throttledHandleScroll = useCallback(() => {
    let ticking = false;
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
  }, [handleScroll]);

  // Auto scroll to bottom only when user is at bottom
  useEffect(() => {
    if (isAtBottom && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isAtBottom]);

  const handleSend = useCallback(async (content: string) => {
    await sendMessage(content, replyTo?.id);
    setReplyTo(null);
    // Scroll to bottom after sending
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [sendMessage, replyTo]);

  const handleBack = useCallback(async () => {
    await leaveRoom();
    navigate('/', { replace: true });
  }, [leaveRoom, navigate]);

  const scrollToMessage = useCallback((id: string) => {
    const element = document.getElementById(`message-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary/10');
      setTimeout(() => element.classList.remove('bg-primary/10'), 2000);
    }
  }, []);

  // Fake mode
  if (fakeMode) {
    return (
      <div onClick={() => setFakeMode(false)} className="cursor-pointer">
        <FakeScreen />
      </div>
    );
  }

  // Loading state - also wait for access check
  if (loading || !accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mono-0">
        <div className="flex items-center justify-center">
          <LoaderOne className="text-mono-600 scale-[2]" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mono-0 px-4">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold text-mono-800">{error}</h2>
          <p className="text-mono-500 text-sm">
            The room may have been deleted or you may have been banned.
          </p>
          <Button onClick={() => navigate('/', { replace: true })} variant="outline" className="border-mono-300 bg-mono-100 hover:bg-mono-200 text-mono-800">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Vercel Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Your Content/Components */}
      <div className="h-screen flex flex-col relative z-10">
        {/* Header */}
        <RoomHeader
          roomCode={room.code}
          roomName={room.name}
          isLocked={room.is_locked}
          isHost={isHost}
          participantCount={participants.length}
          participants={participants}
          theme={theme}
          onBack={handleBack}
          onToggleLock={toggleLock}
          onToggleTheme={toggleTheme}
        />

        {/* Main content area with max-width */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={throttledHandleScroll()}
            className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-32 sm:pb-36 will-change-scroll"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="max-w-[95%] sm:max-w-[780px] mx-auto w-full px-2 sm:px-4 py-2 sm:py-4">
              <div className="space-y-2 sm:space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8 sm:py-12 text-mono-500">
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                )}

                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.participant_id === participant?.id}
                    isHost={isHost}
                    replyMessage={
                      message.reply_to_id
                        ? messages.find((m) => m.id === message.reply_to_id) || null
                        : null
                    }
                    onReply={() =>
                      setReplyTo({
                        id: message.id,
                        username: message.username,
                        content: message.content || '',
                      })
                    }
                    onDelete={isHost || message.participant_id === participant?.id ? () => deleteMessage(message.id) : undefined}
                    onMuteUser={message.participant_id ? () => muteUser(message.participant_id!) : undefined}
                    onKickUser={message.participant_id ? () => kickUser(message.participant_id!, true) : undefined}
                    onScrollToMessage={scrollToMessage}
                  />
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>
          </div>

          {/* Input - floating at bottom */}
          <div className="fixed bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[95%] sm:max-w-[780px] px-2 sm:px-4">
            <ChatInput
              onSend={handleSend}
              onFileUpload={sendFile}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              disabled={participant?.is_muted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
