import {
    useState,
    useEffect,
    useRef,
    useCallback,
    KeyboardEvent,
    ChangeEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
    BarChart2,
    Search,
    Send,
    Smile,
    Plus,
    ArrowLeft,
    Check,
    CheckCheck,
    MessageSquare,
    X,
    ExternalLink,
    Loader2,
    BadgeCheck,
    Image as ImageIcon,
    Newspaper,
    MoreHorizontal,
    Sparkles,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import ChartAttachmentModal from '@/components/messages/ChartAttachmentModal';
import PostPickerModal from '@/components/messages/PostPickerModal';
import { uploadChatFile } from '@/components/messages/mediaUpload';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
    ComposerAttachment,
    MessageAttachmentMeta,
    MessageAttachmentType,
    SharedPostPreview,
    SharedStoryPreview,
} from '@/components/messages/messageTypes';
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
    attachmentType?: MessageAttachmentType | null;
    attachmentUrl?: string | null;
    attachmentMeta?: MessageAttachmentMeta | null;
    sharedPost?: SharedPostPreview | null;
    isRead: boolean;
    createdAt: string;
}

interface ConversationItem {
    id: string;
    isGroup: boolean;
    title: string;
    otherUser: MsgUser | null;
    participants: MsgUser[];
    participantCount: number;
    lastMessage: DirectMessage | null;
    updatedAt: string;
    unreadCount: number;
}

interface NewConversationSelection {
    userIds: string[];
    title?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = 'hsl(158 100% 45%)';
const SOCKET_URL = (() => {
    const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;

    if (!configuredApiUrl || configuredApiUrl === '/api') {
        return typeof window !== 'undefined' ? window.location.origin : '';
    }

    if (/^https?:\/\//i.test(configuredApiUrl)) {
        return configuredApiUrl.replace(/\/api\/?$/, '');
    }

    return typeof window !== 'undefined'
        ? window.location.origin
        : configuredApiUrl.replace(/\/api\/?$/, '');
})();

const EMOJI_FONT_STACK = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif';
const EMOJI_GROUPS = [
    { label: 'Frecuentes', items: ['😊', '👍', '🔥', '🤔', '✅', '💡'] },
    { label: 'Mercado', items: ['🚀', '📈', '📉', '💰', '💎', '⚡', '🎯', '📊', '❌'] },
] as const;
const CHART_INTERVAL_LABELS: Record<string, string> = {
    '15': '15m',
    '60': '1H',
    '240': '4H',
    D: '1D',
    W: '1S',
};

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

function getConversationMembers(conversation: ConversationItem, currentUserId?: string) {
    return conversation.participants.filter((participant) => participant.id !== currentUserId);
}

function ConversationAvatar({
    conversation,
    currentUserId,
    size = 40,
    onlineUsers,
}: {
    conversation: ConversationItem;
    currentUserId?: string;
    size?: number;
    onlineUsers: Set<string>;
}) {
    if (!conversation.isGroup && conversation.otherUser) {
        return (
            <UserAvatar
                user={conversation.otherUser}
                size={size}
                online={onlineUsers.has(conversation.otherUser.id)}
            />
        );
    }

    const members = getConversationMembers(conversation, currentUserId).slice(0, 3);
    const tileSize = size < 44 ? Math.max(16, Math.floor(size * 0.48)) : Math.floor(size * 0.54);

    return (
        <div
            className="relative flex-shrink-0 rounded-full overflow-hidden border"
            style={{
                width: size,
                height: size,
                borderColor: 'hsl(158 100% 45% / 0.18)',
                background: 'linear-gradient(135deg, hsl(210 25% 96%) 0%, hsl(158 45% 92%) 100%)',
            }}
        >
            <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[2px] p-[2px]">
                {Array.from({ length: 4 }).map((_, index) => {
                    const member = members[index];
                    const initials = member?.username?.[0]?.toUpperCase() || '+';

                    return member?.avatarUrl ? (
                        <img
                            key={`${conversation.id}-${member.id}`}
                            src={member.avatarUrl}
                            alt={member.username}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <div
                            key={`${conversation.id}-slot-${index}`}
                            className="flex h-full w-full items-center justify-center rounded-full font-bold"
                            style={{
                                background: member
                                    ? 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 33%) 100%)'
                                    : 'hsl(210 16% 90%)',
                                color: member ? '#041008' : 'hsl(220 10% 42%)',
                                fontSize: Math.max(10, tileSize * 0.42),
                            }}
                        >
                            {initials}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getChartIntervalLabel(value?: string) {
    if (!value) return '1D';
    return CHART_INTERVAL_LABELS[value] || value;
}

function getPostTypeLabel(type?: SharedPostPreview['type']) {
    switch (type) {
        case 'chart':
            return 'Grafico';
        case 'image':
            return 'Imagen';
        case 'reel':
            return 'Edicion';
        default:
            return 'Publicacion';
    }
}

function getMessagePreview(message: DirectMessage | null) {
    if (!message) return 'Iniciar conversación';

    const text = message.content?.trim();
    if (message.attachmentType === 'image') {
        return text ? `Foto: ${text}` : 'Foto';
    }
    if (message.attachmentType === 'post') {
        return text ? `Publicacion: ${text}` : 'Publicacion compartida';
    }
    if (message.attachmentType === 'chart') {
        return text ? `Grafico: ${text}` : 'Grafico compartido';
    }
    if (message.attachmentType === 'story') {
        return text ? `Historia: ${text}` : 'Historia compartida';
    }

    return text || 'Mensaje';
}

function getConversationName(conversation: ConversationItem) {
    if (!conversation.isGroup) {
        return conversation.otherUser?.username || conversation.title || 'Conversación';
    }

    return conversation.title || 'Grupo';
}

function getConversationSecondaryText(conversation: ConversationItem, currentUserId?: string) {
    if (!conversation.isGroup) {
        return conversation.otherUser?.title || 'Chat directo';
    }

    const members = getConversationMembers(conversation, currentUserId).map((participant) => participant.username);
    if (members.length === 0) {
        return 'Solo vos';
    }

    const preview = members.slice(0, 3).join(', ');
    const extra = members.length > 3 ? ` +${members.length - 3}` : '';
    return `${conversation.participantCount} participantes · ${preview}${extra}`;
}

function sortConversations(items: ConversationItem[]) {
    return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function upsertConversation(items: ConversationItem[], conversation: ConversationItem) {
    return sortConversations([conversation, ...items.filter((item) => item.id !== conversation.id)]);
}

function applyConversationMessageUpdate(
    items: ConversationItem[],
    conversationId: string,
    lastMessage: DirectMessage,
    currentUserId?: string,
    activeConversationId?: string | null,
) {
    const existingConversation = items.find((item) => item.id === conversationId);
    const unreadCount = lastMessage.senderId !== currentUserId && activeConversationId !== conversationId
        ? (existingConversation?.unreadCount ?? 0) + 1
        : 0;

    if (existingConversation) {
        return upsertConversation(items, {
            ...existingConversation,
            lastMessage,
            updatedAt: lastMessage.createdAt,
            unreadCount,
        });
    }

    return items;
}

function SharedPostCard({
    post,
    borderColor,
    isLight,
    textPrimary,
    textMuted,
}: {
    post: SharedPostPreview;
    borderColor: string;
    isLight: boolean;
    textPrimary: string;
    textMuted: string;
}) {
    const firstMedia = post.media?.[0];

    return (
        <div
            className="rounded-2xl overflow-hidden border"
            style={{
                borderColor,
                background: isLight ? 'hsl(0 0% 100%)' : 'hsl(0 0% 100% / 0.04)',
            }}
        >
            <div className="p-3 space-y-3">
                <div className="flex items-center gap-2.5">
                    {post.author.avatarUrl ? (
                        <img
                            src={post.author.avatarUrl}
                            alt={post.author.username}
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-primary text-black font-bold flex items-center justify-center">
                            {post.author.username[0]?.toUpperCase() || '?'}
                        </div>
                    )}

                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                                {post.author.username}
                            </span>
                            {post.author.isVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: textMuted }}>
                            <span>{getPostTypeLabel(post.type)}</span>
                            {post.type === 'chart' && post.assetSymbol && <span className="font-mono">{post.assetSymbol}</span>}
                        </div>
                    </div>
                </div>

                {post.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: textPrimary }}>
                        {post.content}
                    </p>
                )}

                {firstMedia?.url && (
                    <div className="rounded-2xl overflow-hidden border" style={{ borderColor }}>
                        <img
                            src={firstMedia.url}
                            alt="Publicacion compartida"
                            className="w-full max-h-80 object-cover"
                            loading="lazy"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function SharedStoryCard({
    story,
    borderColor,
    isLight,
    textPrimary,
    textMuted,
}: {
    story: SharedStoryPreview;
    borderColor: string;
    isLight: boolean;
    textPrimary: string;
    textMuted: string;
}) {
    const background = story.background || 'linear-gradient(135deg, #0f172a 0%, #111827 45%, #10b981 100%)';

    return (
        <div
            className="rounded-2xl overflow-hidden border"
            style={{
                borderColor,
                background: isLight ? 'hsl(0 0% 100%)' : 'hsl(0 0% 100% / 0.04)',
            }}
        >
            <div className="p-3 space-y-3">
                <div className="flex items-center gap-2.5">
                    {story.author.avatarUrl ? (
                        <img
                            src={story.author.avatarUrl}
                            alt={story.author.username}
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-primary text-black font-bold flex items-center justify-center">
                            {story.author.username[0]?.toUpperCase() || '?'}
                        </div>
                    )}

                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                                {story.author.username}
                            </span>
                            {story.author.isVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: textMuted }}>
                            <span>Historia</span>
                        </div>
                    </div>
                </div>

                {story.mediaUrl ? (
                    <div className="rounded-2xl overflow-hidden border" style={{ borderColor }}>
                        <img
                            src={story.mediaUrl}
                            alt={`Historia de ${story.author.username}`}
                            className="w-full max-h-80 object-cover"
                            loading="lazy"
                        />
                    </div>
                ) : (
                    <div
                        className="flex min-h-[200px] items-center justify-center rounded-2xl px-5 py-6 text-center"
                        style={{ background }}
                    >
                        <p
                            className="whitespace-pre-wrap break-words text-lg font-semibold leading-tight"
                            style={{ color: story.textColor || '#ffffff' }}
                        >
                            {story.content || 'Historia compartida'}
                        </p>
                    </div>
                )}

                {story.mediaUrl && story.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: textPrimary }}>
                        {story.content}
                    </p>
                )}

                <Link
                    to={`/profile/${story.author.username}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary"
                >
                    Ver perfil
                    <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}

function MessageAttachmentCard({
    message,
    isLight,
    borderColor,
    textPrimary,
    textMuted,
}: {
    message: DirectMessage;
    isLight: boolean;
    borderColor: string;
    textPrimary: string;
    textMuted: string;
}) {
    if (message.attachmentType === 'image' && message.attachmentUrl) {
        return (
            <div className="space-y-2">
                <img
                    src={message.attachmentUrl}
                    alt="Foto enviada"
                    className="w-full max-w-[320px] max-h-[300px] object-cover rounded-2xl"
                    loading="lazy"
                />
                {message.attachmentMeta?.originalName && (
                    <p className="text-[11px]" style={{ color: textMuted }}>
                        {String(message.attachmentMeta.originalName)}
                    </p>
                )}
            </div>
        );
    }

    if (message.attachmentType === 'post' && message.sharedPost) {
        return (
            <div className="w-full max-w-[360px]">
                <SharedPostCard
                    post={message.sharedPost}
                    borderColor={borderColor}
                    isLight={isLight}
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                />
            </div>
        );
    }

    if (message.attachmentType === 'chart' && message.attachmentUrl) {
        const symbol = typeof message.attachmentMeta?.symbol === 'string' ? message.attachmentMeta.symbol : 'ACTIVO';
        const interval = typeof message.attachmentMeta?.interval === 'string' ? message.attachmentMeta.interval : 'D';
        const analysisType = typeof message.attachmentMeta?.analysisType === 'string' ? message.attachmentMeta.analysisType : '';
        const riskLevel = typeof message.attachmentMeta?.riskLevel === 'string' ? message.attachmentMeta.riskLevel : '';

        return (
            <div
                className="w-full max-w-[360px] rounded-2xl overflow-hidden border"
                style={{
                    borderColor,
                    background: isLight ? 'hsl(0 0% 100%)' : 'hsl(0 0% 100% / 0.04)',
                }}
            >
                <img
                    src={message.attachmentUrl}
                    alt={`Grafico ${symbol}`}
                    className="w-full max-h-80 object-cover"
                    loading="lazy"
                />
                <div className="p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary">
                            {symbol}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: isLight ? 'hsl(210 14% 94%)' : 'hsl(0 0% 100% / 0.05)', color: textPrimary }}>
                            {getChartIntervalLabel(interval)}
                        </span>
                        {analysisType && (
                            <span className="text-[11px]" style={{ color: textMuted }}>
                                {analysisType}
                            </span>
                        )}
                        {riskLevel && (
                            <span className="text-[11px]" style={{ color: textMuted }}>
                                Riesgo {riskLevel}
                            </span>
                        )}
                    </div>
                    <Link
                        to={`/market?symbol=${encodeURIComponent(symbol)}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary"
                    >
                        Abrir grafico
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        );
    }

    if (message.attachmentType === 'story') {
        const story = message.attachmentMeta?.story as SharedStoryPreview | null | undefined;
        if (!story) return null;

        return (
            <div className="w-full max-w-[360px]">
                <SharedStoryCard
                    story={story}
                    borderColor={borderColor}
                    isLight={isLight}
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                />
            </div>
        );
    }

    return null;
}

// ─── New Message Modal ────────────────────────────────────────────────────────

function NewMessageModal({
    onClose,
    onSelect,
}: {
    onClose: () => void;
    onSelect: (selection: NewConversationSelection) => void;
}) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<MsgUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<MsgUser[]>([]);
    const [groupTitle, setGroupTitle] = useState('');
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

    const selectedIds = new Set(selectedUsers.map((user) => user.id));
    const isGroup = selectedUsers.length > 1 || groupTitle.trim().length > 0;

    const toggleUser = (user: MsgUser) => {
        setSelectedUsers((current) => {
            const exists = current.some((item) => item.id === user.id);
            if (exists) {
                return current.filter((item) => item.id !== user.id);
            }

            return [...current, user];
        });
    };

    const handleSubmit = () => {
        if (selectedUsers.length === 0) return;
        onSelect({
            userIds: selectedUsers.map((user) => user.id),
            title: groupTitle.trim() || undefined,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.93, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.93, y: 24 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="bg-card border border-border/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                    <div>
                        <h2 className="font-bold text-lg">Nuevo mensaje o grupo</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Seleccioná una o varias personas</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/50 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {selectedUsers.length > 0 && (
                    <div className="px-5 pt-4 space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map((selectedUser) => (
                                <button
                                    key={selectedUser.id}
                                    type="button"
                                    onClick={() => toggleUser(selectedUser)}
                                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                                >
                                    <span>{selectedUser.username}</span>
                                    <X className="w-3 h-3" />
                                </button>
                            ))}
                        </div>

                        {selectedUsers.length > 1 && (
                            <div className="space-y-1.5">
                                <label htmlFor="group-title" className="text-xs font-semibold text-muted-foreground">Nombre del grupo</label>
                                <input
                                    id="group-title"
                                    type="text"
                                    placeholder="Ej: Equipo Finix"
                                    value={groupTitle}
                                    onChange={(e) => setGroupTitle(e.target.value)}
                                    className="w-full rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40"
                                />
                            </div>
                        )}
                    </div>
                )}

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
                        <p className="text-xs text-muted-foreground text-center py-6">Comenzá a escribir para buscar contactos</p>
                    ) : (
                        results.map((u) => (
                            <button
                                key={u.id}
                                onClick={() => toggleUser(u)}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors"
                            >
                                <UserAvatar user={u} size={40} />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold text-sm">{u.username}</span>
                                        {u.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                                    </div>
                                    {u.title && <p className="text-xs text-muted-foreground">{u.title}</p>}
                                </div>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    selectedIds.has(u.id)
                                        ? 'border-primary bg-primary text-black'
                                        : 'border-border/60 text-transparent'
                                }`}>
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="border-t border-border/40 px-5 py-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={selectedUsers.length === 0}
                        className="w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 33%) 100%)',
                            color: '#041008',
                            boxShadow: '0 8px 24px hsl(158 100% 45% / 0.22)',
                        }}
                    >
                        {isGroup ? 'Crear grupo' : 'Abrir chat'}
                    </button>
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
    const location = useLocation();
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
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showPostPicker, setShowPostPicker] = useState(false);
    const [showChartPicker, setShowChartPicker] = useState(false);
    const [pendingAttachment, setPendingAttachment] = useState<ComposerAttachment | null>(null);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const [composerError, setComposerError] = useState('');
    const [showNewMsg, setShowNewMsg] = useState(false);
    const [isLoadingConvs, setIsLoadingConvs] = useState(true);
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showMobileList, setShowMobileList] = useState(true);

    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevConvRef = useRef<string | null>(null);
    const activeConvIdRef = useRef<string | null>(null);
    const conversationsRef = useRef<ConversationItem[]>([]);
    const pendingAttachmentRef = useRef<ComposerAttachment | null>(null);

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

    useEffect(() => {
        activeConvIdRef.current = activeConvId;
    }, [activeConvId]);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        pendingAttachmentRef.current = pendingAttachment;
    }, [pendingAttachment]);

    useEffect(() => {
        if (!inputText && inputRef.current) {
            inputRef.current.style.height = 'auto';
        }
    }, [inputText]);

    // ── Load conversations ─────────────────────────────────────────────────

    const loadConversations = useCallback(async () => {
        setIsLoadingConvs(true);
        try {
            const res = await apiFetch('/messages/conversations');
            if (res.ok) setConversations(await res.json());
        } finally { setIsLoadingConvs(false); }
    }, []);

    // ── Socket setup ───────────────────────────────────────────────────────

    useEffect(() => {
        if (!token) return;
        const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('userOnline', ({ userId }: { userId: string }) => setOnlineUsers((p) => new Set([...p, userId])));
        socket.on('userOffline', ({ userId }: { userId: string }) => setOnlineUsers((p) => { const n = new Set(p); n.delete(userId); return n; }));

        socket.on('newDirectMessage', (msg: DirectMessage) => {
            if (activeConvIdRef.current !== msg.conversationId) {
                return;
            }

            setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        });

        socket.on('conversationCreated', () => {
            void loadConversations();
        });

        socket.on('conversationUpdated', ({ conversationId, lastMessage }: { conversationId: string; lastMessage: DirectMessage }) => {
            const exists = conversationsRef.current.some((conversation) => conversation.id === conversationId);
            if (!exists) {
                void loadConversations();
                return;
            }

            setConversations((prev) => {
                return applyConversationMessageUpdate(
                    prev,
                    conversationId,
                    lastMessage,
                    user?.id,
                    activeConvIdRef.current,
                );
            });
        });

        socket.on('userTyping', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
            setTypingUsers((prev) => { const n = new Set(prev); isTyping ? n.add(userId) : n.delete(userId); return n; });
        });

        return () => { socket.disconnect(); };
    }, [token, user?.id, loadConversations]);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // ── Open conversation from URL param ───────────────────────────────────

    // ── Handlers ───────────────────────────────────────────────────────────

    const resetComposer = useCallback(() => {
        setInputText('');
        setPendingAttachment(null);
        setShowAttachMenu(false);
        setShowEmojiPicker(false);
        setComposerError('');
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }
    }, []);

    const handleReturnToInbox = useCallback(() => {
        setActiveConvId(null);
        setMessages([]);
        setShowMobileList(true);
        setTypingUsers(new Set());
        setShowPostPicker(false);
        setShowChartPicker(false);
        resetComposer();
    }, [resetComposer]);

    const handleSelectConv = useCallback((convId: string) => {
        const currentAttachment = pendingAttachmentRef.current;
        const shouldPreserveAttachment = Boolean(currentAttachment && !activeConvIdRef.current);

        setActiveConvId(convId);
        setMessages([]);
        setShowMobileList(false);
        setTypingUsers(new Set());
        setShowPostPicker(false);
        setShowChartPicker(false);
        resetComposer();

        if (shouldPreserveAttachment && currentAttachment) {
            setPendingAttachment(currentAttachment);
        }
    }, [resetComposer]);

    const handleStartConversation = useCallback(async (
        selection: string | NewConversationSelection,
        clearUserSearchParam = false,
    ) => {
        // Close modal immediately so the user sees instant feedback
        setShowNewMsg(false);

        const currentAttachment = pendingAttachmentRef.current;
        const selectedUserIds = typeof selection === 'string'
            ? [selection]
            : Array.from(new Set(selection.userIds.map((id) => id.trim()).filter(Boolean)));
        const groupTitle = typeof selection === 'string' ? undefined : selection.title?.trim();

        if (selectedUserIds.length === 1) {
            const directUserId = selectedUserIds[0];
            const existing = conversationsRef.current.find((conversation) => (
                !conversation.isGroup
                && (
                    conversation.otherUser?.id === directUserId
                    || conversation.participants.some((participant) => participant.id === directUserId)
                )
            ));
            if (existing) {
                handleSelectConv(existing.id);
                if (currentAttachment) {
                    setPendingAttachment(currentAttachment);
                }
                if (clearUserSearchParam) {
                    navigate('/messages', { replace: true });
                }
                return;
            }
        }

        try {
            const payload = selectedUserIds.length === 1
                ? { userId: selectedUserIds[0] }
                : { userIds: selectedUserIds, title: groupTitle || undefined };
            const res = await apiFetch('/messages/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data: ConversationItem = await res.json();
                setConversations((prev) => upsertConversation(prev, data));
                handleSelectConv(data.id);
                if (currentAttachment) {
                    setPendingAttachment(currentAttachment);
                }
                void loadConversations();
            }
        } catch { /* noop */ }

        if (clearUserSearchParam) {
            navigate('/messages', { replace: true });
        }
    }, [handleSelectConv, loadConversations, navigate]);

    // ── Open conversation from URL param ───────────────────────────────────

    useEffect(() => {
        const userId = searchParams.get('user');
        if (!userId || isLoadingConvs) return;

        void handleStartConversation(userId, true);
    }, [searchParams, isLoadingConvs, handleStartConversation]);

    useEffect(() => {
        const state = location.state as { composerAttachment?: ComposerAttachment | null; openNewMessage?: boolean } | null;
        if (!state?.composerAttachment) return;

        setPendingAttachment(state.composerAttachment);
        setComposerError('');
        setShowAttachMenu(false);
        setShowEmojiPicker(false);

        if (!activeConvId && state.openNewMessage !== false && !searchParams.get('user')) {
            setShowNewMsg(true);
            setShowMobileList(true);
        }

        navigate(`${location.pathname}${location.search}`, {
            replace: true,
            state: null,
        });
    }, [activeConvId, location.pathname, location.search, location.state, navigate, searchParams]);

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

    const handleAttachmentSelect = (attachment: ComposerAttachment) => {
        setPendingAttachment(attachment);
        setShowAttachMenu(false);
        setShowPostPicker(false);
        setShowChartPicker(false);
        setComposerError('');
    };

    const handleImageAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setIsUploadingAttachment(true);
        setComposerError('');
        setShowAttachMenu(false);

        try {
            const uploaded = await uploadChatFile(file);
            handleAttachmentSelect({
                type: 'image',
                url: uploaded.url,
                meta: {
                    originalName: uploaded.originalName || file.name,
                    size: uploaded.size || file.size,
                },
            });
        } catch (error: any) {
            setComposerError(error?.message || 'No se pudo subir la foto');
        } finally {
            setIsUploadingAttachment(false);
        }
    };

    const handleSendMessage = async () => {
        const content = inputText.trim();
        const attachment = pendingAttachment
            ? {
                type: pendingAttachment.type,
                url: pendingAttachment.url,
                postId: pendingAttachment.postId || pendingAttachment.sharedPost?.id,
                meta: pendingAttachment.meta || undefined,
            }
            : undefined;

        if ((!content && !attachment) || !activeConvId || isSending || isUploadingAttachment) return;

        setIsSending(true);
        setComposerError('');

        try {
            const res = await apiFetch(`/messages/conversations/${activeConvId}/messages`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, attachment }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo enviar el mensaje');
            }

            const msg: DirectMessage = await res.json();
            setMessages((prev) => prev.some((item) => item.id === msg.id) ? prev : [...prev, msg]);
            setConversations((prev) => applyConversationMessageUpdate(prev, activeConvId, msg, user?.id, activeConvId));
            resetComposer();
        } catch (error: any) {
            setComposerError(error?.message || 'No se pudo enviar el mensaje');
        } finally {
            setIsSending(false);
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

    const handleEmojiSelect = (emoji: string) => {
        setInputText((current) => `${current}${emoji}`);
        setShowEmojiPicker(false);
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    // ── Helpers ────────────────────────────────────────────────────────────

    const filteredConvs = convSearch.trim()
        ? conversations.filter((conversation) => {
            const query = convSearch.toLowerCase();
            return getConversationName(conversation).toLowerCase().includes(query)
                || conversation.participants.some((participant) => participant.username.toLowerCase().includes(query));
        })
        : conversations;
    const canSendMessage = Boolean((inputText.trim() || pendingAttachment) && activeConvId && !isSending && !isUploadingAttachment);
    const activeTypingUsers = activeConv
        ? activeConv.participants.filter((participant) => typingUsers.has(participant.id) && participant.id !== user?.id)
        : [];

    const formatTime = (iso: string) => {
        const d = new Date(iso), diffH = (Date.now() - d.getTime()) / 36e5;
        if (diffH < 24) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        if (diffH < 168) return d.toLocaleDateString('es-AR', { weekday: 'short' });
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    const formatMsgTime = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const typingLabel = activeTypingUsers.length === 0
        ? ''
        : activeTypingUsers.length === 1
            ? `${activeTypingUsers[0].username} está escribiendo...`
            : `${activeTypingUsers.length} personas están escribiendo...`;

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <>
        <AnimatePresence>
            {showNewMsg && (
                <NewMessageModal onClose={() => setShowNewMsg(false)} onSelect={handleStartConversation} />
            )}
            {showPostPicker && (
                <PostPickerModal
                    currentUsername={user?.username}
                    onClose={() => setShowPostPicker(false)}
                    onSelect={handleAttachmentSelect}
                />
            )}
            {showChartPicker && (
                <ChartAttachmentModal
                    onClose={() => setShowChartPicker(false)}
                    onSelect={handleAttachmentSelect}
                />
            )}
        </AnimatePresence>

        <div className="flex flex-col flex-1 overflow-hidden">
            <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageAttachmentChange}
            />

            <div className="relative flex flex-1 h-full overflow-hidden" style={{ background: bgPage }}>

                {/* ══ LEFT COLUMN – Conversation list ══════════════════════════════ */}
                <AnimatePresence initial={false}>
                    {(showMobileList || !activeConvId) && (
                        <motion.aside
                            key="conv-list"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="flex flex-col lg:relative lg:w-[340px] lg:flex-shrink-0 absolute inset-0 z-10 lg:z-auto"
                            style={{
                                borderRight: `1px solid ${borderColor}`,
                                background: bgSidebar,
                                boxShadow: isLight ? '2px 0 12px hsl(220 15% 10% / 0.04)' : 'none',
                            }}
                        >
                            {/* Header — Instagram-style on mobile */}
                            <div
                                className="flex items-center justify-between px-5 lg:px-5"
                                style={{
                                    borderBottom: `1px solid ${borderColor}`,
                                    paddingTop: '18px',
                                    paddingBottom: '14px',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Finix logo pill — mobile only */}
                                    <div
                                        className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 28%) 100%)',
                                            boxShadow: '0 0 14px hsl(158 100% 45% / 0.35)',
                                        }}
                                    >
                                        <img src="/logo.png" alt="Finix" className="w-5 h-5 object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-[17px] font-black tracking-tight" style={{ color: textPrimary }}>
                                            {user?.username || 'Mensajes'}
                                        </h1>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(158 100% 40% / 0.65)' }}>
                                            Red Finix
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNewMsg(true)}
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                    style={{
                                        background: `linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 30%) 100%)`,
                                        boxShadow: `0 4px 18px hsl(158 100% 45% / 0.4)`,
                                    }}
                                    title="Nuevo mensaje"
                                >
                                    <Plus className="w-5 h-5 text-black" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="px-4 py-2.5">
                                <div className="flex items-center gap-2 px-3 rounded-2xl" style={{ background: searchBg, border: `1px solid ${searchBorder}` }}>
                                    <Search className="w-4 h-4 flex-shrink-0" style={{ color: textMuted }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar conversaciones..."
                                        value={convSearch}
                                        onChange={(e) => setConvSearch(e.target.value)}
                                        className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                                        style={{ color: textPrimary }}
                                    />
                                    {convSearch && (
                                        <button onClick={() => setConvSearch('')}>
                                            <X className="w-3.5 h-3.5" style={{ color: textMuted }} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto">
                                {isLoadingConvs ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredConvs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-5">
                                        <motion.div
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-20 h-20 rounded-3xl flex items-center justify-center"
                                            style={{
                                                background: 'linear-gradient(135deg, hsl(158 100% 45% / 0.12) 0%, hsl(158 100% 45% / 0.04) 100%)',
                                                border: '1px solid hsl(158 100% 45% / 0.2)',
                                                boxShadow: '0 8px 32px hsl(158 100% 45% / 0.1)',
                                            }}
                                        >
                                            <MessageSquare className="w-9 h-9" style={{ color: 'hsl(158 100% 45%)' }} />
                                        </motion.div>
                                        <div className="space-y-1.5">
                                            <p className="text-base font-bold" style={{ color: textPrimary }}>
                                                {convSearch ? 'Sin resultados' : 'Sin conversaciones aún'}
                                            </p>
                                            <p className="text-sm" style={{ color: textMuted }}>
                                                {convSearch ? 'Intentá con otro nombre' : 'Conectate con otros inversores de la red'}
                                            </p>
                                        </div>
                                        {!convSearch && (
                                            <button
                                                onClick={() => setShowNewMsg(true)}
                                                className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
                                                style={{
                                                    background: 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 30%) 100%)',
                                                    color: '#030d06',
                                                    boxShadow: '0 6px 20px hsl(158 100% 45% / 0.35)',
                                                }}
                                            >
                                                <Plus className="w-4 h-4" />
                                                Empezar chat o grupo
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <ul className="py-1">
                                        {filteredConvs.map((conv) => {
                                            const isActive = conv.id === activeConvId;
                                            return (
                                                <motion.li key={conv.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <div className="relative group">
                                                        <button
                                                            onClick={() => handleSelectConv(conv.id)}
                                                            className="w-full flex items-center gap-3 px-4 pr-12 py-4 lg:py-3.5 transition-all text-left"
                                                            style={{
                                                                background: isActive ? 'hsl(158 100% 45% / 0.07)' : 'transparent',
                                                                borderLeft: isActive ? '3px solid hsl(158 100% 45%)' : '3px solid transparent',
                                                            }}
                                                            onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = hoverBg; }}
                                                            onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                                        >
                                                            <ConversationAvatar
                                                                conversation={conv}
                                                                currentUserId={user?.id}
                                                                size={46}
                                                                onlineUsers={onlineUsers}
                                                            />

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <span className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                                                                        {getConversationName(conv)}
                                                                        {!conv.isGroup && conv.otherUser?.isVerified && (
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
                                                                            ? `${conv.lastMessage.senderId === user?.id
                                                                                ? 'Tu: '
                                                                                : conv.isGroup
                                                                                    ? `${conv.lastMessage.sender.username}: `
                                                                                    : ''}${getMessagePreview(conv.lastMessage)}`
                                                                            : getConversationSecondaryText(conv, user?.id)}
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

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                                        isActive ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'
                                                                    }`}
                                                                    style={{ background: isActive ? 'hsl(158 100% 45% / 0.1)' : 'transparent' }}
                                                                    title="Acciones del chat"
                                                                    aria-label={`Acciones del chat ${getConversationName(conv)}`}
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4" style={{ color: textMuted }} />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>Acciones del chat</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleSelectConv(conv.id)}>
                                                                    <MessageSquare className="w-4 h-4" />
                                                                    Abrir chat
                                                                </DropdownMenuItem>
                                                                {!conv.isGroup && conv.otherUser && (
                                                                    <DropdownMenuItem onClick={() => conv.otherUser && navigate(`/profile/${conv.otherUser.username}`)}>
                                                                        <ExternalLink className="w-4 h-4" />
                                                                        Ver perfil
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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
                <div className="flex flex-col flex-1 h-full min-w-0" style={{ background: bgPage }}>
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
                                    Conectate con otros inversores de la red Finix y armá chats privados o grupales
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
                                Nuevo mensaje o grupo
                            </button>

                            {/* Recent conversations hint */}
                            {conversations.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Seleccioná una conversación o grupo a la izquierda</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* ── Chat header ── */}
                            <div
                                className="flex items-center gap-2 px-3 lg:px-5 flex-shrink-0"
                                style={{
                                    borderBottom: `1px solid ${borderColor}`,
                                    background: chatHeaderBg,
                                    paddingTop: '12px',
                                    paddingBottom: '12px',
                                    minHeight: '64px',
                                }}
                            >
                                {/* Back button */}
                                <button
                                    onClick={handleReturnToInbox}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                                    style={{ background: isLight ? 'hsl(210 14% 94%)' : 'hsl(0 0% 100% / 0.07)' }}
                                >
                                    <ArrowLeft className="w-5 h-5" style={{ color: textPrimary }} />
                                </button>

                                {activeConv && (
                                    <>
                                        {/* Avatar */}
                                        {activeConv.isGroup ? (
                                            <ConversationAvatar
                                                conversation={activeConv}
                                                currentUserId={user?.id}
                                                size={40}
                                                onlineUsers={onlineUsers}
                                            />
                                        ) : activeConv.otherUser && (
                                            <Link to={`/profile/${activeConv.otherUser.username}`}>
                                                <UserAvatar user={activeConv.otherUser} size={40} online={onlineUsers.has(activeConv.otherUser.id)} />
                                            </Link>
                                        )}

                                        {/* Name + status */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                {activeConv.isGroup ? (
                                                    <span className="font-bold truncate text-[15px]" style={{ color: textPrimary }}>
                                                        {getConversationName(activeConv)}
                                                    </span>
                                                ) : activeConv.otherUser && (
                                                    <Link
                                                        to={`/profile/${activeConv.otherUser.username}`}
                                                        className="font-bold hover:text-primary transition-colors truncate text-[15px]"
                                                        style={{ color: textPrimary }}
                                                    >
                                                        {activeConv.otherUser.username}
                                                    </Link>
                                                )}
                                                {!activeConv.isGroup && activeConv.otherUser?.isVerified && (
                                                    <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[12px] flex items-center gap-1.5" style={{ color: textMuted }}>
                                                {activeTypingUsers.length > 0 ? (
                                                    <motion.span
                                                        animate={{ opacity: [1, 0.5, 1] }}
                                                        transition={{ duration: 1.2, repeat: Infinity }}
                                                        className="font-medium"
                                                        style={{ color: 'hsl(158 100% 40%)' }}
                                                    >
                                                        {typingLabel}
                                                    </motion.span>
                                                ) : activeConv.isGroup ? (
                                                    getConversationSecondaryText(activeConv, user?.id)
                                                ) : activeConv.otherUser && onlineUsers.has(activeConv.otherUser.id) ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(158 100% 42%)', boxShadow: '0 0 5px hsl(158 100% 45%)' }} />
                                                        En línea
                                                    </span>
                                                ) : 'Desconectado'}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                                                    style={{ background: isLight ? 'hsl(210 14% 94%)' : 'hsl(0 0% 100% / 0.07)' }}
                                                    title="Acciones del chat"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" style={{ color: textMuted }} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52">
                                                <DropdownMenuLabel>Acciones del chat</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {!activeConv.isGroup && activeConv.otherUser && (
                                                    <DropdownMenuItem onClick={() => activeConv.otherUser && navigate(`/profile/${activeConv.otherUser.username}`)}>
                                                        <ExternalLink className="w-4 h-4" />
                                                        Ver perfil
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={handleReturnToInbox}>
                                                    <ArrowLeft className="w-4 h-4" />
                                                    Volver a mensajes
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                            </div>

                            {/* ── Messages area ── */}
                            <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-4 space-y-1">
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
                                            Iniciá el chat 👋
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
                                                                {showAvatar && (
                                                                    <UserAvatar user={msg.sender} size={28} />
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className={`flex flex-col max-w-[68%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                            {!isMe && activeConv?.isGroup && isFirstInGroup && (
                                                                <span className="mb-1 px-1 text-[11px] font-semibold" style={{ color: textMuted }}>
                                                                    {msg.sender.username}
                                                                </span>
                                                            )}
                                                            {(() => {
                                                                const hasAttachment = Boolean(msg.attachmentType);
                                                                const hasText = Boolean(msg.content?.trim());

                                                                return (
                                                            <div
                                                                className="text-sm leading-relaxed break-words whitespace-pre-wrap overflow-hidden"
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
                                                                    padding: hasAttachment ? '10px' : '10px 14px',
                                                                }}
                                                            >
                                                                {hasAttachment && (
                                                                    <MessageAttachmentCard
                                                                        message={msg}
                                                                        isLight={isLight}
                                                                        borderColor={isMe ? 'hsl(158 100% 30% / 0.25)' : borderColor}
                                                                        textPrimary={isMe ? '#031108' : textPrimary}
                                                                        textMuted={isMe ? 'rgba(3,17,8,0.7)' : textMuted}
                                                                    />
                                                                )}
                                                                {hasText && (
                                                                    <div className={hasAttachment ? 'mt-2.5 px-1 pb-1' : ''}>
                                                                        {msg.content}
                                                                    </div>
                                                                )}
                                                            </div>
                                                                );
                                                            })()}

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
                                            {activeTypingUsers.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 6 }}
                                                    className="flex items-end gap-2 mt-2"
                                                >
                                                    <UserAvatar user={activeTypingUsers[0]} size={28} />
                                                    <div className="space-y-1 px-4 py-3 rounded-[4px_18px_18px_18px]"
                                                        style={{ background: bubbleBg }}>
                                                        <p className="text-[11px] font-medium" style={{ color: textMuted }}>
                                                            {typingLabel}
                                                        </p>
                                                        <div className="flex items-center gap-1">
                                                        {['typing-a', 'typing-b', 'typing-c'].map((dotId, i) => (
                                                            <motion.span key={dotId} className="w-1.5 h-1.5 rounded-full"
                                                                style={{ background: textMuted }}
                                                                animate={{ y: [0, -4, 0] }}
                                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                            />
                                                        ))}
                                                        </div>
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
                                className="flex-shrink-0 px-3 lg:px-4 py-3"
                                style={{ borderTop: `1px solid ${borderColor}`, background: chatHeaderBg }}
                            >
                                {pendingAttachment && (
                                    <div
                                        className="mb-3 rounded-2xl border p-3"
                                        style={{
                                            borderColor,
                                            background: isLight ? 'hsl(0 0% 100%)' : 'hsl(0 0% 100% / 0.04)',
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {pendingAttachment.type === 'image' && pendingAttachment.url && (
                                                <img
                                                    src={pendingAttachment.url}
                                                    alt="Foto lista para enviar"
                                                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                                                />
                                            )}

                                            {pendingAttachment.type === 'chart' && pendingAttachment.url && (
                                                <img
                                                    src={pendingAttachment.url}
                                                    alt="Grafico listo para enviar"
                                                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                                                />
                                            )}

                                            {pendingAttachment.type === 'post' && (
                                                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                                    <Newspaper className="w-7 h-7" />
                                                </div>
                                            )}

                                            {pendingAttachment.type === 'story' && (
                                                pendingAttachment.sharedStory?.mediaUrl ? (
                                                    <img
                                                        src={pendingAttachment.sharedStory.mediaUrl}
                                                        alt="Historia lista para enviar"
                                                        className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                                        <Sparkles className="w-7 h-7" />
                                                    </div>
                                                )
                                            )}

                                            <div className="min-w-0 flex-1">
                                                {pendingAttachment.type === 'image' && (
                                                    <>
                                                        <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                                                            Foto lista para enviar
                                                        </p>
                                                        <p className="text-xs mt-1" style={{ color: textMuted }}>
                                                            {String(pendingAttachment.meta?.originalName || 'Imagen')}
                                                        </p>
                                                    </>
                                                )}

                                                {pendingAttachment.type === 'post' && pendingAttachment.sharedPost && (
                                                    <>
                                                        <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                                                            Publicacion compartida
                                                        </p>
                                                        <p className="text-xs mt-1" style={{ color: textMuted }}>
                                                            {pendingAttachment.sharedPost.author.username}
                                                        </p>
                                                        {pendingAttachment.sharedPost.content && (
                                                            <p className="text-sm mt-2 max-h-10 overflow-hidden" style={{ color: textPrimary }}>
                                                                {pendingAttachment.sharedPost.content}
                                                            </p>
                                                        )}
                                                    </>
                                                )}

                                                {pendingAttachment.type === 'chart' && (
                                                    <>
                                                        <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                                                            Grafico listo para enviar
                                                        </p>
                                                        <p className="text-xs mt-1 font-mono" style={{ color: textMuted }}>
                                                            {String(pendingAttachment.meta?.symbol || 'ACTIVO')} · {getChartIntervalLabel(String(pendingAttachment.meta?.interval || 'D'))}
                                                        </p>
                                                    </>
                                                )}

                                                {pendingAttachment.type === 'story' && pendingAttachment.sharedStory && (
                                                    <>
                                                        <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                                                            Historia compartida
                                                        </p>
                                                        <p className="text-xs mt-1" style={{ color: textMuted }}>
                                                            {pendingAttachment.sharedStory.author.username}
                                                        </p>
                                                        {pendingAttachment.sharedStory.content && (
                                                            <p className="text-sm mt-2 max-h-10 overflow-hidden" style={{ color: textPrimary }}>
                                                                {pendingAttachment.sharedStory.content}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => setPendingAttachment(null)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-colors"
                                            >
                                                <X className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {composerError && (
                                    <div className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                                        {composerError}
                                    </div>
                                )}

                                <div
                                    className="flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-all"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${(inputText.trim() || pendingAttachment) ? 'hsl(158 100% 45% / 0.4)' : inputBorder}`,
                                        boxShadow: (inputText.trim() || pendingAttachment) ? '0 0 0 3px hsl(158 100% 45% / 0.08)' : 'none',
                                    }}
                                >
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                setShowAttachMenu((prev) => !prev);
                                                setShowEmojiPicker(false);
                                            }}
                                            className="p-1.5 rounded-xl transition-all flex-shrink-0 mb-0.5"
                                            style={{ color: showAttachMenu ? 'hsl(158 100% 45%)' : textMuted, background: showAttachMenu ? 'hsl(158 100% 45% / 0.1)' : 'transparent' }}
                                            title="Adjuntar"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>

                                        <AnimatePresence>
                                            {showAttachMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute bottom-full left-0 mb-2 w-52 p-2 rounded-2xl border shadow-xl z-20"
                                                    style={{ background: isLight ? 'hsl(0 0% 100%)' : '#1a1a1a', borderColor }}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setShowAttachMenu(false);
                                                            imageInputRef.current?.click();
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-secondary/50 transition-colors"
                                                    >
                                                        <ImageIcon className="w-4 h-4 text-primary" />
                                                        Foto
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowAttachMenu(false);
                                                            setShowPostPicker(true);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-secondary/50 transition-colors"
                                                    >
                                                        <Newspaper className="w-4 h-4 text-primary" />
                                                        Publicacion
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowAttachMenu(false);
                                                            setShowChartPicker(true);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-secondary/50 transition-colors"
                                                    >
                                                        <BarChart2 className="w-4 h-4 text-primary" />
                                                        Grafico
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Emoji button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                setShowEmojiPicker((prev) => !prev);
                                                setShowAttachMenu(false);
                                            }}
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
                                                    className="absolute bottom-full left-0 mb-3 w-[288px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border shadow-2xl z-20"
                                                    style={{
                                                        background: isLight ? 'hsl(0 0% 100% / 0.98)' : 'hsl(0 0% 8% / 0.98)',
                                                        borderColor,
                                                        backdropFilter: 'blur(10px)',
                                                    }}
                                                >
                                                    <div
                                                        className="px-3 py-2.5 border-b"
                                                        style={{
                                                            borderColor,
                                                            background: isLight ? 'hsl(210 20% 98%)' : 'hsl(0 0% 100% / 0.03)',
                                                        }}
                                                    >
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: textMuted }}>
                                                            Emojis
                                                        </p>
                                                    </div>
                                                    <div className="p-3 space-y-3">
                                                        {EMOJI_GROUPS.map((group) => (
                                                            <div key={group.label} className="space-y-2">
                                                                <p className="text-[11px] font-medium" style={{ color: textMuted }}>
                                                                    {group.label}
                                                                </p>
                                                                <div className="grid grid-cols-5 gap-2">
                                                                    {group.items.map((emoji) => (
                                                                        <button
                                                                            key={emoji}
                                                                            onClick={() => handleEmojiSelect(emoji)}
                                                                            className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5 hover:bg-secondary/60"
                                                                            style={{
                                                                                borderColor: isLight ? 'hsl(214 18% 90%)' : 'hsl(0 0% 100% / 0.06)',
                                                                                background: isLight ? 'hsl(210 20% 99%)' : 'hsl(0 0% 100% / 0.03)',
                                                                            }}
                                                                            aria-label={`Agregar ${emoji}`}
                                                                        >
                                                                            <span
                                                                                className="emoji-glyph block text-[25px]"
                                                                                style={{ fontFamily: EMOJI_FONT_STACK }}
                                                                            >
                                                                                {emoji}
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
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
                                        placeholder={pendingAttachment ? 'Agrega un texto opcional...' : 'Escribi un mensaje...'}
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
                                        disabled={!canSendMessage}
                                        whileHover={canSendMessage ? { scale: 1.08 } : {}}
                                        whileTap={canSendMessage ? { scale: 0.92 } : {}}
                                        className="p-2 rounded-xl flex-shrink-0 mb-0.5 transition-all"
                                        style={{
                                            background: canSendMessage
                                                ? 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 33%) 100%)'
                                                : 'transparent',
                                            color: canSendMessage ? '#060a07' : textMuted,
                                            boxShadow: canSendMessage ? '0 2px 10px hsl(158 100% 45% / 0.35)' : 'none',
                                            cursor: canSendMessage ? 'pointer' : 'default',
                                        }}
                                    >
                                        {(isSending || isUploadingAttachment)
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Send className="w-4 h-4" />}
                                    </motion.button>
                                </div>

                                <p className="text-center text-[10px] text-muted-foreground mt-2 opacity-60">
                                    {isUploadingAttachment
                                        ? 'Subiendo adjunto...'
                                        : 'Enter para enviar · Shift+Enter nueva linea'}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}
