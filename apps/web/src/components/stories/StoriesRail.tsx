import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { StoryComposerModal } from './StoryComposerModal';
import { StoryViewerModal } from './StoryViewerModal';
import type { StoryAuthor, StoryGroup, StoryItem } from './storyTypes';

function buildOwnGroup(story: StoryItem, currentUser: StoryAuthor) {
    return {
        author: currentUser,
        stories: [{ ...story, author: currentUser, viewedByMe: true }],
        latestAt: story.createdAt,
        hasUnseen: false,
    } satisfies StoryGroup;
}

export function StoriesRail() {
    const currentUser = useAuthStore((state) => state.user);
    const [groups, setGroups] = useState<StoryGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [composerOpen, setComposerOpen] = useState(false);
    const [viewerGroupIndex, setViewerGroupIndex] = useState<number | null>(null);

    useEffect(() => {
        const loadStories = async () => {
            setIsLoading(true);
            try {
                const res = await apiFetch('/stories/feed');
                if (!res.ok) throw new Error();
                const data = await res.json();
                setGroups(Array.isArray(data?.groups) ? data.groups : []);
            } catch {
                setGroups([]);
            } finally {
                setIsLoading(false);
            }
        };

        void loadStories();
    }, []);

    const currentUserStory = useMemo(() => {
        if (!currentUser) return null;
        return groups.find((group) => group.author.id === currentUser.id) || null;
    }, [currentUser, groups]);

    const handleStoryCreated = (story: StoryItem) => {
        if (!currentUser) return;

        setGroups((previous) => {
            const existingIndex = previous.findIndex((group) => group.author.id === currentUser.id);

            if (existingIndex === -1) {
                return [buildOwnGroup(story, currentUser), ...previous];
            }

            const next = [...previous];
            const currentGroup = next[existingIndex];
            next[existingIndex] = {
                ...currentGroup,
                author: currentGroup.author || currentUser,
                stories: [...currentGroup.stories, { ...story, author: currentGroup.author || currentUser, viewedByMe: true }],
                latestAt: story.createdAt,
                hasUnseen: false,
            };

            if (existingIndex > 0) {
                const [ownGroup] = next.splice(existingIndex, 1);
                next.unshift(ownGroup);
            }

            return next;
        });
    };

    return (
        <>
            <div className="space-y-3">

                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        type="button"
                        className="group flex flex-shrink-0 flex-col items-center gap-2"
                        onClick={() => {
                            if (currentUserStory && currentUser) {
                                const ownIndex = groups.findIndex((group) => group.author.id === currentUser.id);
                                setViewerGroupIndex(ownIndex >= 0 ? ownIndex : null);
                                return;
                            }
                            setComposerOpen(true);
                        }}
                    >
                        <div className={`relative h-20 w-20 rounded-full p-[3px] ${currentUserStory ? 'bg-gradient-to-br from-primary via-emerald-300 to-teal-400' : 'border-2 border-dashed border-primary/60 bg-primary/8'}`}>
                            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-border/70 bg-card">
                                {currentUser?.avatarUrl && currentUserStory ? (
                                    <img src={currentUser.avatarUrl} alt={currentUser.username} className="h-full w-full object-cover" />
                                ) : (
                                    <Plus className="h-7 w-7 text-primary" />
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setComposerOpen(true);
                                }}
                                className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border border-background/90 bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition-transform hover:scale-105"
                                aria-label="Crear historia"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        <span className="w-20 truncate text-center text-[11px] font-medium text-foreground/75 group-hover:text-foreground">
                            {currentUserStory ? 'Tu historia' : 'Agregar'}
                        </span>
                    </button>

                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                            <div key={`story-skeleton-${index}`} className="flex flex-shrink-0 flex-col items-center gap-2">
                                <div className="h-20 w-20 animate-pulse rounded-full bg-muted/80" />
                                <div className="h-3 w-14 animate-pulse rounded-full bg-muted/80" />
                            </div>
                        ))
                    ) : (
                        groups
                            .filter((group) => group.author.id !== currentUser?.id)
                            .map((group) => {
                                const index = groups.findIndex((entry) => entry.author.id === group.author.id);
                                const latestStory = group.stories[group.stories.length - 1];

                                return (
                                    <button
                                        key={group.author.id}
                                        type="button"
                                        className="group flex flex-shrink-0 flex-col items-center gap-2"
                                        onClick={() => setViewerGroupIndex(index)}
                                    >
                                        <div className={`h-20 w-20 rounded-full p-[3px] ${group.hasUnseen ? 'bg-gradient-to-br from-primary via-emerald-300 to-sky-400' : 'bg-border/70'
                                            }`}>
                                            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-background bg-card">
                                                {group.author.avatarUrl ? (
                                                    <img src={group.author.avatarUrl} alt={group.author.username} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-xl font-bold uppercase text-foreground">{group.author.username[0]}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="w-20 truncate text-center text-[11px] font-medium text-foreground/75 group-hover:text-foreground">
                                            {group.author.username}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/70">
                                            {latestStory ? new Date(latestStory.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </button>
                                );
                            })
                    )}

                    {!isLoading && groups.length === 0 ? (
                        <div className="flex min-w-[240px] items-center justify-between rounded-3xl border border-dashed border-border/70 bg-background/30 px-5 py-4">
                            <div>
                                <div className="text-sm font-medium">Todavia no hay historias</div>
                                <div className="text-xs text-muted-foreground">Subi la primera y dale vida al inicio.</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setComposerOpen(true)}
                                className="rounded-full bg-primary/10 p-3 text-primary"
                                aria-label="Crear primera historia"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <StoryComposerModal
                open={composerOpen}
                onOpenChange={setComposerOpen}
                onCreated={handleStoryCreated}
                currentUser={currentUser ? {
                    id: currentUser.id,
                    username: currentUser.username,
                    avatarUrl: currentUser.avatarUrl,
                    isVerified: currentUser.isVerified,
                    bio: currentUser.bio,
                    title: (currentUser as any).title,
                } : null}
            />

            <StoryViewerModal
                groups={groups}
                activeGroupIndex={viewerGroupIndex}
                currentUserId={currentUser?.id}
                onClose={() => setViewerGroupIndex(null)}
                onGroupsChange={setGroups}
            />
        </>
    );
}
