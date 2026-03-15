export declare class CreateChannelDto {
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    type?: string;
    order?: number;
}
export declare class UpdateChannelDto {
    name?: string;
    description?: string;
    icon?: string;
    type?: string;
    order?: number;
}
export declare class CreateMessageDto {
    content: string;
    mediaUrl?: string;
}
export declare class CreatePostDto {
    content: string;
    title?: string;
    mediaUrl?: string;
}
export declare class CreateCommentDto {
    content: string;
}
export declare class CreateEventDto {
    title: string;
    description?: string;
    startsAt: string;
    endsAt?: string;
    link?: string;
}
export declare class CreateResourceDto {
    title: string;
    description?: string;
    url: string;
    mediaType?: string;
    thumbnailUrl?: string;
    duration?: string;
    category?: string;
    order?: number;
}
export declare class PinDto {
    pinned: boolean;
}
