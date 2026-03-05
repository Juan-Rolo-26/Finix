import { PrismaService } from '../prisma.service';
import { AccessControlService } from '../access/access-control.service';
import { StripeService } from '../stripe/stripe.service';
export declare class BillingService {
    private readonly prisma;
    private readonly accessControlService;
    private readonly stripeService;
    constructor(prisma: PrismaService, accessControlService: AccessControlService, stripeService: StripeService);
    getPaymentOverview(userId: string): Promise<{
        currentPlan: string;
        subscriptionStatus: string;
        nextBillingDate: Date;
        cancelAtPeriodEnd: boolean;
        proPriceUsdMonthly: number;
        commissionRate: number;
        invoices: {
            id: string;
            status: import("stripe").Stripe.Invoice.Status;
            amountPaid: number;
            amountDue: number;
            currency: string;
            createdAt: string;
            periodStart: string;
            periodEnd: string;
            invoicePdf: string;
            hostedInvoiceUrl: string;
        }[];
        creator: any;
    }>;
    getPaymentHistory(userId: string): Promise<{
        invoices: {
            id: string;
            status: import("stripe").Stripe.Invoice.Status;
            amountPaid: number;
            amountDue: number;
            currency: string;
            createdAt: string;
            periodStart: string;
            periodEnd: string;
            invoicePdf: string;
            hostedInvoiceUrl: string;
        }[];
        communityPayments: {
            id: string;
            communityId: string;
            communityName: string;
            amount: number;
            status: string;
            billingType: string;
            createdAt: Date;
        }[];
    }>;
    cancelProSubscription(userId: string): Promise<{
        message: string;
        subscription: {
            id: string;
            status: string;
            endDate: Date;
            cancelAtPeriodEnd: boolean;
        };
    }>;
    getCreatorSummary(userId: string): Promise<{
        communitiesCount: number;
        activeMembers: number;
        totalRevenue: number;
        totalCommissionPaid: number;
        monthlyRevenue: number;
        monthlyGrowthPercent: number;
        earningsByCommunity: {
            communityId: string;
            communityName: string;
            revenue: number;
            commission: number;
            payments: number;
        }[];
    }>;
    settlePendingBalance(userId: string): Promise<{
        availableBalance: number;
        pendingBalance: number;
        movedAmount: number;
    }>;
    requestPayout(userId: string, amount: number): Promise<{
        payout: {
            id: string;
            amount: number;
            status: string;
            createdAt: Date;
        };
        balance: {
            availableBalance: number;
            pendingBalance: number;
        };
    }>;
    listPayouts(userId: string): Promise<{
        id: string;
        amount: number;
        status: string;
        stripePayoutId: string;
        createdAt: Date;
        processedAt: Date;
    }[]>;
    getAdminSettings(): Promise<Record<string, string>>;
    updateCommissionRate(rate: number): Promise<{
        key: string;
        value: number;
    }>;
    private getCommissionRate;
    private safeListInvoices;
    private round;
}
