import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, Eye, MessageSquare, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
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

    const orderedGroups = useMemo(() => groups, [groups]);

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

    return (
        <div className="fixed inset-0 z-[90] bg-black/95">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_38%)]" />

            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-[95] rounded-full border border-white/10 bg-black/40 p-2 text-white/80 backdrop-blur transition-colors hover:text-white"
                aria-label="Cerrar historias"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-full max-w-7xl items-center justify-center p-3 md:p-6">
                <div className="grid h-full w-full items-center gap-5 lg:grid-cols-[minmax(0,430px)_320px]">
                    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col justify-center">
                        <div className="mb-4 flex gap-1.5">
                            {currentGroup.stories.map((story, index) => (
                                <div key={story.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                                    <div
                                        className="h-full rounded-full bg-white"
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

                        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09110d] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
                            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
                                <button
                                    type="button"
                                    onClick={handleOpenProfile}
                                    className="flex min-w-0 items-center gap-3 rounded-full bg-black/35 px-3 py-2 text-left backdrop-blur transition-colors hover:bg-black/50"
                                >
                                    <div className="h-10 w-10 overflow-hidden rounded-full border border-white/15 bg-black/30">
                                        {currentStory.author.avatarUrl ? (
                                            <img
                                                src={currentStory.author.avatarUrl}
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
                                            {currentStory.author.isVerified ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
                                        </div>
                                        <div className="text-[11px] text-white/65">{timeAgo(currentStory.createdAt)}</div>
                                    </div>
                                </button>

                                <div className="flex items-center gap-2">
                                    {currentUserId ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full bg-black/35 text-white hover:bg-black/50 hover:text-white"
                                            onClick={handleShareToChat}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
                                    ) : null}

                                    {isOwnStory ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full bg-black/35 text-white hover:bg-red-500/20 hover:text-red-200"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    ) : null}
                                </div>
                            </div>

                            <div
                                className="relative aspect-[9/16] min-h-[72vh] w-full overflow-hidden"
                                style={{ background: currentStory.background || 'linear-gradient(135deg, #0f172a 0%, #111827 45%, #10b981 100%)' }}
                            >
                                {currentStory.mediaUrl ? (
                                    <img
                                        src={currentStory.mediaUrl}
                                        alt={`Historia de ${currentStory.author.username}`}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                ) : null}

                                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />

                                {!currentStory.mediaUrl ? (
                                    <div className="relative z-10 flex h-full items-center justify-center p-10 text-center">
                                        <p
                                            className="max-w-[88%] whitespace-pre-wrap break-words text-[1.9rem] font-semibold leading-tight"
                                            style={{ color: currentStory.textColor || '#ffffff', textShadow: '0 16px 52px rgba(0,0,0,0.38)' }}
                                        >
                                            {currentStory.content}
                                        </p>
                                    </div>
                                ) : null}

                                {currentStory.content ? (
                                    <div className="absolute inset-x-0 bottom-0 z-10 p-6">
                                        <div className="rounded-[1.5rem] bg-black/35 p-4 backdrop-blur">
                                            <p
                                                className="whitespace-pre-wrap break-words text-base font-medium leading-relaxed"
                                                style={{ color: currentStory.textColor || '#ffffff' }}
                                            >
                                                {currentStory.content}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={goPrevious}
                                    className="absolute inset-y-0 left-0 z-10 w-1/3"
                                    aria-label="Historia anterior"
                                />
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="absolute inset-y-0 right-0 z-10 w-1/3"
                                    aria-label="Siguiente historia"
                                />

                                <div className="absolute inset-y-0 left-3 z-20 flex items-center">
                                    <div className="rounded-full bg-black/30 p-2 text-white/80 backdrop-blur">
                                        <ChevronLeft className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="absolute inset-y-0 right-3 z-20 flex items-center">
                                    <div className="rounded-full bg-black/30 p-2 text-white/80 backdrop-blur">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between px-1 text-xs text-white/65">
                            <span>Toca los lados para avanzar o volver</span>
                            {isOwnStory ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5" />
                                    {currentStory.viewsCount} vistas
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="hidden h-[78vh] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur lg:flex lg:flex-col">
                        <div className="mb-3 text-sm font-semibold text-white/80">Historias activas</div>
                        <div className="space-y-2 overflow-y-auto pr-1">
                            {orderedGroups.map((group, index) => {
                                const latestStory: StoryItem | undefined = group.stories[group.stories.length - 1];
                                const active = index === groupIndex;

                                return (
                                    <button
                                        key={group.author.id}
                                        type="button"
                                        onClick={() => goToGroup(index)}
                                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${active ? 'border-primary bg-primary/10' : 'border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`h-12 w-12 overflow-hidden rounded-full border-2 ${group.hasUnseen ? 'border-primary' : 'border-white/20'}`}>
                                            {group.author.avatarUrl ? (
                                                <img src={group.author.avatarUrl} alt={group.author.username} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-black/30 text-sm font-bold uppercase text-white">
                                                    {group.author.username[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-semibold text-white">{group.author.username}</div>
                                            <div className="truncate text-xs text-white/55">
                                                {latestStory ? timeAgo(latestStory.createdAt) : 'Reciente'}
                                            </div>
                                        </div>
                                        <div className={`h-2.5 w-2.5 rounded-full ${group.hasUnseen ? 'bg-primary' : 'bg-white/15'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
