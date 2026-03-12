import { PrismaService } from '../prisma.service';
import { AccessControlService } from '../access/access-control.service';
import { StripeService } from '../stripe/stripe.service';
import { CreateCommunityDto, CreateCommunityPostDto, CreateCommunityResourceDto, UpdateCommunityDto } from './dto/create-community.dto';
export declare class CommunitiesService {
    private readonly prisma;
    private readonly accessControlService;
    private readonly stripeService;
    constructor(prisma: PrismaService, accessControlService: AccessControlService, stripeService: StripeService);
    create(userId: string, dto: CreateCommunityDto): Promise<{
        _count: {
            posts: number;
            members: number;
            payments: number;
            resources: number;
        };
    } & {
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        price: import("@prisma/client/runtime/library").Decimal;
        description: string;
        creatorId: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
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
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        price: import("@prisma/client/runtime/library").Decimal;
        description: string;
        creatorId: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
        billingType: string;
        maxMembers: number | null;
    })[]>;
    findOne(id: string, userId?: string): Promise<{
        isMember: boolean;
        hasPaidAccess: boolean;
        membership: {
            id: string;
            role: string;
            subscriptionStatus: string;
            communityId: string;
            userId: string;
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
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        price: import("@prisma/client/runtime/library").Decimal;
        description: string;
        creatorId: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
        billingType: string;
        maxMembers: number | null;
    }>;
    joinFree(userId: string, communityId: string): Promise<{
        id: string;
        role: string;
        subscriptionStatus: string;
        communityId: string;
        userId: string;
        paymentStatus: string | null;
        stripePaymentId: string | null;
        stripeSubscriptionId: string | null;
        expiresAt: Date | null;
        joinedAt: Date;
    }>;
    createSubscriptionSession(userId: string, communityId: string): Promise<{
        url: string;
        sessionId: string;
    }>;
    getMyCommunities(userId: string): Promise<({
        _count: {
            posts: number;
            members: number;
            payments: number;
            resources: number;
        };
    } & {
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        price: import("@prisma/client/runtime/library").Decimal;
        description: string;
        creatorId: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
        billingType: string;
        maxMembers: number | null;
    })[]>;
    getCreatorStats(userId: string): Promise<{
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
    getCommunityMembers(userId: string, communityId: string): Promise<({
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
        communityId: string;
        userId: string;
        paymentStatus: string | null;
        stripePaymentId: string | null;
        stripeSubscriptionId: string | null;
        expiresAt: Date | null;
        joinedAt: Date;
    })[]>;
    updatePricing(userId: string, communityId: string, dto: UpdateCommunityDto): Promise<{
        id: string;
        bannerUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        price: import("@prisma/client/runtime/library").Decimal;
        description: string;
        creatorId: string;
        category: string;
        imageUrl: string | null;
        isPaid: boolean;
        billingType: string;
        maxMembers: number | null;
    }>;
    removeMember(userId: string, communityId: string, memberUserId: string): Promise<{
        ok: boolean;
    }>;
    listPosts(communityId: string, userId?: string): Promise<({
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
    createPost(userId: string, communityId: string, dto: CreateCommunityPostDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        communityId: string;
        mediaUrl: string | null;
        isPublic: boolean;
    }>;
    listResources(communityId: string, userId?: string): Promise<({
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
    createResource(userId: string, communityId: string, dto: CreateCommunityResourceDto): Promise<{
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
    getCommunityStats(communityId: string, userId?: string): Promise<{
        communityId: string;
        isPaid: boolean;
        hasPaidAccess: boolean;
        membersCount: number;
        activeMembersCount: number;
        paymentsCount: number;
        monthlyRevenue: number;
    }>;
    private assertCreatorOwnership;
    private resolveCommunityAccess;
    private isMembershipActive;
    private round;
}
