import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck, ChevronLeft, ChevronRight, Eye, Heart, Send, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { StoryGroup, StoryItem } from './storyTypes';
import type { ComposerAttachment } from '@/components/messages/messageTypes';

const STORY_DURATION_MS = 5000;

function timeAgo(dateString: string) {
    const deltaMs = Date.now() - new Date(dateString).getTime();
    const minutes = Math.max(1, Math.floor(deltaMs / (1000 * 60)));
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${Math.floor(hours / 24)} d`;
}

function getInitialStoryIndex(group?: StoryGroup) {
    if (!group || group.stories.length === 0) return 0;
    const firstUnseen = group.stories.findIndex((story) => !story.viewedByMe);
    return firstUnseen >= 0 ? firstUnseen : 0;
}

function markViewed(groups: StoryGroup[], storyId: string) {
    return groups.map((group) => {
        const stories = group.stories.map((story) => (
            story.id === storyId ? { ...story, viewedByMe: true } : story
        ));

        return {
            ...group,
            stories,
            hasUnseen: stories.some((story) => !story.viewedByMe),
        };
    });
}

function removeStory(groups: StoryGroup[], storyId: string) {
    return groups
        .map((group) => {
            const stories = group.stories.filter((story) => story.id !== storyId);
            return {
                ...group,
                stories,
                hasUnseen: stories.some((story) => !story.viewedByMe),
                latestAt: stories[stories.length - 1]?.createdAt || group.latestAt,
            };
        })
        .filter((group) => group.stories.length > 0);
}

function buildStoryAttachment(story: StoryItem): ComposerAttachment {
    return {
        type: 'story',
        url: story.mediaUrl ?? undefined,
        meta: {
            storyId: story.id,
        },
        sharedStory: {
            id: story.id,
            content: story.content,
            mediaUrl: story.mediaUrl,
            background: story.background,
            textColor: story.textColor,
            createdAt: story.createdAt,
            expiresAt: story.expiresAt,
            author: {
                id: story.author.id,
                username: story.author.username,
                avatarUrl: story.author.avatarUrl,
                isVerified: story.author.isVerified,
            },
        },
    };
}

function getReadableStoryTextColor(color?: string | null) {
    if (!color) return '#ffffff';

    const normalized = color.trim().replace('#', '');
    if (![3, 6].includes(normalized.length) || !/^[0-9a-f]+$/i.test(normalized)) {
        return color;
    }

    const hex = normalized.length === 3
        ? normalized.split('').map((value) => `${value}${value}`).join('')
        : normalized;
    const channels = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
    const luminance = channels.reduce((total, channel, index) => {
        const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        return total + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);

    // Text is shown over a dark readability panel, so very dark custom colors
    // would disappear even if they were valid colors in the story composer.
    return luminance < 0.42 ? '#ffffff' : color;
}

export function StoryViewerModal({
    groups,
    activeGroupIndex,
    currentUserId,
    onClose,
    onGroupsChange,
}: {
    groups: StoryGroup[];
    activeGroupIndex: number | null;
    currentUserId?: string;
    onClose: () => void;
    onGroupsChange: (nextGroups: StoryGroup[]) => void;
}) {
    const navigate = useNavigate();
    const [groupIndex, setGroupIndex] = useState(0);
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isLiking, setIsLiking] = useState(false);
    const [isSendingReply, setIsSendingReply] = useState(false);
    const touchStartX = useRef<number | null>(null);

    const open = activeGroupIndex !== null && groups.length > 0;

    useEffect(() => {
        if (!open || activeGroupIndex === null) return;
        const safeGroupIndex = Math.min(activeGroupIndex, Math.max(groups.length - 1, 0));
        setGroupIndex(safeGroupIndex);
        setStoryIndex(getInitialStoryIndex(groups[safeGroupIndex]));
        setProgress(0);
    }, [activeGroupIndex, open]);

    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        if (groupIndex >= groups.length) {
            if (groups.length === 0) {
                onClose();
                return;
            }
            setGroupIndex(groups.length - 1);
            setStoryIndex(0);
            setProgress(0);
            return;
        }

        const group = groups[groupIndex];
        if (!group) return;

        if (storyIndex >= group.stories.length) {
            setStoryIndex(Math.max(group.stories.length - 1, 0));
            setProgress(0);
        }
    }, [groupIndex, storyIndex, groups, open, onClose]);

    const currentGroup = open ? groups[groupIndex] : null;
    const currentStory = currentGroup?.stories[storyIndex] ?? null;

    const goToGroup = (nextGroupIndex: number) => {
        if (nextGroupIndex < 0 || nextGroupIndex >= groups.length) return;
        setGroupIndex(nextGroupIndex);
        setStoryIndex(getInitialStoryIndex(groups[nextGroupIndex]));
        setProgress(0);
    };

    const goNext = () => {
        if (!currentGroup) return;
        if (storyIndex < currentGroup.stories.length - 1) {
            setStoryIndex((current) => current + 1);
            setProgress(0);
            return;
        }
        if (groupIndex < groups.length - 1) {
            goToGroup(groupIndex + 1);
            return;
        }
        onClose();
    };

    const goPrevious = () => {
        if (storyIndex > 0) {
            setStoryIndex((current) => current - 1);
            setProgress(0);
            return;
        }
        if (groupIndex > 0) {
            const previousGroupIndex = groupIndex - 1;
            const previousGroup = groups[previousGroupIndex];
            setGroupIndex(previousGroupIndex);
            setStoryIndex(Math.max(previousGroup.stories.length - 1, 0));
            setProgress(0);
        }
    };

    const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    };

    const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
        const startX = touchStartX.current;
        touchStartX.current = null;
        if (startX === null) return;

        const endX = event.changedTouches[0]?.clientX;
        if (endX === undefined) return;

        const deltaX = endX - startX;
        if (Math.abs(deltaX) < 45) return;
        if (deltaX < 0) {
            goNext();
        } else {
            goPrevious();
        }
    };

    useEffect(() => {
        if (!open || !currentStory) return;

        let frame = 0;
        const startedAt = performance.now();

        const tick = (now: number) => {
            const ratio = Math.min((now - startedAt) / STORY_DURATION_MS, 1);
            setProgress(ratio);
            if (ratio >= 1) {
                goNext();
                return;
            }
            frame = window.requestAnimationFrame(tick);
        };

        setProgress(0);
        frame = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [open, currentStory?.id]);

    useEffect(() => {
        if (!open || !currentStory || !currentUserId || currentStory.viewedByMe) return;

        apiFetch(`/stories/${currentStory.id}/view`, { method: 'POST' }).then((res) => {
            if (!res.ok) return;
            onGroupsChange(markViewed(groups, currentStory.id));
        }).catch(() => {
            // keep viewer responsive even if marking view fails
        });
    }, [open, currentStory?.id, currentStory?.viewedByMe, currentUserId, groups, onGroupsChange]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowRight') goNext();
            if (event.key === 'ArrowLeft') goPrevious();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, groupIndex, storyIndex, groups]);

    if (!open || !currentStory || !currentGroup) return null;

    const isOwnStory = currentStory.authorId === currentUserId;
    const storyTextColor = getReadableStoryTextColor(currentStory.textColor);

    const handleDelete = async () => {
        if (!isOwnStory || isDeleting) return;
        if (!confirm('Eliminar esta historia?')) return;

        setIsDeleting(true);
        try {
            const res = await apiFetch(`/stories/${currentStory.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || 'No se pudo eliminar la historia');
            }

            const nextGroups = removeStory(groups, currentStory.id);
            onGroupsChange(nextGroups);

            if (nextGroups.length === 0) {
                onClose();
                return;
            }

            if (groupIndex >= nextGroups.length) {
                setGroupIndex(nextGroups.length - 1);
                setStoryIndex(0);
            } else {
                const nextGroup = nextGroups[groupIndex];
                setStoryIndex(Math.min(storyIndex, nextGroup.stories.length - 1));
            }
            setProgress(0);
        } catch {
            // viewer keeps current state on delete error
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleLike = async () => {
        if (!currentStory || !currentUserId || isOwnStory || isLiking) return;
        setIsLiking(true);
        const method = currentStory.isLiked ? 'DELETE' : 'POST';
        const newGroups = groups.map(group => {
            if (group.author.id !== currentStory.authorId) return group;
            return {
                ...group,
                stories: group.stories.map(s => {
                    if (s.id !== currentStory.id) return s;
                    return {
                        ...s,
                        isLiked: !s.isLiked,
                        likesCount: s.isLiked ? s.likesCount - 1 : s.likesCount + 1
                    };
                })
            };
        });
        onGroupsChange(newGroups);
        try {
            await apiFetch(`/stories/${currentStory.id}/like`, { method });
        } catch (error) {
            // Revert on error
            onGroupsChange(groups);
        } finally {
            setIsLiking(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !currentStory || !currentUserId || isOwnStory || isSendingReply) return;
        setIsSendingReply(true);
        try {
            const convRes = await apiFetch('/messages/conversations', {
                method: 'POST',
                body: JSON.stringify({ userId: currentStory.authorId }),
            });
            if (!convRes.ok) throw new Error('Error de conversacion');
            const conv = await convRes.json();
            
            const msgRes = await apiFetch(`/messages/conversations/${conv.id}/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    content: `Respuesta a historia:

${replyText.trim()}`,
                    attachment: buildStoryAttachment(currentStory),
                }),
            });
            if (!msgRes.ok) throw new Error('Error enviando mensaje');
            setReplyText('');
        } catch (error) {
            alert('Error al enviar el mensaje');
        } finally {
            setIsSendingReply(false);
        }
    };

    const handleOpenProfile = () => {
        navigate(`/profile/${currentStory.author.username}`);
    };

    const handleShareToChat = () => {
        navigate('/messages', {
            state: {
                composerAttachment: buildStoryAttachment(currentStory),
                openNewMessage: true,
            },
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[90] bg-slate-950/95">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_38%)]" />

            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-[95] rounded-full border border-white/25 bg-slate-950/85 p-2 text-white shadow-lg backdrop-blur transition-colors hover:bg-slate-900 hover:text-white"
                aria-label="Cerrar historias"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-full max-w-7xl items-center justify-center p-3 md:p-6">
                <div className="grid h-full w-full items-center gap-5 place-items-center">
                    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col justify-center">
                        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09110d] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
                            <div className="absolute inset-x-0 top-0 z-[60] flex gap-1.5 px-4 pt-4">
                                {currentGroup.stories.map((story, index) => (
                                    <div key={story.id} className="h-1.5 flex-1 overflow-hidden rounded-full border border-white/20 bg-slate-950/60 backdrop-blur-sm">
                                        <div
                                            className="h-full rounded-full bg-white transition-all duration-100 ease-linear"
                                            style={{
                                                width:
                                                    index < storyIndex
                                                        ? '100%'
                                                        : index === storyIndex
                                                            ? `${progress * 100}%`
                                                            : '0%',
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-4 pb-4 pt-8">
                                <button
                                    type="button"
                                    onClick={handleOpenProfile}
                                    className="flex min-w-0 items-center gap-3 rounded-full border border-white/20 bg-slate-950/80 px-3 py-2 text-left shadow-lg backdrop-blur-md transition-colors hover:bg-slate-900/90"
                                >
                                    <div className="h-10 w-10 overflow-hidden rounded-full border border-white/25 bg-slate-950/80">
                                        {currentStory.author.avatarUrl ? (
                                            <img
                                                src={resolveMediaUrl(currentStory.author.avatarUrl)}
                                                alt={currentStory.author.username}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm font-bold uppercase text-white">
                                                {currentStory.author.username[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1 text-sm font-semibold text-white">
                                            <span className="truncate">{currentStory.author.username}</span>
                                            {currentStory.author.isVerified ? <BadgeCheck className="h-4 w-4 text-emerald-300" /> : null}
                                        </div>
                                        <div className="text-[11px] text-white/90">{timeAgo(currentStory.createdAt)}</div>
                                    </div>
                                </button>

                                <div className="flex items-center gap-2">


                                    {isOwnStory ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full border border-white/20 bg-slate-950/80 text-white shadow-lg hover:bg-red-500/25 hover:text-red-100"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    ) : null}
                                </div>
                            </div>

                            <div
                                className="relative aspect-[9/16] max-h-[min(82vh,760px)] min-h-[min(62vh,620px)] w-full overflow-hidden"
                                onTouchStart={handleTouchStart}
                                onTouchEnd={handleTouchEnd}
                                onTouchCancel={() => { touchStartX.current = null; }}
                                style={{ background: currentStory.background || 'linear-gradient(135deg, #0f172a 0%, #111827 45%, #10b981 100%)' }}
                            >
                                {currentStory.mediaUrl ? (
                                    <img
                                        src={resolveMediaUrl(currentStory.mediaUrl)}
                                        alt={`Historia de ${currentStory.author.username}`}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                ) : null}

                                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/75" />

                                {!currentStory.mediaUrl ? (
                                    <div className="relative z-10 flex h-full items-center justify-center p-8 text-center">
                                        <p
                                            className="max-w-[88%] whitespace-pre-wrap break-words rounded-3xl border border-white/20 bg-slate-950/65 px-6 py-4 text-[1.9rem] font-semibold leading-tight shadow-[0_12px_48px_rgba(0,0,0,0.35)] backdrop-blur-md"
                                            style={{ color: storyTextColor, textShadow: '0 2px 5px rgba(0,0,0,0.9)' }}
                                        >
                                            {currentStory.content}
                                        </p>
                                    </div>
                                ) : null}

                                {currentStory.content ? (
                                    <div className="absolute inset-x-0 bottom-0 z-10 p-6">
                                        <div className="rounded-[1.5rem] border border-white/20 bg-slate-950/75 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
                                            <p
                                                className="whitespace-pre-wrap break-words text-base font-medium leading-relaxed"
                                                style={{ color: storyTextColor, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                                            >
                                                {currentStory.content}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={goPrevious}
                                    className="absolute inset-y-0 left-0 z-20 w-1/3 cursor-pointer"
                                    aria-label="Historia anterior"
                                />
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="absolute inset-y-0 right-0 z-20 w-1/3 cursor-pointer"
                                    aria-label="Siguiente historia"
                                />

                                <div className="pointer-events-none absolute inset-y-0 left-3 z-30 flex items-center">
                                    <div className="rounded-full border border-white/30 bg-slate-950/75 p-2.5 text-white shadow-lg backdrop-blur-md">
                                        <ChevronLeft className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="pointer-events-none absolute inset-y-0 right-3 z-30 flex items-center">
                                    <div className="rounded-full border border-white/30 bg-slate-950/75 p-2.5 text-white shadow-lg backdrop-blur-md">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        <div className="mt-4 flex w-full items-center gap-3">
                            {isOwnStory ? (
                                <div className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-white/85 shadow-lg backdrop-blur-md">
                                    <div className="flex items-center gap-4">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Eye className="h-4 w-4" />
                                            {currentStory.viewsCount} vistas
                                        </span>
                                        {currentStory.likesCount > 0 && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                                {currentStory.likesCount} me gusta
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleShareToChat}
                                        className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-slate-900/80 text-white shadow hover:border-white/60 transition-colors"
                                        title="Compartir historia"
                                    >
                                        <Send className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-translate-y-1 group-hover:translate-x-1" />
                                    </button>
                                </div>
                            ) : (
                                currentUserId ? (
                                    <>
                                        <form onSubmit={handleSendReply} className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                onKeyDown={(e) => e.stopPropagation()}
                                                placeholder={`Responder a ${currentStory.author.username}...`}
                                                className="w-full rounded-full border border-white/30 bg-slate-950/85 px-4 py-2.5 pr-10 text-sm text-white placeholder-white/80 shadow-lg backdrop-blur-md focus:border-emerald-300/70 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                                            />
                                            {replyText.trim() && (
                                                <button
                                                    type="submit"
                                                    disabled={isSendingReply}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white hover:bg-white/15 hover:text-white disabled:opacity-50 transition-colors"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </button>
                                            )}
                                        </form>
                                        <button
                                            type="button"
                                            onClick={handleToggleLike}
                                            disabled={isLiking}
                                            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-slate-950/85 text-white shadow-lg backdrop-blur-md hover:border-white/60 transition-colors"
                                            title={currentStory.isLiked ? "Ya no me gusta" : "Me gusta"}
                                        >
                                            <Heart className={`h-5 w-5 transition-transform group-hover:scale-110 ${currentStory.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleShareToChat}
                                            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-slate-950/85 text-white shadow-lg backdrop-blur-md hover:border-white/60 transition-colors"
                                            title="Compartir historia"
                                        >
                                            <Send className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:-translate-y-1 group-hover:translate-x-1" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-3 py-2 text-center text-xs text-white/85 shadow-lg backdrop-blur-md">Iniciá sesión para interactuar</div>
                                )
                            )}
                        </div>
                    </div>

                    
                </div>
            </div>
        </div>,
        document.body
    );
}
