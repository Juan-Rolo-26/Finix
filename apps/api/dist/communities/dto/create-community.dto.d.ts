export declare class CreateCommunityDto {
    name: string;
    description: string;
    category: string;
    isPaid: boolean;
    price?: number;
    billingType?: string;
    imageUrl?: string;
    bannerUrl?: string;
    maxMembers?: number;
}
export declare class UpdateCommunityDto {
    name?: string;
    description?: string;
    category?: string;
    isPaid?: boolean;
    price?: number;
    imageUrl?: string;
    billingType?: string;
    maxMembers?: number;
}
export declare class CreateCommunityPostDto {
    content: string;
    mediaUrl?: string;
    isPublic?: boolean;
}
export declare class CreateCommunityResourceDto {
    title: string;
    description?: string;
    resourceUrl: string;
    isPublic?: boolean;
}
