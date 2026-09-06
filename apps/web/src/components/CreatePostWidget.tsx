import { useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '../stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Image as ImageIcon,
    X,
    BarChart2,
    Hash,
    Smile,
    Send,
    ChevronDown,
} from 'lucide-react';

interface CreatePostWidgetProps {
    onPostCreated: (post: any) => void;
    placeholder?: string;
    parentId?: string;
    quotedPostId?: string;
    isReply?: boolean;
    autoFocus?: boolean;
}

const POST_TYPES = [
    { key: 'opinion', label: 'Opinión', color: 'hsl(215 90% 60%)', bg: 'hsl(215 90% 60% / 0.1)' },
    { key: 'analysis', label: 'Análisis', color: 'hsl(142 70% 45%)', bg: 'hsl(142 70% 45% / 0.1)' },
    { key: 'education', label: 'Educación', color: 'hsl(280 65% 65%)', bg: 'hsl(280 65% 65% / 0.1)' },
    { key: 'news', label: 'Noticia', color: 'hsl(38 88% 52%)', bg: 'hsl(38 88% 52% / 0.1)' },
] as const;

type PostType = typeof POST_TYPES[number]['key'];

export default function CreatePostWidget({
    onPostCreated,
    placeholder = "¿Qué estás analizando? Usá $BTC, $AAPL...",
    parentId,
    quotedPostId,
    isReply = false,
    autoFocus = false,
}: CreatePostWidgetProps) {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [postType, setPostType] = useState<PostType>('opinion');
    const [showTypes, setShowTypes] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);

    const activeType = POST_TYPES.find(t => t.key === postType)!;
    const charCount = content.length;
    const maxChars = 500;
    const canPost = (content.trim() || image) && charCount <= maxChars;

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImage(null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleCreatePost = async () => {
        if (!canPost) return;
        setIsPosting(true);
        try {
            let mediaUrls: any[] = [];
            if (image) {
                const formData = new FormData();
                formData.append('files', image);
                const up = await apiFetch('/posts/upload-media', { method: 'POST', headers: {}, body: formData });
                if (!up.ok) throw new Error('Upload failed');
                mediaUrls = await up.json();
            }

            const tickers = Array.from(new Set((content.match(/\$[A-Za-z][A-Za-z0-9]{0,9}/g) ?? []).map(t => t.toUpperCase())));

            const res = await apiFetch('/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, tickers, postType, mediaUrls: mediaUrls.length ? mediaUrls : undefined, parentId, quotedPostId }),
            });
            if (!res.ok) throw new Error('Error creating post');

            onPostCreated(await res.json());
            setContent('');
            handleRemoveImage();
            setIsFocused(false);
        } catch (e) { console.error(e); }
        finally { setIsPosting(false); }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCreatePost();
    };

    if (isReply) {
        return (
            <div className="flex gap-3 w-full">
                <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-border/30 mt-0.5">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-[11px] font-bold" style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                        {user?.username?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <textarea
                        ref={textRef}
                        autoFocus={autoFocus}
                        placeholder="Escribe tu respuesta..."
                        className="w-full bg-transparent outline-none resize-none text-sm placeholder:text-muted-foreground/40 min-h-[56px]"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleCreatePost}
                            disabled={!canPost || isPosting}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all disabled:opacity-40"
                            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                        >
                            <Send className="w-3 h-3" />
                            {isPosting ? 'Enviando...' : 'Responder'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div
                className="rounded-2xl transition-all duration-200"
                style={{
                    background: 'hsl(var(--secondary) / 0.3)',
                    border: `1px solid ${isFocused ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border) / 0.4)'}`,
                    boxShadow: isFocused ? '0 0 0 3px hsl(var(--primary) / 0.06)' : 'none',
                }}
            >
                {/* Top row: avatar + textarea */}
                <div className="flex gap-3 p-4 pb-2">
                    <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-border/20 mt-0.5">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback className="text-[12px] font-bold"
                            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(280 65% 60%))', color: 'white' }}>
                            {user?.username?.[0]?.toUpperCase() ?? 'U'}
                        </AvatarFallback>
                    </Avatar>

                    <textarea
                        ref={textRef}
                        autoFocus={autoFocus}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent outline-none resize-none text-[14px] leading-relaxed min-h-[52px] placeholder:text-muted-foreground/40"
                        value={content}
                        onChange={e => { setContent(e.target.value); if (!isFocused) setIsFocused(true); }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => { if (!content && !image) setIsFocused(false); }}
                        onKeyDown={handleKeyDown}
                        maxLength={maxChars}
                    />
                </div>

                {/* Image preview */}
                <AnimatePresence>
                    {preview && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 pb-2"
                        >
                            <div className="relative inline-block">
                                {image?.type.startsWith('video/') ? (
                                    <video src={preview} controls className="h-36 rounded-xl border border-border/30 object-contain bg-black/5" />
                                ) : (
                                    <img src={preview} alt="Preview" className="h-36 rounded-xl object-cover border border-border/30" />
                                )}
                                <button
                                    onClick={handleRemoveImage}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                                    style={{ background: 'hsl(0 68% 50%)' }}
                                >
                                    <X className="w-2.5 h-2.5 text-white" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-4 py-2 sm:py-2.5 border-t" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                    {/* Left tools */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        <input type="file" ref={fileRef} className="hidden" accept="image/*,video/*" onChange={handleImageSelect} />
                        <ToolBtn icon={<ImageIcon className="w-4 h-4" />} label="Media" onClick={() => fileRef.current?.click()} />
                        <ToolBtn icon={<BarChart2 className="w-4 h-4" />} label="Chart" onClick={() => { setContent(c => c + ' $'); textRef.current?.focus(); }} />
                        <ToolBtn icon={<Hash className="w-4 h-4" />} label="Tag" onClick={() => { setContent(c => c + ' #'); textRef.current?.focus(); }} />
                        <ToolBtn icon={<Smile className="w-4 h-4" />} label="Emoji" onClick={() => { setContent(c => c + ' 🚀'); textRef.current?.focus(); }} />
                    </div>

                    {/* Right: type picker + post button */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Post type */}
                        <div className="relative">
                            <button
                                onClick={() => setShowTypes(v => !v)}
                                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                                style={{ background: activeType.bg, color: activeType.color }}
                            >
                                {activeType.label}
                                <ChevronDown className="w-3 h-3" style={{ transform: showTypes ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                            </button>
                            <AnimatePresence>
                                {showTypes && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute bottom-full right-0 mb-1.5 rounded-xl overflow-hidden shadow-xl z-50"
                                        style={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border) / 0.5)', minWidth: '130px' }}
                                        onMouseLeave={() => setShowTypes(false)}
                                    >
                                        {POST_TYPES.map(t => (
                                            <button
                                                key={t.key}
                                                onClick={() => { setPostType(t.key); setShowTypes(false); }}
                                                className="w-full px-3 py-2 text-left text-[12px] font-semibold flex items-center gap-2.5 hover:bg-white/[0.04] transition-colors"
                                                style={{ color: postType === t.key ? t.color : 'hsl(var(--foreground))' }}
                                            >
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                                                {t.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Char counter */}
                        {content.length > 300 && (
                            <span className="text-[10.5px] font-medium num" style={{ color: charCount > 450 ? 'hsl(0 68% 55%)' : 'hsl(var(--muted-foreground))' }}>
                                {maxChars - charCount}
                            </span>
                        )}

                        {/* Publish button */}
                        <button
                            onClick={handleCreatePost}
                            disabled={!canPost || isPosting}
                            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-[12px] sm:text-[12.5px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: canPost ? '0 2px 12px hsl(var(--primary) / 0.3)' : 'none' }}
                        >
                            {isPosting ? (
                                <span className="flex items-center gap-1.5">
                                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="block">
                                        <Send className="w-3 h-3" />
                                    </motion.span>
                                    Publicando
                                </span>
                            ) : (
                                <>
                                    <Send className="w-3 h-3" />
                                    Publicar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Keyboard hint */}
            {isFocused && content && (
                <p className="text-[10px] px-1 mt-1.5" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                    ⌘ + Enter para publicar
                </p>
            )}
        </div>
    );
}

/* Toolbar button */
function ToolBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11.5px] font-medium transition-all"
            style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--primary))'; (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground) / 0.6)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
