import {
    useState,
    useEffect,
    useRef,
    useCallback,
    KeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
    Search,
    Send,
    Smile,
    Plus,
    Trash2,
    ArrowLeft,
    Check,
    CheckCheck,
    MessageSquare,
    X,
    ExternalLink,
    Loader2,
    BadgeCheck
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MsgUser {
    id: string;
    username: string;
    avatarUrl?: string;
    isVerified?: boolean;
    title?: string;
}

interface DirectMessage {
    id: string;
    conversationId: string;
    senderId: string;
    sender: MsgUser;
    content: string;
    isRead: boolean;
    createdAt: string;
}

interface ConversationItem {
    id: string;
    otherUser: MsgUser;
    lastMessage: DirectMessage | null;
    updatedAt: string;
    unreadCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = 'hsl(158 100% 45%)';
const SOCKET_URL =
    (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api', '') ||
    'http://localhost:3001';

const COMMON_EMOJIS = ['😊', '👍', '🚀', '📈', '📉', '💰', '🔥', '💡', '✅', '❌', '🤔', '💎', '⚡', '🎯', '📊'];

// ─── Avatar helper ────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 40, online = false }: { user: MsgUser; size?: number; online?: boolean }) {
    const initials = user.username?.[0]?.toUpperCase() || '?';
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="rounded-full object-cover w-full h-full" />
            ) : (
                <div
                    className="rounded-full flex items-center justify-center font-bold"
                    style={{
                        width: size, height: size,
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(158 100% 33%) 100%)`,
                        fontSize: size * 0.38,
                        color: '#060a07',
                    }}
                >
                    {initials}
                </div>
            )}
            {online && (
                <span
                    className="absolute bottom-0 right-0 rounded-full border-2 border-card"
                    style={{
                        width: size * 0.28, height: size * 0.28,
                        background: 'hsl(158 100% 40%)',
                        boxShadow: `0 0 6px hsl(158 100% 45% / 0.6)`,
                    }}
                />
            )}
        </div>
    );
}

// ─── New Message Modal ────────────────────────────────────────────────────────

function NewMessageModal({
    onClose,
    onSelect,
}: {
    onClose: () => void;
    onSelect: (userId: string) => void;
}) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<MsgUser[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        if (!q.trim()) { setResults([]); return; }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await apiFetch(`/messages/search-users?q=${encodeURIComponent(q)}`);
                if (res.ok) setResults(await res.json());
            } finally {
                setLoading(false);
            }
        }, 280);
        return () => clearTimeout(t);
    }, [q]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.93, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.93, y: 24 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="bg-card border border-border/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                    <h2 className="font-bold text-lg">Nuevo mensaje</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/50 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3">
                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5 focus-within:border-primary/40 transition-colors">
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Buscar usuario..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-72 overflow-y-auto pb-3">
                    {results.length === 0 && q.trim().length > 0 && !loading ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No se encontraron usuarios</p>
                    ) : results.length === 0 && !q.trim() ? (
                        <p className="text-xs text-muted-foreground text-center py-6">Comenzá a escribir para buscar</p>
                    ) : (
                        results.map((u) => (
                            <button key={u.id} onClick={() => onSelect(u.id)}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors"
                            >
                                <UserAvatar user={u} size={40} />
                                <div className="text-left">
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold text-sm">{u.username}</span>
                                        {u.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                                    </div>
                                    {u.title && <p className="text-xs text-muted-foreground">{u.title}</p>}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MessagesPage() {
    const { user, token } = useAuthStore();
    const { theme: appTheme } = usePreferencesStore();
    const isLight = appTheme === 'light' || (appTheme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // ── State ──────────────────────────────────────────────────────────────

    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [convSearch, setConvSearch] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showNewMsg, setShowNewMsg] = useState(false);
    const [isLoadingConvs, setIsLoadingConvs] = useState(true);
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showMobileList, setShowMobileList] = useState(true);
    const [, setShowConvMenu] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevConvRef = useRef<string | null>(null);

    const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

    // ── Theme-aware colors ─────────────────────────────────────────────────

    const bgPage = isLight ? 'hsl(0 0% 97%)' : '#0a0a0a';
    const bgSidebar = isLight ? 'hsl(0 0% 100%)' : 'linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)';
    const borderColor = isLight ? 'hsl(214 18% 88%)' : 'hsl(0 0% 100% / 0.07)';
    const textPrimary = isLight ? 'hsl(220 15% 10%)' : 'hsl(0 0% 97%)';
    const textMuted = isLight ? 'hsl(220 10% 48%)' : 'rgba(255,255,255,0.4)';
    const bubbleBg = isLight ? 'hsl(210 14% 93%)' : 'hsl(0 0% 100% / 0.07)';
    const bubbleText = isLight ? 'hsl(220 15% 12%)' : 'hsl(0 0% 92%)';
    const inputBg = isLight ? 'hsl(0 0% 98%)' : 'hsl(0 0% 100% / 0.04)';
    const inputBorder = isLight ? 'hsl(214 18% 86%)' : 'hsl(0 0% 100% / 0.08)';
    const hoverBg = isLight ? 'hsl(210 14% 96%)' : 'rgba(255,255,255,0.035)';
    const searchBg = isLight ? 'hsl(210 14% 94%)' : 'hsl(0 0% 100% / 0.05)';
    const searchBorder = isLight ? 'hsl(214 18% 86%)' : 'hsl(0 0% 100% / 0.08)';
    const chatHeaderBg = isLight
        ? 'hsl(0 0% 100%)'
        : 'linear-gradient(90deg, rgba(0,230,118,0.03) 0%, transparent 60%)';

    // ── Socket setup ───────────────────────────────────────────────────────

    useEffect(() => {
        if (!token) return;
        const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('userOnline', ({ userId }: { userId: string }) => setOnlineUsers((p) => new Set([...p, userId])));
        socket.on('userOffline', ({ userId }: { userId: string }) => setOnlineUsers((p) => { const n = new Set(p); n.delete(userId); return n; }));

        socket.on('newDirectMessage', (msg: DirectMessage) => {
            setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        });

        socket.on('conversationUpdated', ({ conversationId, lastMessage }: { conversationId: string; lastMessage: DirectMessage }) => {
            setConversations((prev) =>
                prev.map((c) => c.id === conversationId
                    ? { ...c, lastMessage, updatedAt: lastMessage.createdAt, unreadCount: lastMessage.senderId !== user?.id && activeConvId !== conversationId ? c.unreadCount + 1 : c.unreadCount }
                    : c
                ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
            );
        });

        socket.on('userTyping', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
            setTypingUsers((prev) => { const n = new Set(prev); isTyping ? n.add(userId) : n.delete(userId); return n; });
        });

        return () => { socket.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // ── Load conversations ─────────────────────────────────────────────────

    const loadConversations = useCallback(async () => {
        setIsLoadingConvs(true);
        try {
            const res = await apiFetch('/messages/conversations');
            if (res.ok) setConversations(await res.json());
        } finally { setIsLoadingConvs(false); }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // ── Open conversation from URL param ───────────────────────────────────

    useEffect(() => {
        const userId = searchParams.get('user');
        if (userId && !isLoadingConvs) handleStartConversation(userId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, isLoadingConvs]);

    // ── Load messages when active conversation changes ─────────────────────

    useEffect(() => {
        if (!activeConvId) return;
        if (prevConvRef.current && prevConvRef.current !== activeConvId)
            socketRef.current?.emit('leaveConversation', { conversationId: prevConvRef.current });
        socketRef.current?.emit('joinConversation', { conversationId: activeConvId });
        prevConvRef.current = activeConvId;

        (async () => {
            setIsLoadingMsgs(true);
            setMessages([]);
            try {
                const res = await apiFetch(`/messages/conversations/${activeConvId}/messages`);
                if (res.ok) setMessages(await res.json());
            } finally { setIsLoadingMsgs(false); }
            apiFetch(`/messages/conversations/${activeConvId}/read`, { method: 'POST' });
            setConversations((prev) => prev.map((c) => c.id === activeConvId ? { ...c, unreadCount: 0 } : c));
        })();
    }, [activeConvId]);

    // ── Auto-scroll ────────────────────────────────────────────────────────

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // ── Handlers ───────────────────────────────────────────────────────────

    const handleSelectConv = (convId: string) => {
        setActiveConvId(convId);
        setShowMobileList(false);
        setTypingUsers(new Set());
        setShowConvMenu(null);
    };

    const handleStartConversation = async (otherUserId: string) => {
        const existing = conversations.find((c) => c.otherUser.id === otherUserId);
        if (existing) { handleSelectConv(existing.id); setShowNewMsg(false); return; }
        try {
            const res = await apiFetch('/messages/conversations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: otherUserId }),
            });
            if (res.ok) {
                await loadConversations();
                const data = await res.clone().json();
                handleSelectConv(data.id);
            }
        } catch { /* noop */ }
        setShowNewMsg(false);
    };

    const handleSendMessage = async () => {
        const content = inputText.trim();
        if (!content || !activeConvId || isSending) return;
        setInputText('');
        setIsSending(true);

        if (socketRef.current?.connected) {
            socketRef.current.emit('sendDirectMessage', { conversationId: activeConvId, content });
            setIsSending(false);
        } else {
            try {
                const res = await apiFetch(`/messages/conversations/${activeConvId}/messages`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content }),
                });
                if (res.ok) {
                    const msg: DirectMessage = await res.json();
                    setMessages((p) => [...p, msg]);
                    setConversations((p) => p.map((c) => c.id === activeConvId ? { ...c, lastMessage: msg, updatedAt: msg.createdAt } : c).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
                }
            } finally { setIsSending(false); }
        }

        socketRef.current?.emit('typing', { conversationId: activeConvId, isTyping: false });
    };

    const handleInputChange = (val: string) => {
        setInputText(val);
        if (!activeConvId) return;
        socketRef.current?.emit('typing', { conversationId: activeConvId, isTyping: val.length > 0 });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit('typing', { conversationId: activeConvId, isTyping: false });
        }, 2000);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    };

    const handleDeleteConv = async (convId: string) => {
        if (!confirm('¿Eliminar esta conversación? No se puede deshacer.')) return;
        await apiFetch(`/messages/conversations/${convId}`, { method: 'DELETE' });
        setConversations((p) => p.filter((c) => c.id !== convId));
        if (activeConvId === convId) { setActiveConvId(null); setMessages([]); setShowMobileList(true); }
    };

    // ── Helpers ────────────────────────────────────────────────────────────

    const filteredConvs = convSearch.trim()
        ? conversations.filter((c) => c.otherUser.username.toLowerCase().includes(convSearch.toLowerCase()))
        : conversations;

    const formatTime = (iso: string) => {
        const d = new Date(iso), diffH = (Date.now() - d.getTime()) / 36e5;
        if (diffH < 24) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        if (diffH < 168) return d.toLocaleDateString('es-AR', { weekday: 'short' });
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    const formatMsgTime = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* New message modal */}
            <AnimatePresence>
                {showNewMsg && (
                    <NewMessageModal onClose={() => setShowNewMsg(false)} onSelect={handleStartConversation} />
                )}
            </AnimatePresence>

            <div className="flex flex-1 h-full overflow-hidden" style={{ background: bgPage }}>

                {/* ══ LEFT COLUMN – Conversation list ══════════════════════════════ */}
                <AnimatePresence initial={false}>
                    {(showMobileList || !activeConvId) && (
                        <motion.aside
                            key="conv-list"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="flex flex-col w-full lg:w-[340px] flex-shrink-0 h-full"
                            style={{
                                borderRight: `1px solid ${borderColor}`,
                                background: bgSidebar,
                                boxShadow: isLight ? '2px 0 12px hsl(220 15% 10% / 0.04)' : 'none',
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
                                <div>
                                    <h1 className="text-lg font-black tracking-tight" style={{ color: textPrimary }}>Mensajes</h1>
                                    <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'hsl(158 100% 40% / 0.7)' }}>Red Finix</p>
                                </div>
                                <button
                                    onClick={() => setShowNewMsg(true)}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                    style={{ background: `linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 33%) 100%)`, boxShadow: `0 4px 16px hsl(158 100% 45% / 0.35)` }}
                                    title="Nuevo mensaje"
                                >
                                    <Plus className="w-4 h-4 text-black" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="px-4 py-3">
                                <div className="flex items-center gap-2 px-3 rounded-xl" style={{ background: searchBg, border: `1px solid ${searchBorder}` }}>
                                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Buscar conversaciones..."
                                        value={convSearch}
                                        onChange={(e) => setConvSearch(e.target.value)}
                                        className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                                        style={{ color: textPrimary }}
                                    />
                                    {convSearch && <button onClick={() => setConvSearch('')}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto">
                                {isLoadingConvs ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredConvs.length === 0 ? (
                                    <div className="text-center py-16 px-6 space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                                            style={{ background: 'hsl(158 100% 45% / 0.08)', border: '1px solid hsl(158 100% 45% / 0.15)' }}>
                                            <MessageSquare className="w-7 h-7" style={{ color: 'hsl(158 100% 45%)' }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                                                {convSearch ? 'Sin resultados' : 'Sin conversaciones aún'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {convSearch ? 'Intentá con otro nombre' : 'Conectate con otros inversores'}
                                            </p>
                                        </div>
                                        {!convSearch && (
                                            <button
                                                onClick={() => setShowNewMsg(true)}
                                                className="text-sm font-bold px-4 py-2 rounded-xl transition-all hover:scale-105"
                                                style={{ background: 'hsl(158 100% 45% / 0.1)', color: 'hsl(158 100% 45%)' }}
                                            >
                                                + Empezar conversación
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <ul className="py-1">
                                        {filteredConvs.map((conv) => {
                                            const isActive = conv.id === activeConvId;
                                            const isOnline = onlineUsers.has(conv.otherUser.id);
                                            return (
                                                <motion.li key={conv.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <div className="relative group">
                                                        <button
                                                            onClick={() => handleSelectConv(conv.id)}
                                                            className="w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left"
                                                            style={{
                                                                background: isActive ? 'hsl(158 100% 45% / 0.07)' : 'transparent',
                                                                borderLeft: isActive ? '3px solid hsl(158 100% 45%)' : '3px solid transparent',
                                                            }}
                                                            onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = hoverBg; }}
                                                            onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                                        >
                                                            <UserAvatar user={conv.otherUser} size={46} online={isOnline} />

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <span className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                                                                        {conv.otherUser.username}
                                                                        {conv.otherUser.isVerified && (
                                                                            <span className="ml-1 text-[10px]" style={{ color: 'hsl(158 100% 45%)' }}>✓</span>
                                                                        )}
                                                                    </span>
                                                                    <span className="text-[11px] text-muted-foreground ml-2 flex-shrink-0 font-medium">
                                                                        {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                                                        {conv.lastMessage
                                                                            ? `${conv.lastMessage.senderId === user?.id ? 'Tú: ' : ''}${conv.lastMessage.content}`
                                                                            : 'Iniciar conversación'}
                                                                    </p>
                                                                    {conv.unreadCount > 0 && (
                                                                        <span className="flex-shrink-0 ml-1 min-w-[20px] h-5 rounded-full text-[11px] font-bold flex items-center justify-center text-black px-1"
                                                                            style={{ background: 'hsl(158 100% 45%)' }}>
                                                                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {/* Hover actions */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteConv(conv.id); }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10"
                                                            title="Eliminar chat"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                        </button>
                                                    </div>
                                                </motion.li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ══ RIGHT COLUMN – Active chat ════════════════════════════════ */}
                <div className="flex-1 flex flex-col h-full min-w-0" style={{ background: bgPage }}>
                    {!activeConvId ? (
                        /* ── Empty state ── */
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 select-none px-8">
                            {/* Animated icon */}
                            <div className="relative">
                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-lg"
                                    style={{
                                        background: 'linear-gradient(135deg, hsl(158 100% 45% / 0.12) 0%, hsl(158 100% 45% / 0.04) 100%)',
                                        border: '1px solid hsl(158 100% 45% / 0.2)',
                                        boxShadow: '0 8px 32px hsl(158 100% 45% / 0.12)',
                                    }}
                                >
                                    <MessageSquare className="w-12 h-12" style={{ color: 'hsl(158 100% 45%)' }} />
                                </motion.div>
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-black font-bold"
                                    style={{ background: 'hsl(158 100% 45%)', boxShadow: '0 0 16px hsl(158 100% 45% / 0.5)' }}
                                >
                                    <Plus className="w-4 h-4" />
                                </motion.div>
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black" style={{ color: textPrimary }}>Tus mensajes</h2>
                                <p className="text-sm leading-relaxed max-w-xs" style={{ color: textMuted }}>
                                    Conectate con otros inversores de la red Finix y compartí ideas de mercado en privado
                                </p>
                            </div>

                            <button
                                onClick={() => setShowNewMsg(true)}
                                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold text-black transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 33%) 100%)',
                                    boxShadow: '0 6px 24px hsl(158 100% 45% / 0.4)',
                                }}
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo mensaje
                            </button>

                            {/* Recent conversations hint */}
                            {conversations.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Seleccioná una conversación a la izquierda</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* ── Chat header ── */}
                            <div
                                className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
                                style={{ borderBottom: `1px solid ${borderColor}`, background: chatHeaderBg }}
                            >
                                {/* Mobile back */}
                                <button
                                    onClick={() => { setShowMobileList(true); setActiveConvId(null); }}
                                    className="lg:hidden p-2 rounded-xl transition-all hover:bg-secondary/50"
                                >
                                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                                </button>

                                {activeConv && (
                                    <>
                                        <Link to={`/profile/${activeConv.otherUser.username}`}>
                                            <UserAvatar user={activeConv.otherUser} size={44} online={onlineUsers.has(activeConv.otherUser.id)} />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <Link to={`/profile/${activeConv.otherUser.username}`}
                                                    className="font-bold hover:text-primary transition-colors truncate text-sm"
                                                    style={{ color: textPrimary }}>
                                                    {activeConv.otherUser.username}
                                                </Link>
                                                {activeConv.otherUser.isVerified && (
                                                    <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs flex items-center gap-1.5" style={{ color: textMuted }}>
                                                {typingUsers.size > 0 ? (
                                                    <motion.span
                                                        animate={{ opacity: [1, 0.5, 1] }}
                                                        transition={{ duration: 1.2, repeat: Infinity }}
                                                        className="font-medium" style={{ color: 'hsl(158 100% 40%)' }}>
                                                        escribiendo...
                                                    </motion.span>
                                                ) : onlineUsers.has(activeConv.otherUser.id) ? (
                                                    <>
                                                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(158 100% 42%)', boxShadow: '0 0 4px hsl(158 100% 45%)' }} />
                                                        En línea
                                                    </>
                                                ) : 'Desconectado'}
                                            </p>
                                        </div>

                                        {/* Header actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => navigate(`/profile/${activeConv.otherUser.username}`)}
                                                className="p-2 rounded-xl transition-all hover:bg-secondary/50"
                                                title="Ver perfil"
                                            >
                                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteConv(activeConvId)}
                                                className="p-2 rounded-xl transition-all hover:bg-red-500/10"
                                                title="Eliminar conversación"
                                            >
                                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-400 transition-colors" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ── Messages area ── */}
                            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1">
                                {isLoadingMsgs ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                            style={{ background: 'hsl(158 100% 45% / 0.07)', border: '1px solid hsl(158 100% 45% / 0.12)' }}>
                                            <MessageSquare className="w-6 h-6" style={{ color: 'hsl(158 100% 45%)' }} />
                                        </div>
                                        <p className="text-sm font-medium" style={{ color: textMuted }}>
                                            Iniciá la conversación 👋
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg, i) => {
                                            const isMe = msg.senderId === user?.id;
                                            const prevMsg = messages[i - 1];
                                            const nextMsg = messages[i + 1];
                                            const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
                                            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                                            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

                                            // Date separator
                                            const msgDate = new Date(msg.createdAt).toDateString();
                                            const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
                                            const showDate = !prevDate || msgDate !== prevDate;

                                            return (
                                                <div key={msg.id}>
                                                    {/* Date separator */}
                                                    {showDate && (
                                                        <div className="flex items-center gap-3 my-4">
                                                            <div className="flex-1 h-px" style={{ background: borderColor }} />
                                                            <span className="text-[11px] font-semibold px-2 rounded-full" style={{ color: textMuted, background: isLight ? 'hsl(210 14% 94%)' : 'hsl(0 0% 100% / 0.05)' }}>
                                                                {new Date(msg.createdAt).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                            </span>
                                                            <div className="flex-1 h-px" style={{ background: borderColor }} />
                                                        </div>
                                                    )}

                                                    <motion.div
                                                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        transition={{ duration: 0.18 }}
                                                        className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
                                                    >
                                                        {/* Other user avatar */}
                                                        {!isMe && (
                                                            <div className="w-7 flex-shrink-0">
                                                                {showAvatar && activeConv && (
                                                                    <UserAvatar user={activeConv.otherUser} size={28} />
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className={`flex flex-col max-w-[68%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                            <div
                                                                className="px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap"
                                                                style={{
                                                                    borderRadius: isMe
                                                                        ? isFirstInGroup ? '18px 4px 18px 18px' : '18px 4px 4px 18px'
                                                                        : isFirstInGroup ? '4px 18px 18px 18px' : '4px 18px 18px 4px',
                                                                    background: isMe
                                                                        ? 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 33%) 100%)'
                                                                        : bubbleBg,
                                                                    color: isMe ? '#030d06' : bubbleText,
                                                                    fontWeight: isMe ? 500 : 400,
                                                                    boxShadow: isMe ? '0 2px 8px hsl(158 100% 45% / 0.25)' : 'none',
                                                                }}
                                                            >
                                                                {msg.content}
                                                            </div>

                                                            {/* Time + read status */}
                                                            {isLastInGroup && (
                                                                <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                                    <span className="text-[11px] text-muted-foreground">{formatMsgTime(msg.createdAt)}</span>
                                                                    {isMe && (
                                                                        msg.isRead
                                                                            ? <CheckCheck className="w-3 h-3" style={{ color: 'hsl(158 100% 45%)' }} />
                                                                            : <Check className="w-3 h-3 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            );
                                        })}

                                        {/* Typing indicator */}
                                        <AnimatePresence>
                                            {typingUsers.size > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 6 }}
                                                    className="flex items-end gap-2 mt-2"
                                                >
                                                    {activeConv && <UserAvatar user={activeConv.otherUser} size={28} />}
                                                    <div className="flex items-center gap-1 px-4 py-3 rounded-[4px_18px_18px_18px]"
                                                        style={{ background: bubbleBg }}>
                                                        {[0, 1, 2].map((i) => (
                                                            <motion.span key={i} className="w-1.5 h-1.5 rounded-full"
                                                                style={{ background: textMuted }}
                                                                animate={{ y: [0, -4, 0] }}
                                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                            />
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* ── Message input ── */}
                            <div
                                className="flex-shrink-0 px-4 py-4"
                                style={{ borderTop: `1px solid ${borderColor}`, background: chatHeaderBg }}
                            >
                                <div
                                    className="flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-all"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${inputText.trim() ? 'hsl(158 100% 45% / 0.4)' : inputBorder}`,
                                        boxShadow: inputText.trim() ? '0 0 0 3px hsl(158 100% 45% / 0.08)' : 'none',
                                    }}
                                >
                                    {/* Emoji button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowEmojiPicker((p) => !p)}
                                            className="p-1.5 rounded-xl transition-all flex-shrink-0 mb-0.5"
                                            style={{ color: showEmojiPicker ? 'hsl(158 100% 45%)' : textMuted, background: showEmojiPicker ? 'hsl(158 100% 45% / 0.1)' : 'transparent' }}
                                            title="Emojis"
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>

                                        {/* Emoji picker */}
                                        <AnimatePresence>
                                            {showEmojiPicker && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute bottom-full left-0 mb-2 p-2 rounded-2xl border shadow-xl z-20"
                                                    style={{ background: isLight ? 'hsl(0 0% 100%)' : '#1a1a1a', borderColor }}
                                                    onMouseLeave={() => setShowEmojiPicker(false)}
                                                >
                                                    <div className="grid grid-cols-5 gap-1">
                                                        {COMMON_EMOJIS.map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => { setInputText((t) => t + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }}
                                                                className="w-9 h-9 rounded-lg text-lg flex items-center justify-center hover:bg-secondary/50 transition-colors"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Text input */}
                                    <textarea
                                        ref={inputRef}
                                        value={inputText}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Escribí un mensaje..."
                                        rows={1}
                                        className="flex-1 bg-transparent text-sm resize-none outline-none py-1.5 max-h-32 leading-relaxed placeholder:text-muted-foreground"
                                        style={{
                                            color: textPrimary,
                                            scrollbarWidth: 'none',
                                        }}
                                        onInput={(e) => {
                                            const el = e.currentTarget;
                                            el.style.height = 'auto';
                                            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                                        }}
                                    />

                                    {/* Send button */}
                                    <motion.button
                                        onClick={handleSendMessage}
                                        disabled={!inputText.trim() || isSending}
                                        whileHover={inputText.trim() ? { scale: 1.08 } : {}}
                                        whileTap={inputText.trim() ? { scale: 0.92 } : {}}
                                        className="p-2 rounded-xl flex-shrink-0 mb-0.5 transition-all"
                                        style={{
                                            background: inputText.trim()
                                                ? 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 33%) 100%)'
                                                : 'transparent',
                                            color: inputText.trim() ? '#060a07' : textMuted,
                                            boxShadow: inputText.trim() ? '0 2px 10px hsl(158 100% 45% / 0.35)' : 'none',
                                            cursor: inputText.trim() ? 'pointer' : 'default',
                                        }}
                                    >
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </motion.button>
                                </div>

                                <p className="text-center text-[10px] text-muted-foreground mt-2 opacity-60">
                                    Enter para enviar · Shift+Enter nueva línea
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
