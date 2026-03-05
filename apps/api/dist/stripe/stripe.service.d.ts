import { PrismaService } from '../prisma.service';
import Stripe from 'stripe';
export declare class StripeService {
    private readonly prisma;
    private readonly logger;
    private readonly stripeSecretKey;
    private readonly stripe;
    private readonly frontendUrl;
    constructor(prisma: PrismaService);
    createSubscription(userId: string, planType: 'pro_investor' | 'pro_creator'): Promise<{
        url: string;
        sessionId: string;
    }>;
    createBillingPortal(userId: string): Promise<{
        url: string;
    }>;
    cancelSubscription(userId: string): Promise<{
        message: string;
        subscription: {
            id: string;
            status: string;
            endDate: Date;
            cancelAtPeriodEnd: boolean;
        };
    }>;
    createCommunityPayment(userId: string, communityId: string): Promise<{
        url: string;
        sessionId: string;
    }>;
    listInvoices(userId: string): Promise<{
        id: string;
        status: Stripe.Invoice.Status;
        amountPaid: number;
        amountDue: number;
        currency: string;
        createdAt: string;
        periodStart: string;
        periodEnd: string;
        invoicePdf: string;
        hostedInvoiceUrl: string;
    }[]>;
    handleWebhook(signature: string | undefined, rawBody: Buffer): Promise<{
        received: boolean;
        duplicate: boolean;
    } | {
        received: boolean;
        duplicate?: undefined;
    }>;
    private processEvent;
    private handleCustomerSubscriptionEvent;
    private handleInvoicePaymentSucceeded;
    private handleInvoicePaymentFailed;
    private activateCommunityMembership;
    private getOrCreateCustomer;
    private getPlanPriceId;
    private getCommissionRate;
    private getPlanMonthlyPrice;
    private upsertLocalSubscription;
    private updateUserPlanFromSubscription;
    private logPlanChange;
    private normalizePaidPlan;
    private mapSubscriptionStatus;
    private mapCommunityMembershipStatus;
    private getSubscriptionPeriodEnd;
    private getInvoiceSubscriptionId;
    private toMoney;
    private roundToCurrency;
    private asString;
    private ensureStripeConfigured;
}
