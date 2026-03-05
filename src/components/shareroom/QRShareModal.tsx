import { useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRShareModalProps {
    roomCode: string;
    /** Pass the encryption key if E2E is active — it will be embedded in the share URL */
    encryptionKey?: string;
}

export const QRShareModal = ({ roomCode, encryptionKey }: QRShareModalProps) => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = encryptionKey
        ? `${window.location.origin}/room/${roomCode}#key=${encryptionKey}`
        : `${window.location.origin}/room/${roomCode}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-mono-100/80 hover:bg-mono-200/80 transition-colors border border-mono-200/50 touch-target"
                title="Share QR code"
            >
                <QrCode className="w-3.5 h-3.5 text-mono-600" />
                <span className="hidden md:inline text-xs text-mono-700">Share</span>
            </button>

            {open && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    {/* Modal */}
                    <div
                        className="relative z-10 bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-[320px] flex flex-col items-center gap-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close */}
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-white/70" />
                        </button>

                        <h2 className="text-white font-semibold text-base">Scan to join</h2>

                        {/* QR */}
                        <div className="p-4 bg-white rounded-xl">
                            <QRCodeSVG
                                value={shareUrl}
                                size={200}
                                bgColor="#ffffff"
                                fgColor="#09090b"
                                level="M"
                            />
                        </div>

                        <div className="w-full space-y-2">
                            <p className="text-white/40 text-xs text-center font-mono tracking-wider">{roomCode}</p>

                            {/* URL copy */}
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                <span className="text-white/50 text-xs truncate flex-1 font-mono">{shareUrl.replace('https://', '')}</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCopy}
                                    className="h-6 px-2 text-xs shrink-0 text-white/70 hover:text-white"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </Button>
                            </div>
                        </div>

                        {encryptionKey && (
                            <div className="mt-1 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 max-w-full">
                                <span className="text-[12px] leading-tight shrink-0">🔐</span>
                                <p className="text-[11px] text-amber-500/90 leading-tight text-left">
                                    Link includes the encryption key. Share only with trusted people.
                                </p>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
