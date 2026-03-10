import { StoriesService } from './stories.service';
export declare class StoriesController {
    private readonly storiesService;
    constructor(storiesService: StoriesService);
    getFeed(req: any): Promise<{
        groups: {
            author: any;
            stories: any[];
            latestAt: Date;
            hasUnseen: boolean;
        }[];
    }>;
    createStory(req: any, body: {
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
    markViewed(req: any, id: string): Promise<{
        success: boolean;
        viewed: boolean;
    }>;
    deleteStory(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
