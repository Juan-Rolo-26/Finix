export type MessageAttachmentType = 'image' | 'post' | 'chart';

export interface MessageAttachmentMeta {
    originalName?: string;
    size?: number;
    symbol?: string;
    interval?: string;
    title?: string;
    analysisType?: string;
    riskLevel?: string;
    [key: string]: unknown;
}

export interface SharedPostPreviewAuthor {
    id: string;
    username: string;
    avatarUrl?: string;
    isVerified?: boolean;
}

export interface SharedPostPreviewMedia {
    id: string;
    url: string;
    mediaType: 'image' | 'video';
    order: number;
}

export interface SharedPostPreview {
    id: string;
    content: string;
    type: 'post' | 'image' | 'reel' | 'chart';
    assetSymbol?: string | null;
    analysisType?: string | null;
    riskLevel?: string | null;
    createdAt: string;
    author: SharedPostPreviewAuthor;
    media: SharedPostPreviewMedia[];
}

export interface ComposerAttachment {
    type: MessageAttachmentType;
    url?: string;
    postId?: string;
    meta?: MessageAttachmentMeta | null;
    sharedPost?: SharedPostPreview | null;
}
