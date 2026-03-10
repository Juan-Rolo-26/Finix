import { PrismaService } from '../prisma.service';
export declare class StoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    private pruneExpiredStories;
    private buildStoryInclude;
    private serializeStory;
    createStory(userId: string, payload: {
        content?: string;
        mediaUrl?: string;
        background?: string;
        textColor?: string;
    }): Promise<{
        id: any;
        authorId: any;
        content: any;
        mediaUrl: any;
        background: any;
        textColor: any;
        createdAt: any;
        expiresAt: any;
        author: any;
        viewedByMe: boolean;
        viewsCount: any;
    }>;
    getFeed(userId: string): Promise<{
        groups: {
            author: any;
            stories: any[];
            latestAt: Date;
            hasUnseen: boolean;
        }[];
    }>;
    markViewed(storyId: string, userId: string): Promise<{
        success: boolean;
        viewed: boolean;
    }>;
    deleteStory(storyId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
