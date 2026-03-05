import { Request } from 'express';
import { StripeService } from './stripe.service';
export declare class StripeController {
    private readonly stripeService;
    constructor(stripeService: StripeService);
    handleWebhook(signature: string | undefined, req: Request & {
        body: Buffer;
    }): Promise<{
        received: boolean;
        duplicate: boolean;
    } | {
        received: boolean;
        duplicate?: undefined;
    }>;
    createProSubscription(req: any): Promise<{
        url: string;
        sessionId: string;
    }>;
    cancelProSubscription(req: any): Promise<{
        message: string;
        subscription: {
            id: string;
            status: string;
            endDate: Date;
            cancelAtPeriodEnd: boolean;
        };
    }>;
    createCommunityPayment(req: any, communityId: string): Promise<{
        url: string;
        sessionId: string;
    }>;
    listMyInvoices(req: any): Promise<{
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
    }[]>;
}
