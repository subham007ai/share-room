import { useState, useRef, memo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Code, X, ArrowRight } from 'lucide-react';
import { LoaderOne } from '@/components/ui/loader';

interface ChatInputProps {
  onSend: (content: string) => void;
  onFileUpload: (file: File | File[]) => void;
  onTyping?: () => void;
  replyTo?: { id: string; username: string; content: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  onRegisterFocus?: (focus: () => void) => void;
  uploadingFiles?: string[];
}

export const ChatInput = memo(({
  onSend,
  onFileUpload,
  onTyping,
  replyTo,
  onCancelReply,
  disabled,
  onRegisterFocus,
  uploadingFiles = [],
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [codeMode, setCodeMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatSize = (size: number) => {
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const removeFileAt = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTyping = useCallback(() => {
    if (!onTyping) return;
    if (!typingTimeoutRef.current) {
      onTyping();
    } else {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 300);
  }, [onTyping]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;

    setSending(true);
    try {
      if (selectedFiles.length > 0 && !disabled) {
        await onFileUpload(selectedFiles);
        setSelectedFiles([]);
      } else if (message.trim() && !disabled) {
        if (codeMode) {
          const codeBlock = `\`\`\`\n${message}\n\`\`\``;
          await onSend(codeBlock);
        } else {
          await onSend(message.trim());
        }
        setMessage('');
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setSelectedFiles((prev) => [...prev, file]);
            e.preventDefault();
          }
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    onRegisterFocus?.(focusInput);
  }, [onRegisterFocus, focusInput]);

  return (
    <div className="py-2 sm:py-3">
      {replyTo && (
        <div className="indicator-bar justify-between mb-2">
          <span className="text-xs text-mono-500 truncate mr-2">
            Replying to <span className="font-medium text-mono-700">{replyTo.username}</span>
          </span>
          <Button size="sm" variant="ghost" onClick={onCancelReply} className="h-6 w-6 p-0 icon-btn shrink-0">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {codeMode && (
        <div className="indicator-bar mb-2 border-mono-300">
          <Code className="w-3.5 h-3.5 text-mono-600 shrink-0" />
          <span className="text-xs text-mono-600 truncate">Code mode ON - sent as code block</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mb-2 p-2.5 bg-[hsl(var(--room-surface))] border border-[hsl(var(--room-border))] rounded-xl space-y-2">
          <div className="text-xs text-[hsl(var(--room-text-muted))]">Files ready to send ({selectedFiles.length})</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center justify-between text-xs bg-[hsl(var(--room-surface-muted))] rounded px-2 py-1 border border-white/10">
                <span className="truncate mr-2 text-[hsl(var(--room-text))]">{file.name} - {formatSize(file.size)}</span>
                <Button size="sm" variant="ghost" onClick={() => removeFileAt(idx)} className="h-5 w-5 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadingFiles.length > 0 && (
        <div className="mb-2 p-2.5 bg-[hsl(var(--room-surface))] border border-[hsl(var(--room-border))] rounded-xl text-xs space-y-2">
          <div className="text-[hsl(var(--room-text-muted))]">Uploading files</div>
          <div className="space-y-1.5">
            {uploadingFiles.map((name) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-[hsl(var(--room-text))]">
                  <span className="truncate mr-2">{name}</span>
                  <span className="text-[10px] text-[hsl(var(--room-text-muted))]">uploading</span>
                </div>
                <div className="h-1.5 rounded-full bg-[hsl(var(--room-surface-muted))] overflow-hidden">
                  <div className="h-full w-1/2 bg-[hsl(var(--room-accent))] animate-pulse rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-[hsl(var(--room-surface))] backdrop-blur-md border border-[hsl(var(--room-border))] rounded-2xl shadow-lg mobile-optimized smooth-transition">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.java,.c,.py,.cpp,.zip,.pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[hsl(var(--room-surface-muted))] border border-white/10 hover:bg-white/10 text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={selectedFiles.length > 0 ? 'Press Enter to send files' : (codeMode ? 'Type code...' : 'Type a message...')}
              disabled={disabled}
              className={`min-h-[32px] sm:min-h-[36px] max-h-[100px] sm:max-h-[120px] resize-none bg-transparent text-[hsl(var(--room-text))] placeholder:text-[hsl(var(--room-text-muted))] focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm will-change-contents ${codeMode ? 'font-mono' : ''}`}
              rows={1}
              style={{ WebkitAppearance: 'none' }}
            />
          </div>

          <Button
            type="button"
            variant={codeMode ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setCodeMode(!codeMode)}
            disabled={disabled}
            className={`shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-full ${codeMode ? 'bg-white hover:bg-white/90 text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            title={codeMode ? 'Code mode ON (click to turn off)' : 'Code mode OFF (click to turn on)'}
          >
            <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>

          <Button
            type="submit"
            size="icon"
            disabled={disabled || (!message.trim() && selectedFiles.length === 0) || sending}
            className="shrink-0 bg-[hsl(var(--room-accent))] hover:brightness-110 text-white h-10 w-10 sm:h-11 sm:w-11 rounded-full disabled:opacity-40 disabled:bg-gray-500"
          >
            {sending ? <LoaderOne className="text-white" /> : <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
});
