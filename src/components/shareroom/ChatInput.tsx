import { useState, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus, Code, X, ArrowRight } from 'lucide-react';
import { LoaderOne } from '@/components/ui/loader';

interface ChatInputProps {
  onSend: (content: string) => void;
  onFileUpload: (file: File) => void;
  replyTo?: { id: string; username: string; content: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export const ChatInput = memo(({
  onSend,
  onFileUpload,
  replyTo,
  onCancelReply,
  disabled,
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [codeMode, setCodeMode] = useState(false);
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;

    setSending(true);
    try {
      if (pastedImage) {
        await onFileUpload(pastedImage);
        setPastedImage(null);
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
            setPastedImage(file);
            e.preventDefault();
          }
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="py-2 sm:py-3">
      {/* Reply indicator */}
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

      {/* Code mode indicator */}
      {codeMode && (
        <div className="indicator-bar mb-2 border-mono-300">
          <Code className="w-3.5 h-3.5 text-mono-600 shrink-0" />
          <span className="text-xs text-mono-600 truncate">Code mode ON - sent as code block</span>
        </div>
      )}

      {/* Pasted image preview */}
      {pastedImage && (
        <div className="mb-2 p-2 bg-mono-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-mono-600">Image ready to send</span>
            <Button size="sm" variant="ghost" onClick={() => setPastedImage(null)} className="h-6 w-6 p-0">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <img
            src={URL.createObjectURL(pastedImage)}
            alt="Pasted screenshot"
            className="max-w-full max-h-32 rounded object-contain"
          />
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg mobile-optimized smooth-transition">
        <input
          ref={fileInputRef}
          type="file"
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
          className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={pastedImage ? "Press Enter to send image" : (codeMode ? "Type code..." : "Type a message...")}
              disabled={disabled}
              className={`min-h-[32px] sm:min-h-[36px] max-h-[100px] sm:max-h-[120px] resize-none bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm will-change-contents ${codeMode ? 'font-mono' : ''}`}
              rows={1}
              style={{ WebkitAppearance: 'none' }}
            />
          </div>

          <Button
            type="button"
            variant={codeMode ? "default" : "ghost"}
            size="icon"
            onClick={() => setCodeMode(!codeMode)}
            disabled={disabled}
            className={`shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-full ${codeMode ? 'bg-white hover:bg-white/90 text-black' : 'text-white/60 hover:text-white hover:bg-white/20'}`}
            title={codeMode ? "Code mode ON (click to turn off)" : "Code mode OFF (click to turn on)"}
          >
            <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>

          <Button
            type="submit"
            size="icon"
            disabled={disabled || (!message.trim() && !pastedImage) || sending}
            className="shrink-0 bg-green-500 hover:bg-green-600 text-white h-10 w-10 sm:h-11 sm:w-11 rounded-full disabled:opacity-40 disabled:bg-gray-400"
          >
            {sending ? <LoaderOne className="text-white" /> : <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
});
