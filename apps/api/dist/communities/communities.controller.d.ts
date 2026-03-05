import { CommunitiesService } from './communities.service';
import { CreateCommunityDto, CreateCommunityPostDto, CreateCommunityResourceDto, UpdateCommunityDto } from './dto/create-community.dto';
export declare class CommunitiesController {
    private readonly communitiesService;
    constructor(communitiesService: CommunitiesService);
    create(req: any, createCommunityDto: CreateCommunityDto): Promise<{
        _count: {
            posts: number;
            members: number;
            payments: number;
            resources: number;
        };
    } & {
        name: string;
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        description: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
        price: import("@prisma/client/runtime/library").Decimal;
        billingType: string;
        maxMembers: number | null;
    }>;
    findAll(query: any): Promise<({
        _count: {
            posts: number;
            members: number;
            resources: number;
        };
        creator: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
    } & {
        name: string;
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        description: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
        price: import("@prisma/client/runtime/library").Decimal;
        billingType: string;
        maxMembers: number | null;
    })[]>;
    myCommunities(req: any): Promise<({
        _count: {
            posts: number;
            members: number;
            payments: number;
            resources: number;
        };
    } & {
        name: string;
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        description: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
        price: import("@prisma/client/runtime/library").Decimal;
        billingType: string;
        maxMembers: number | null;
    })[]>;
    creatorStats(req: any): Promise<{
        activeMembers: number;
        monthlyIncome: number;
        totalIncome: number;
        growthPercent: number;
        churnRate: number;
        communities: {
            communityId: string;
            communityName: string;
            income: number;
            members: number;
        }[];
    }>;
    listPosts(id: string, req: any): Promise<({
        author: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        communityId: string;
        mediaUrl: string | null;
        isPublic: boolean;
    })[]>;
    createPost(id: string, req: any, dto: CreateCommunityPostDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        communityId: string;
        mediaUrl: string | null;
        isPublic: boolean;
    }>;
    listResources(id: string, req: any): Promise<({
        author: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string | null;
        description: string | null;
        communityId: string;
        isPublic: boolean;
        resourceUrl: string;
    })[]>;
    createResource(id: string, req: any, dto: CreateCommunityResourceDto): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string | null;
        description: string | null;
        communityId: string;
        isPublic: boolean;
        resourceUrl: string;
    }>;
    getCommunityStats(id: string, req: any): Promise<{
        communityId: string;
        isPaid: boolean;
        hasPaidAccess: boolean;
        membersCount: number;
        activeMembersCount: number;
        paymentsCount: number;
        monthlyRevenue: number;
    }>;
    findOne(id: string, req: any): Promise<{
        isMember: boolean;
        hasPaidAccess: boolean;
        membership: {
            id: string;
            role: string;
            subscriptionStatus: string;
            userId: string;
            communityId: string;
            paymentStatus: string | null;
            stripePaymentId: string | null;
            stripeSubscriptionId: string | null;
            expiresAt: Date | null;
            joinedAt: Date;
        };
        requiresUpgrade: boolean;
        _count: {
            posts: number;
            members: number;
            resources: number;
        };
        creator: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
            plan: string;
        };
        name: string;
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        description: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
        price: import("@prisma/client/runtime/library").Decimal;
        billingType: string;
        maxMembers: number | null;
    }>;
    join(id: string, req: any): Promise<{
        id: string;
        role: string;
        subscriptionStatus: string;
        userId: string;
        communityId: string;
        paymentStatus: string | null;
        stripePaymentId: string | null;
        stripeSubscriptionId: string | null;
        expiresAt: Date | null;
        joinedAt: Date;
    }>;
    subscribe(id: string, req: any): Promise<{
        url: string;
        sessionId: string;
    }>;
    checkPaidAccess(): {
        access: boolean;
    };
    members(id: string, req: any): Promise<({
        user: {
            id: string;
            email: string;
            username: string;
            avatarUrl: string;
            plan: string;
        };
    } & {
        id: string;
        role: string;
        subscriptionStatus: string;
        userId: string;
        communityId: string;
        paymentStatus: string | null;
        stripePaymentId: string | null;
        stripeSubscriptionId: string | null;
        expiresAt: Date | null;
        joinedAt: Date;
    })[]>;
    updatePricing(id: string, req: any, dto: UpdateCommunityDto): Promise<{
        name: string;
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        description: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
        price: import("@prisma/client/runtime/library").Decimal;
        billingType: string;
        maxMembers: number | null;
    }>;
    removeMember(id: string, memberUserId: string, req: any): Promise<{
        ok: boolean;
    }>;
}
