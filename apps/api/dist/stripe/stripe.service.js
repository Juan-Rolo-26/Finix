"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const stripe_1 = require("stripe");
const plan_permissions_1 = require("../access/plan-permissions");
const DEFAULT_COMMISSION_RATE = 0.10;
const DEFAULT_PLAN_PRICES = {
    pro_investor: 9,
    pro_creator: 19,
};
let StripeService = StripeService_1 = class StripeService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StripeService_1.name);
        this.stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
        this.stripe = new stripe_1.default(this.stripeSecretKey || 'sk_test_placeholder', {
            apiVersion: '2026-01-28.clover',
        });
        this.frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    }
    async createSubscription(userId, planType) {
        this.ensureStripeConfigured();
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                plan: true,
                subscriptionStatus: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const normalizedPlan = (0, plan_permissions_1.normalizePlan)(user.plan);
        const effectivePlan = (0, plan_permissions_1.hasActivePaidSubscription)(normalizedPlan, user.subscriptionStatus)
            ? normalizedPlan
            : 'free';
        if (effectivePlan === planType) {
            throw new common_1.BadRequestException('Ya tienes este plan activo.');
        }
        const customerId = await this.getOrCreateCustomer(user.id, user.email);
        const priceId = this.getPlanPriceId(planType);
        const planPrice = await this.getPlanMonthlyPrice(planType);
        const planLabel = planType === 'pro_creator' ? 'Pro Creator' : 'Pro Investor';
        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: priceId
                ? [{ price: priceId, quantity: 1 }]
                : [{
                        price_data: {
                            currency: 'usd',
                            unit_amount: Math.round(planPrice * 100),
                            recurring: { interval: 'month' },
                            product_data: {
                                name: `Finix ${planLabel}`,
                                description: `Plan ${planLabel} mensual`,
                            },
                        },
                        quantity: 1,
                    }],
            metadata: {
                type: 'plan_subscription',
                planType,
                userId: user.id,
            },
            subscription_data: {
                metadata: {
                    type: 'plan_subscription',
                    planType,
                    userId: user.id,
                },
            },
            success_url: `${this.frontendUrl}/payments?checkout=success`,
            cancel_url: `${this.frontendUrl}/payments?checkout=cancel`,
        });
        return {
            url: session.url,
            sessionId: session.id,
        };
    }
    async createBillingPortal(userId) {
        this.ensureStripeConfigured();
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                stripeCustomerId: true,
            },
        });
        if (!user?.stripeCustomerId) {
            throw new common_1.BadRequestException('No existe cliente de Stripe asociado.');
        }
        const session = await this.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${this.frontendUrl}/payments`,
        });
        return {
            url: session.url,
        };
    }
    async cancelSubscription(userId) {
        this.ensureStripeConfigured();
        const activeSubscription = await this.prisma.subscription.findFirst({
            where: {
                userId,
                planType: { in: ['pro_investor', 'pro_creator'] },
                status: { in: ['ACTIVE', 'PAST_DUE'] },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!activeSubscription?.stripeSubscriptionId) {
            throw new common_1.NotFoundException('No se encontró una suscripción activa en Stripe.');
        }
        await this.stripe.subscriptions.update(activeSubscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });
        const updated = await this.prisma.subscription.update({
            where: { id: activeSubscription.id },
            data: {
                cancelAtPeriodEnd: true,
            },
            select: {
                id: true,
                status: true,
                endDate: true,
                cancelAtPeriodEnd: true,
            },
        });
        return {
            message: 'La suscripción fue marcada para cancelar al final del período actual.',
            subscription: updated,
        };
    }
    async createCommunityPayment(userId, communityId) {
        this.ensureStripeConfigured();
        const [user, community] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    plan: true,
                    subscriptionStatus: true,
                    stripeCustomerId: true,
                },
            }),
            this.prisma.community.findUnique({
                where: { id: communityId },
                select: {
                    id: true,
                    name: true,
                    creatorId: true,
                    isPaid: true,
                    price: true,
                    billingType: true,
                    maxMembers: true,
                },
            }),
        ]);
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (!community) {
            throw new common_1.NotFoundException('Comunidad no encontrada');
        }
        if (!community.isPaid) {
            throw new common_1.BadRequestException('La comunidad es gratuita, usa el endpoint de join.');
        }
        if (community.maxMembers) {
            const activeMembers = await this.prisma.communityMember.count({
                where: {
                    communityId,
                    subscriptionStatus: 'ACTIVE',
                },
            });
            if (activeMembers >= community.maxMembers) {
                throw new common_1.BadRequestException('La comunidad alcanzó su límite de miembros.');
            }
        }
        const currentMembership = await this.prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId,
                    userId,
                },
            },
            select: {
                subscriptionStatus: true,
                paymentStatus: true,
                expiresAt: true,
            },
        });
        if (currentMembership?.subscriptionStatus === 'ACTIVE'
            && (currentMembership.paymentStatus === 'SUCCEEDED' || !currentMembership.paymentStatus)
            && (!currentMembership.expiresAt || currentMembership.expiresAt.getTime() > Date.now())) {
            throw new common_1.BadRequestException('Ya tienes una membresía activa en esta comunidad.');
        }
        const customerId = await this.getOrCreateCustomer(user.id, user.email);
        const interval = community.billingType === 'yearly' ? 'year' : 'month';
        const unitAmount = Math.round(Number(community.price) * 100);
        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                    price_data: {
                        currency: 'usd',
                        unit_amount: unitAmount,
                        recurring: { interval },
                        product_data: {
                            name: `Comunidad Finix: ${community.name}`,
                            metadata: {
                                communityId: community.id,
                            },
                        },
                    },
                    quantity: 1,
                }],
            metadata: {
                type: 'community_subscription',
                userId: user.id,
                communityId: community.id,
                creatorId: community.creatorId,
            },
            subscription_data: {
                metadata: {
                    type: 'community_subscription',
                    userId: user.id,
                    communityId: community.id,
                    creatorId: community.creatorId,
                },
            },
            success_url: `${this.frontendUrl}/communities/${community.id}?checkout=success`,
            cancel_url: `${this.frontendUrl}/communities/${community.id}?checkout=cancel`,
        });
        return {
            url: session.url,
            sessionId: session.id,
        };
    }
    async listInvoices(userId) {
        this.ensureStripeConfigured();
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });
        if (!user?.stripeCustomerId) {
            return [];
        }
        const invoices = await this.stripe.invoices.list({
            customer: user.stripeCustomerId,
            limit: 25,
        });
        return invoices.data.map((invoice) => {
            const period = invoice.lines?.data?.[0]?.period;
            return {
                id: invoice.id,
                status: invoice.status,
                amountPaid: this.toMoney(invoice.amount_paid),
                amountDue: this.toMoney(invoice.amount_due),
                currency: invoice.currency?.toUpperCase(),
                createdAt: new Date(invoice.created * 1000).toISOString(),
                periodStart: period?.start ? new Date(period.start * 1000).toISOString() : null,
                periodEnd: period?.end ? new Date(period.end * 1000).toISOString() : null,
                invoicePdf: invoice.invoice_pdf,
                hostedInvoiceUrl: invoice.hosted_invoice_url,
            };
        });
    }
    async handleWebhook(signature, rawBody) {
        this.ensureStripeConfigured();
        if (!signature) {
            throw new common_1.BadRequestException('Falta stripe-signature');
        }
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new common_1.BadRequestException('STRIPE_WEBHOOK_SECRET no está configurado');
        }
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        }
        catch (error) {
            this.logger.error(`Webhook signature invalid: ${error?.message || 'Unknown error'}`);
            throw new common_1.BadRequestException('Firma de webhook inválida');
        }
        const existing = await this.prisma.paymentLog.findUnique({
            where: { stripeEventId: event.id },
            select: { id: true, status: true },
        });
        if (existing?.status === 'PROCESSED') {
            return { received: true, duplicate: true };
        }
        await this.prisma.paymentLog.upsert({
            where: { stripeEventId: event.id },
            create: {
                stripeEventId: event.id,
                type: event.type,
                status: 'RECEIVED',
                payload: JSON.stringify(event),
            },
            update: {
                type: event.type,
                status: 'RECEIVED',
                payload: JSON.stringify(event),
            },
        });
        try {
            await this.processEvent(event);
            await this.prisma.paymentLog.update({
                where: { stripeEventId: event.id },
                data: {
                    status: 'PROCESSED',
                    message: null,
                },
            });
            return { received: true };
        }
        catch (error) {
            await this.prisma.paymentLog.update({
                where: { stripeEventId: event.id },
                data: {
                    status: 'FAILED',
                    message: error?.message || 'Unhandled webhook error',
                },
            });
            throw error;
        }
    }
    async processEvent(event) {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await this.handleCustomerSubscriptionEvent(event.data.object, event.type);
                break;
            case 'invoice.payment_succeeded':
            case 'invoice.paid':
                await this.handleInvoicePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event.data.object);
                break;
            default:
                this.logger.debug(`Webhook event ignored: ${event.type}`);
        }
    }
    async handleCustomerSubscriptionEvent(subscription, eventType) {
        const metadata = subscription.metadata || {};
        const type = metadata.type;
        if (type === 'plan_subscription') {
            const userId = metadata.userId;
            const planType = this.normalizePaidPlan(metadata.planType);
            if (!userId || !planType) {
                return;
            }
            const status = eventType === 'customer.subscription.deleted'
                ? 'CANCELED'
                : this.mapSubscriptionStatus(subscription.status);
            const endDate = this.getSubscriptionPeriodEnd(subscription);
            await this.upsertLocalSubscription({
                userId,
                planType,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: this.asString(subscription.customer),
                status,
                endDate,
                cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            });
            await this.updateUserPlanFromSubscription(userId, planType, status);
            return;
        }
        if (type === 'community_subscription') {
            const membershipStatus = eventType === 'customer.subscription.deleted'
                ? 'CANCELED'
                : this.mapCommunityMembershipStatus(subscription.status);
            await this.prisma.communityMember.updateMany({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    subscriptionStatus: membershipStatus,
                    paymentStatus: membershipStatus === 'ACTIVE' ? 'SUCCEEDED' : 'FAILED',
                    expiresAt: this.getSubscriptionPeriodEnd(subscription),
                },
            });
        }
    }
    async handleInvoicePaymentSucceeded(invoice) {
        const stripeSubscriptionId = this.getInvoiceSubscriptionId(invoice);
        if (!stripeSubscriptionId) {
            return;
        }
        const stripeSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
        const metadata = stripeSubscription.metadata || {};
        const type = metadata.type;
        if (type === 'plan_subscription') {
            const userId = metadata.userId;
            const planType = this.normalizePaidPlan(metadata.planType);
            if (!userId || !planType) {
                return;
            }
            const status = this.mapSubscriptionStatus(stripeSubscription.status);
            const endDate = this.getSubscriptionPeriodEnd(stripeSubscription);
            const localSubscription = await this.upsertLocalSubscription({
                userId,
                planType,
                stripeSubscriptionId: stripeSubscription.id,
                stripeCustomerId: this.asString(stripeSubscription.customer),
                status,
                endDate,
                cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
            });
            await this.updateUserPlanFromSubscription(userId, planType, status);
            const totalAmount = this.toMoney(invoice.amount_paid || 0);
            if (totalAmount > 0) {
                await this.prisma.finixRevenue.create({
                    data: {
                        type: 'PLAN',
                        userId,
                        subscriptionId: localSubscription.id,
                        totalAmount,
                        commissionAmount: totalAmount,
                        creatorAmount: 0,
                        status: 'PAID_OUT',
                    },
                });
            }
            return;
        }
        if (type === 'community_subscription') {
            const userId = metadata.userId;
            const communityId = metadata.communityId;
            const creatorId = metadata.creatorId;
            if (!userId || !communityId || !creatorId) {
                return;
            }
            const stripePaymentId = invoice.id;
            const amount = this.toMoney(invoice.amount_paid || 0);
            const billingType = stripeSubscription.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';
            const endDate = this.getSubscriptionPeriodEnd(stripeSubscription);
            await this.activateCommunityMembership({
                userId,
                communityId,
                creatorId,
                stripeSubscriptionId: stripeSubscription.id,
                stripePaymentId,
                amount,
                billingType,
                expiresAt: endDate,
            });
        }
    }
    async handleInvoicePaymentFailed(invoice) {
        const stripeSubscriptionId = this.getInvoiceSubscriptionId(invoice);
        if (!stripeSubscriptionId) {
            return;
        }
        const stripeSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
        const metadata = stripeSubscription.metadata || {};
        const type = metadata.type;
        if (type === 'plan_subscription') {
            const userId = metadata.userId;
            const planType = this.normalizePaidPlan(metadata.planType);
            if (!userId || !planType) {
                return;
            }
            await this.upsertLocalSubscription({
                userId,
                planType,
                stripeSubscriptionId: stripeSubscription.id,
                stripeCustomerId: this.asString(stripeSubscription.customer),
                status: 'PAST_DUE',
                endDate: this.getSubscriptionPeriodEnd(stripeSubscription),
                cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
            });
            await this.updateUserPlanFromSubscription(userId, planType, 'PAST_DUE');
            return;
        }
        if (type === 'community_subscription') {
            await this.prisma.communityMember.updateMany({
                where: { stripeSubscriptionId },
                data: {
                    subscriptionStatus: 'PAST_DUE',
                    paymentStatus: 'FAILED',
                },
            });
        }
    }
    async activateCommunityMembership(params) {
        await this.prisma.communityMember.upsert({
            where: {
                communityId_userId: {
                    communityId: params.communityId,
                    userId: params.userId,
                },
            },
            create: {
                communityId: params.communityId,
                userId: params.userId,
                role: 'MEMBER',
                subscriptionStatus: 'ACTIVE',
                paymentStatus: 'SUCCEEDED',
                stripePaymentId: params.stripePaymentId,
                stripeSubscriptionId: params.stripeSubscriptionId,
                expiresAt: params.expiresAt,
            },
            update: {
                subscriptionStatus: 'ACTIVE',
                paymentStatus: 'SUCCEEDED',
                stripePaymentId: params.stripePaymentId,
                stripeSubscriptionId: params.stripeSubscriptionId,
                expiresAt: params.expiresAt,
            },
        });
        if (params.amount <= 0) {
            return;
        }
        const existingPayment = await this.prisma.communityPayment.findUnique({
            where: { stripePaymentId: params.stripePaymentId },
            select: { id: true },
        });
        if (existingPayment) {
            return;
        }
        const commissionRate = await this.getCommissionRate();
        const commissionAmount = this.roundToCurrency(params.amount * commissionRate);
        const creatorAmount = this.roundToCurrency(params.amount - commissionAmount);
        const payment = await this.prisma.communityPayment.create({
            data: {
                communityId: params.communityId,
                userId: params.userId,
                creatorId: params.creatorId,
                amount: params.amount,
                commissionAmount,
                creatorAmount,
                stripePaymentId: params.stripePaymentId,
                status: 'SUCCEEDED',
                payoutStatus: 'PENDING',
                billingType: params.billingType === 'yearly' ? 'yearly' : 'monthly',
            },
        });
        await this.prisma.finixRevenue.create({
            data: {
                type: 'COMMUNITY',
                paymentId: payment.id,
                communityId: params.communityId,
                userId: params.userId,
                creatorId: params.creatorId,
                totalAmount: params.amount,
                commissionAmount,
                creatorAmount,
                status: 'PENDING',
            },
        });
        await this.prisma.creatorBalance.upsert({
            where: { creatorId: params.creatorId },
            create: {
                creatorId: params.creatorId,
                pendingBalance: creatorAmount,
                availableBalance: 0,
            },
            update: {
                pendingBalance: { increment: creatorAmount },
            },
        });
    }
    async getOrCreateCustomer(userId, email) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                stripeCustomerId: true,
            },
        });
        if (user?.stripeCustomerId) {
            return user.stripeCustomerId;
        }
        const customer = await this.stripe.customers.create({
            email,
            metadata: { userId },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id },
        });
        return customer.id;
    }
    getPlanPriceId(planType) {
        if (planType === 'pro_creator') {
            return process.env.STRIPE_PRO_CREATOR_PRICE_ID || '';
        }
        return process.env.STRIPE_PRO_INVESTOR_PRICE_ID || '';
    }
    async getCommissionRate() {
        const key = 'COMMUNITY_COMMISSION_RATE';
        const existing = await this.prisma.platformSetting.findUnique({
            where: { key },
            select: { value: true },
        });
        if (!existing) {
            await this.prisma.platformSetting.create({
                data: {
                    key,
                    value: String(DEFAULT_COMMISSION_RATE),
                    description: 'Comisión global de Finix para comunidades pagas.',
                },
            });
            return DEFAULT_COMMISSION_RATE;
        }
        const parsed = Number(existing.value);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
            return DEFAULT_COMMISSION_RATE;
        }
        return parsed;
    }
    async getPlanMonthlyPrice(planType) {
        const key = planType === 'pro_creator'
            ? 'PRO_CREATOR_MONTHLY_PRICE_USD'
            : 'PRO_INVESTOR_MONTHLY_PRICE_USD';
        const defaultPrice = DEFAULT_PLAN_PRICES[planType];
        const existing = await this.prisma.platformSetting.findUnique({
            where: { key },
            select: { value: true },
        });
        if (!existing) {
            await this.prisma.platformSetting.create({
                data: {
                    key,
                    value: String(defaultPrice),
                    description: `Precio mensual del plan ${planType} en USD.`,
                },
            });
            return defaultPrice;
        }
        const parsed = Number(existing.value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return defaultPrice;
        }
        return parsed;
    }
    async upsertLocalSubscription(params) {
        if (params.stripeSubscriptionId) {
            return this.prisma.subscription.upsert({
                where: { stripeSubscriptionId: params.stripeSubscriptionId },
                create: {
                    userId: params.userId,
                    stripeSubscriptionId: params.stripeSubscriptionId,
                    stripeCustomerId: params.stripeCustomerId,
                    status: params.status,
                    planType: params.planType,
                    endDate: params.endDate,
                    cancelAtPeriodEnd: params.cancelAtPeriodEnd,
                },
                update: {
                    userId: params.userId,
                    stripeCustomerId: params.stripeCustomerId,
                    status: params.status,
                    planType: params.planType,
                    endDate: params.endDate,
                    cancelAtPeriodEnd: params.cancelAtPeriodEnd,
                },
            });
        }
        return this.prisma.subscription.create({
            data: {
                userId: params.userId,
                stripeSubscriptionId: null,
                stripeCustomerId: params.stripeCustomerId,
                status: params.status,
                planType: params.planType,
                endDate: params.endDate,
                cancelAtPeriodEnd: params.cancelAtPeriodEnd,
            },
        });
    }
    async updateUserPlanFromSubscription(userId, planType, status) {
        const isActive = status === 'ACTIVE';
        if (isActive) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    plan: planType,
                    accountType: planType === 'pro_creator' ? 'creator' : 'investor',
                    subscriptionStatus: status,
                },
            });
            await this.logPlanChange(userId, planType, status);
            return;
        }
        const latestActive = await this.prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                planType: { in: ['pro_investor', 'pro_creator'] },
            },
            orderBy: { updatedAt: 'desc' },
            select: { planType: true },
        });
        if (latestActive?.planType) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    plan: latestActive.planType,
                    accountType: latestActive.planType === 'pro_creator' ? 'creator' : 'investor',
                    subscriptionStatus: 'ACTIVE',
                },
            });
            await this.logPlanChange(userId, latestActive.planType, 'ACTIVE');
            return;
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                plan: 'free',
                accountType: 'basic',
                subscriptionStatus: status,
            },
        });
        await this.logPlanChange(userId, 'free', status);
    }
    async logPlanChange(userId, plan, status) {
        await this.prisma.paymentLog.create({
            data: {
                userId,
                type: 'PLAN_UPDATED',
                status: 'INFO',
                message: `Plan actualizado a ${plan} con estado ${status}`,
            },
        }).catch(() => undefined);
    }
    normalizePaidPlan(planType) {
        const normalized = String(planType || '').toLowerCase();
        if (normalized === 'pro_creator') {
            return 'pro_creator';
        }
        if (normalized === 'pro_investor') {
            return 'pro_investor';
        }
        return null;
    }
    mapSubscriptionStatus(status) {
        if (!status)
            return 'INACTIVE';
        if (status === 'active' || status === 'trialing')
            return 'ACTIVE';
        if (status === 'past_due' || status === 'unpaid' || status === 'incomplete')
            return 'PAST_DUE';
        if (status === 'canceled')
            return 'CANCELED';
        if (status === 'incomplete_expired')
            return 'EXPIRED';
        return 'INACTIVE';
    }
    mapCommunityMembershipStatus(status) {
        if (!status)
            return 'EXPIRED';
        if (status === 'active' || status === 'trialing')
            return 'ACTIVE';
        if (status === 'past_due' || status === 'unpaid' || status === 'incomplete')
            return 'PAST_DUE';
        if (status === 'canceled')
            return 'CANCELED';
        return 'EXPIRED';
    }
    getSubscriptionPeriodEnd(subscription) {
        if (!subscription) {
            return null;
        }
        const periodEnds = subscription.items?.data
            ?.map((item) => item.current_period_end)
            .filter((value) => Number.isFinite(value));
        const maxPeriodEnd = periodEnds && periodEnds.length > 0
            ? Math.max(...periodEnds)
            : null;
        if (maxPeriodEnd) {
            return new Date(maxPeriodEnd * 1000);
        }
        if (subscription.canceled_at) {
            return new Date(subscription.canceled_at * 1000);
        }
        return null;
    }
    getInvoiceSubscriptionId(invoice) {
        const parentSubscription = invoice.parent?.subscription_details?.subscription;
        if (typeof parentSubscription === 'string') {
            return parentSubscription;
        }
        if (parentSubscription && typeof parentSubscription === 'object' && 'id' in parentSubscription) {
            return String(parentSubscription.id);
        }
        return null;
    }
    toMoney(amountInCents) {
        return this.roundToCurrency((amountInCents || 0) / 100);
    }
    roundToCurrency(value) {
        return Math.round(value * 100) / 100;
    }
    asString(value) {
        return typeof value === 'string' ? value : null;
    }
    ensureStripeConfigured() {
        const key = this.stripeSecretKey.trim();
        const looksLikeStripeKey = key.startsWith('sk_test_') || key.startsWith('sk_live_');
        const looksPlaceholder = key.includes('placeholder') || key.includes('xxx');
        if (!key || !looksLikeStripeKey || looksPlaceholder) {
            throw new common_1.BadRequestException('Stripe no está configurado correctamente en el servidor. Configura STRIPE_SECRET_KEY en apps/api/.env');
        }
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map