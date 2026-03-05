import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRoom } from '@/hooks/useRoom';
import { usePanicClose } from '@/hooks/usePanicClose';
import { useTheme } from '@/hooks/useTheme';
import { RoomHeader } from '@/components/shareroom/RoomHeader';
import { MessageBubble } from '@/components/shareroom/MessageBubble';
import { ChatInput } from '@/components/shareroom/ChatInput';
import { TypingIndicator } from '@/components/shareroom/TypingIndicator';
import { ScrollToBottomFAB } from '@/components/shareroom/ScrollToBottomFAB';
import { FakeScreen } from '@/components/shareroom/FakeScreen';
import { AlertCircle, Upload, MessageSquare } from 'lucide-react';
import { LoaderOne } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';

const Room = () => {
  const { code: rawCode } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const codeParts = (rawCode || '').split(':username=');
  const code = codeParts[0] || null;
  const inlineUsername = codeParts.length > 1 ? codeParts.slice(1).join(':username=') : null;
  const username = searchParams.get('username') || inlineUsername;
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; content: string } | null>(null);
  const [fakeMode, setFakeMode] = useState(false);
  const [initialMessageCount, setInitialMessageCount] = useState<number | null>(null);

  // Extract E2E encryption key from URL fragment (#key=...)
  // The fragment never leaves the browser — it is not sent to Supabase or any server.
  const encryptionKey = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.hash.slice(1)).get('key') ?? undefined
    : undefined;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const focusInputRef = useRef<(() => void) | null>(null);
  const previousMessagesLengthRef = useRef(0);

  const {
    room,
    messages,
    participants,
    participant,
    isHost,
    loading,
    error,
    typingUsers,
    uploadingFiles,
    sessionId,
    reactions,
    sendMessage,
    sendFile,
    toggleLock,
    deleteMessage,
    muteUser,
    kickUser,
    leaveRoom,
    broadcastTyping,
    toggleReaction,
    updateMessage,
  } = useRoom(code, username, encryptionKey);

  // Panic close handler
  usePanicClose(async () => {
    await leaveRoom();
    navigate('/', { replace: true });
  });

  // Room access guard
  useEffect(() => {
    if (!username) {
      navigate(`/?code=${code || ''}`, { replace: true });
      return;
    }
    setAccessChecked(true);
  }, [code, username, navigate]);

  // Track scroll position & unread count
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 150;
      const atBottom = scrollHeight - scrollTop - clientHeight < threshold;

      setIsAtBottom(atBottom);

      if (atBottom) {
        setUnreadCount(0);
      }
    }
  }, []);

  // Update unread count when new messages arrive and not at bottom
  useEffect(() => {
    const prevLength = previousMessagesLengthRef.current;
    const currLength = messages.length;

    // Only process if messages were added (not edited/deleted)
    if (currLength > prevLength) {
      const newMessagesCount = currLength - prevLength;
      // Get the new messages
      const newMessages = messages.slice(-newMessagesCount);
      // Count messages not from current participant
      const otherUsersNewMessages = newMessages.filter(
        msg => msg.participant_id !== participant?.id
      ).length;

      // Increment unread count only if not at bottom and there are new messages from others
      if (!isAtBottom && otherUsersNewMessages > 0) {
        setUnreadCount(prev => prev + otherUsersNewMessages);
      }
    }

    // Update ref to track current length
    previousMessagesLengthRef.current = currLength;
  }, [messages, isAtBottom, participant?.id]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set dragging to false if we're leaving the window/container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await sendFile(files);
    }
  };

  // Stable throttled scroll handler held in a ref so the closure is created once
  const throttledHandleScrollRef = useRef<() => void>(null!);
  if (!throttledHandleScrollRef.current) {
    let ticking = false;
    throttledHandleScrollRef.current = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadCount(0);
  };

  // Auto scroll to bottom only when user is at bottom
  useEffect(() => {
    if (isAtBottom && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isAtBottom, typingUsers]);

  const handleSend = useCallback(async (content: string) => {
    // Haptic feedback on send (mobile)
    if (navigator.vibrate) navigator.vibrate(10);
    await sendMessage(content, replyTo?.id);
    setReplyTo(null);
    setTimeout(scrollToBottom, 100);
  }, [sendMessage, replyTo]);

  const handleBack = useCallback(async () => {
    await leaveRoom();
    navigate('/', { replace: true });
  }, [leaveRoom, navigate]);

  const scrollToMessage = useCallback((id: string) => {
    const element = document.getElementById(`message-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-white/10');
      setTimeout(() => element.classList.remove('bg-white/10'), 2000);
    }
  }, []);

  useEffect(() => {
    const isEditableTarget = (el: EventTarget | null) => {
      const target = el as HTMLElement | null;
      if (!target) return false;
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isEditableTarget(e.target)) {
        e.preventDefault();
        focusInputRef.current?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusInputRef.current?.();
      }
      if (e.key === 'Escape' && replyTo) {
        setReplyTo(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [replyTo]);

  useEffect(() => {
    if (!loading) {
      setLoadingTooLong(false);
      return;
    }
    const timer = setTimeout(() => setLoadingTooLong(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Fake mode
  if (fakeMode) {
    return (
      <div onClick={() => setFakeMode(false)} className="cursor-pointer">
        <FakeScreen />
      </div>
    );
  }

  // Loading state
  if (loading || !accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center room-shell px-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <LoaderOne className="text-white scale-[2]" />
          </div>
          <p className="text-sm text-white/70">Loading room...</p>
          {loadingTooLong && (
            <div className="space-y-2">
              <p className="text-xs text-white/60">This is taking longer than expected.</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Retry
              </Button>
            </div>
          )}
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
          <Button onClick={() => navigate('/', { replace: true })} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mono-0 px-4">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold text-mono-800">Unable to load room</h2>
          <p className="text-sm text-mono-600">The room may have expired or there was a connection issue.</p>
          <Button onClick={() => navigate('/', { replace: true })} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 w-full h-screen supports-[height:100dvh]:h-[100dvh] room-shell overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[60] bg-[hsl(var(--room-shell))/0.88] backdrop-blur-sm flex items-center justify-center animate-fade-in border-4 border-dashed border-[hsl(var(--room-border))] m-4 rounded-3xl pointer-events-none">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-[hsl(var(--room-surface))] rounded-full flex items-center justify-center mx-auto border border-[hsl(var(--room-border))]">
              <Upload className="w-10 h-10 text-white animate-bounce" />
            </div>
            <h3 className="text-2xl font-bold text-white">Drop file to share</h3>
          </div>
        </div>
      )}

      {/* Background Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsla(0, 0%, 100%, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, hsla(0, 0%, 100%, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="flex flex-col h-full relative z-10 supports-[height:100dvh]:h-[100dvh]">
        <RoomHeader
          roomCode={room.code}
          roomName={room.name}
          isLocked={room.is_locked}
          isHost={isHost}
          participantCount={participants.length}
          participants={participants}
          expiresAt={room.expires_at}
          theme={theme}
          encryptionKey={encryptionKey}
          onBack={handleBack}
          onToggleLock={toggleLock}
          onToggleTheme={toggleTheme}
        />

        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={throttledHandleScrollRef.current}
            className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20 sm:pb-24 scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="max-w-[95%] sm:max-w-[780px] mx-auto w-full px-2 sm:px-4 py-3 sm:py-5">
              <div className="space-y-5">
                <div className="text-center py-6 text-[hsl(var(--room-text-muted))] text-xs uppercase tracking-widest select-none flex items-center justify-center gap-2">
                  <MessageSquare className="w-3 h-3" />
                  <span>Messages are ephemeral</span>
                </div>

                {messages.map((message, index) => {
                  // Stagger only the initial batch of messages on load
                  const isInitialLoad = initialMessageCount === null || index < (initialMessageCount ?? 0);
                  const staggerDelay = isInitialLoad ? Math.min(index, 15) * 0.04 : 0;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: staggerDelay, ease: 'easeOut' }}
                    >
                      <MessageBubble
                        message={message}
                        isOwn={message.participant_id === participant?.id}
                        isHost={isHost}
                        sessionId={sessionId}
                        reactions={reactions.get(message.id) || []}
                        onToggleReaction={toggleReaction}
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
                        onEdit={message.participant_id === participant?.id ? (content) => updateMessage(message.id, content) : undefined}
                        onMuteUser={message.participant_id ? () => muteUser(message.participant_id!) : undefined}
                        onKickUser={message.participant_id ? () => kickUser(message.participant_id!, false) : undefined}
                        onBanUser={message.participant_id ? () => kickUser(message.participant_id!, true) : undefined}
                        onScrollToMessage={scrollToMessage}
                      />
                    </motion.div>
                  );
                })}

                {/* Typing Indicator */}
                <div className="min-h-[20px] mb-2">
                  <TypingIndicator typingUsers={Array.from(typingUsers.values())} />
                </div>

                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>
          </div>

          {/* Scroll to Bottom FAB */}
          <ScrollToBottomFAB
            show={!isAtBottom}
            unreadCount={unreadCount}
            onClick={scrollToBottom}
          />

          {/* Input Area */}
          <div className="w-full bg-gradient-to-t from-[hsl(var(--room-shell))] via-[hsl(var(--room-shell))/0.95] to-transparent pt-4 pb-2 sm:pb-4 px-2 sm:px-4 z-20">
            <div className="max-w-[95%] sm:max-w-[780px] mx-auto w-full">
              <ChatInput
                onSend={handleSend}
                onFileUpload={sendFile}
                onTyping={broadcastTyping}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                disabled={participant?.is_muted}
                uploadingFiles={uploadingFiles}
                onRegisterFocus={(focus) => {
                  focusInputRef.current = focus;
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
