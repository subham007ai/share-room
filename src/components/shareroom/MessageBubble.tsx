import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Reply, Trash2, MoreVertical, VolumeX, UserX, ExternalLink, FileText, File, Image, Pencil, Ban, Link as LinkIcon } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { ReactionBar } from './ReactionBar';
import type { Reaction } from '@/hooks/useRoom';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  username: string;
  content: string | null;
  message_type: string;
  is_system: boolean;
  reply_to_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  participant_id: string | null;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isHost: boolean;
  replyMessage?: Message | null;
  reactions?: Reaction[];
  sessionId?: string | null;
  onReply: () => void;
  onDelete?: () => void;
  onEdit?: (content: string) => void;
  onMuteUser?: () => void;
  onKickUser?: () => void;
  onBanUser?: () => void;
  onScrollToMessage?: (id: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}

export const MessageBubble = memo(({
  message,
  isOwn,
  isHost,
  replyMessage,
  reactions = [],
  sessionId,
  onReply,
  onDelete,
  onEdit,
  onMuteUser,
  onKickUser,
  onBanUser,
  onScrollToMessage,
  onToggleReaction,
}: MessageBubbleProps) => {
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content || '');

  // Long-press detection for mobile
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTimerRef.current = setTimeout(() => {
      setShowMobileMenu(true);
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(30);
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);
    // Cancel if finger moved more than 10px
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    touchStartRef.current = null;
  }, []);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      touchStartRef.current = null;
    };
  }, []);

  // Sync editValue when message.content changes externally (but not while editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(message.content || '');
    }
  }, [message.content, isEditing]);

  // Handler for copying message link with error handling
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.href.split('?')[0]}#message-${message.id}`);
      toast({ title: 'Link copied', description: 'Message link copied to clipboard' });
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast({ title: 'Copy failed', description: 'Could not copy link to clipboard', variant: 'destructive' });
    }
  }, [message.id]);

  // System messages
  if (message.is_system) {
    return (
      <div className="flex justify-center py-2 animate-message-system">
        <span className="text-[11px] text-white/50 px-3 py-1 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
          {message.content}
        </span>
      </div>
    );
  }

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const parseContent = (content: string | null) => {
    if (!content) return [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index).trim() });
      }
      parts.push({ type: 'code', content: match[2].trim(), language: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex).trim();
      if (remaining) parts.push({ type: 'text', content: remaining });
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
  };

  const contentParts = parseContent(message.content);
  const canEdit = isOwn && message.message_type !== 'file' && !message.is_system;
  const isPdf = message.file_type?.includes('pdf');
  const isTxt = message.file_name?.endsWith('.txt');
  const isImage = message.file_type?.startsWith('image/');

  /**
   * Render inline markdown: **bold**, *italic*, `code`, ~~strike~~
   * Returns an array of React nodes.
   */
  const renderInline = (text: string): React.ReactNode[] => {
    // Token regex — order matters: code > strikethrough > bold > italic
    const tokenRegex = /(`[^`]+`)|(~~[^~]+~~)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
    const nodes: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let keyIdx = 0;
    while ((m = tokenRegex.exec(text)) !== null) {
      if (m.index > last) nodes.push(text.slice(last, m.index));
      const raw = m[0];
      if (raw.startsWith('`') && raw.endsWith('`')) {
        nodes.push(<code key={keyIdx++} className="px-1 py-0.5 bg-white/10 rounded text-[0.82em] font-mono text-cyan-300">{raw.slice(1, -1)}</code>);
      } else if (raw.startsWith('~~')) {
        nodes.push(<s key={keyIdx++} className="opacity-60">{raw.slice(2, -2)}</s>);
      } else if (raw.startsWith('**')) {
        nodes.push(<strong key={keyIdx++}>{raw.slice(2, -2)}</strong>);
      } else if (raw.startsWith('*')) {
        nodes.push(<em key={keyIdx++}>{raw.slice(1, -1)}</em>);
      } else {
        nodes.push(raw);
      }
      last = m.index + raw.length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
  };
  const bubbleTone = isOwn
    ? 'bg-[hsl(var(--room-surface-muted))] text-white border border-white/15'
    : 'bg-[hsl(var(--room-surface))] text-[hsl(var(--room-text))] border border-[hsl(var(--room-border))]';

  return (
    <div
      id={`message-${message.id}`}
      className={`group flex flex-col ${isOwn ? 'items-end animate-message-send' : 'items-start animate-message-receive'} mb-3`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Reply reference */}
      {replyMessage && (
        <button
          onClick={() => onScrollToMessage?.(replyMessage.id)}
          className={`flex items-center gap-1.5 text-xs text-mono-500 hover:text-mono-700 transition-colors mb-1 ${isOwn ? 'mr-2' : 'ml-2'}`}
        >
          <Reply className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-[280px]">
            Replying to {replyMessage.username}: {replyMessage.content?.slice(0, 30)}...
          </span>
        </button>
      )}

      {/* Username and time */}
      <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'mr-2 flex-row-reverse' : 'ml-2'}`}>
        <span className="text-xs font-medium text-white/70">{message.username}</span>
        <span className="text-[10px] text-white/40">{time}</span>
      </div>

      <div className={`flex items-end gap-1 sm:gap-2 max-w-[90%] sm:max-w-[72%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Message bubble */}
        <div className="relative text-sm text-white">
          {/* File message */}
          {message.message_type === 'file' && message.file_url && (
            <div className={`space-y-2 px-3 py-2.5 rounded-2xl ${bubbleTone}`}>
              {isImage ? (
                <div className="space-y-2">
                  <img
                    src={message.file_url}
                    alt={message.file_name || 'Shared image'}
                    className="max-w-full max-h-[300px] rounded-lg object-contain"
                    loading="lazy"
                  />
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 shrink-0 text-white/80" />
                    <span className={`font-mono text-xs break-all ${isOwn ? 'text-mono-100' : 'text-mono-300'}`}>
                      {message.file_name}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {isPdf ? (
                      <FileText className="w-4 h-4 shrink-0 text-red-400" />
                    ) : (
                      <File className="w-4 h-4 shrink-0 text-white/80" />
                    )}
                    <span className="font-mono text-xs sm:text-sm break-all text-white/90">
                      {message.file_name}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs hover:underline text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </a>
                    {(isPdf || isTxt) && (
                      <button
                        onClick={() => setShowPdfViewer(!showPdfViewer)}
                        className="text-xs text-white/70 hover:text-white/90"
                      >
                        {showPdfViewer ? 'Hide' : 'Preview'}
                      </button>
                    )}
                  </div>

                  {showPdfViewer && isPdf && (
                    <iframe
                      src={message.file_url}
                      className="w-full h-[250px] sm:h-[400px] rounded-md border border-mono-300 mt-2"
                    />
                  )}

                  {showPdfViewer && isTxt && (
                    <iframe
                      src={message.file_url}
                      className="w-full h-[150px] sm:h-[200px] rounded-md border border-mono-300 bg-mono-100 mt-2"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Text message with code blocks */}
          {message.message_type !== 'file' && (
            <div className="space-y-2">
              {isEditing ? (
                <div className="bg-white/10 border border-white/20 rounded-2xl p-2 space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full min-h-[70px] bg-transparent text-white text-sm resize-y focus:outline-none"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditValue(message.content || ''); }} className="h-7 px-2 text-xs text-white/80">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onEdit?.(editValue.trim());
                        setIsEditing(false);
                      }}
                      className="h-7 px-2 text-xs"
                      disabled={!editValue.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                contentParts.map((part, i) =>
                  part.type === 'code' ? (
                    <div key={i} className="overflow-hidden rounded-lg -mx-1 my-1 bg-transparent">
                      <CodeBlock code={part.content} language={part.language} />
                    </div>
                  ) : (
                    <div key={i} className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl ${bubbleTone}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {renderInline(part.content)}
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          )}

          {/* Reaction bar */}
          {onToggleReaction && (
            <ReactionBar
              reactions={reactions}
              sessionId={sessionId || null}
              onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
            />
          )}
        </div>

        {/* Actions - visible on hover (desktop) */}
        <div className={`opacity-70 group-hover:opacity-100 transition-opacity items-center gap-0.5 shrink-0 hidden sm:flex ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onReply}
            className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-white/50 hover:text-white/80 hover:bg-white/10"
          >
            <Reply className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Button>

          {(isHost || isOwn) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-white/50 hover:text-white/90 hover:bg-white/10">
                  <MoreVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-mono-100 border-mono-300">
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
                {canEdit && onEdit && (
                  <DropdownMenuItem onClick={() => { setEditValue(message.content || ''); setIsEditing(true); }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleCopyLink}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                {isHost && !isOwn && onMuteUser && (
                  <DropdownMenuItem onClick={onMuteUser}>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Mute User
                  </DropdownMenuItem>
                )}
                {isHost && !isOwn && onKickUser && (
                  <DropdownMenuItem onClick={onKickUser}>
                    <UserX className="w-4 h-4 mr-2" />
                    Kick
                  </DropdownMenuItem>
                )}
                {isHost && !isOwn && onBanUser && (
                  <DropdownMenuItem onClick={onBanUser} className="text-destructive">
                    <Ban className="w-4 h-4 mr-2" />
                    Ban
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile long-press context menu */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-white/10 rounded-t-2xl p-4 pb-8 animate-slide-up">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="space-y-1">
              <button
                onClick={() => { onReply(); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white text-sm"
              >
                <Reply className="w-4 h-4 text-white/60" />
                Reply
              </button>
              {(isHost || isOwn) && onDelete && (
                <button
                  onClick={() => { onDelete(); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-red-400 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              {canEdit && onEdit && (
                <button
                  onClick={() => { setEditValue(message.content || ''); setIsEditing(true); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white text-sm"
                >
                  <Pencil className="w-4 h-4 text-white/60" />
                  Edit
                </button>
              )}
              <button
                onClick={() => { handleCopyLink(); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white text-sm"
              >
                <LinkIcon className="w-4 h-4 text-white/60" />
                Copy Link
              </button>
              {isHost && !isOwn && onMuteUser && (
                <button
                  onClick={() => { onMuteUser(); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white text-sm"
                >
                  <VolumeX className="w-4 h-4 text-white/60" />
                  Mute User
                </button>
              )}
              {isHost && !isOwn && onKickUser && (
                <button
                  onClick={() => { onKickUser(); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white text-sm"
                >
                  <UserX className="w-4 h-4" />
                  Kick
                </button>
              )}
              {isHost && !isOwn && onBanUser && (
                <button
                  onClick={() => { onBanUser(); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-red-400 text-sm"
                >
                  <Ban className="w-4 h-4" />
                  Ban
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
});
