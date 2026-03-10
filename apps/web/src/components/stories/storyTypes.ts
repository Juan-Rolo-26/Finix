export interface StoryAuthor {
    id: string;
    username: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
    bio?: string | null;
    title?: string | null;
}

export interface StoryItem {
    id: string;
    authorId: string;
    content?: string | null;
    mediaUrl?: string | null;
    background?: string | null;
    textColor?: string | null;
    createdAt: string;
    expiresAt: string;
    viewsCount: number;
    viewedByMe: boolean;
    author: StoryAuthor;
}

export interface StoryGroup {
    author: StoryAuthor;
    stories: StoryItem[];
    latestAt: string;
    hasUnseen: boolean;
}
