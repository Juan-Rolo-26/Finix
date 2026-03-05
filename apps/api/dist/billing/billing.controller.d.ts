import { BillingService } from './billing.service';
import { PayoutRequestDto } from './dto/payout-request.dto';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    getOverview(req: any): Promise<{
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
    getHistory(req: any): Promise<{
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
    cancelSubscription(req: any): Promise<{
        message: string;
        subscription: {
            id: string;
            status: string;
            endDate: Date;
            cancelAtPeriodEnd: boolean;
        };
    }>;
    getCreatorSummary(req: any): Promise<{
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
    settlePendingBalance(req: any): Promise<{
        availableBalance: number;
        pendingBalance: number;
        movedAmount: number;
    }>;
    requestPayout(req: any, body: PayoutRequestDto): Promise<{
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
    listPayouts(req: any): Promise<{
        id: string;
        amount: number;
        status: string;
        stripePayoutId: string;
        createdAt: Date;
        processedAt: Date;
    }[]>;
    getAdminSettings(req: any): Promise<Record<string, string>>;
    updateCommission(req: any, body: {
        rate?: number;
    }): Promise<{
        key: string;
        value: number;
    }>;
    private assertAdmin;
}
