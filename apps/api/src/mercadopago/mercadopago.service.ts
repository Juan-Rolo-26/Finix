import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MercadoPagoService {
    private readonly logger = new Logger(MercadoPagoService.name);
    private readonly accessToken = process.env.MP_ACCESS_TOKEN || '';
    private readonly publicKey = process.env.MP_PUBLIC_KEY || '';
    private readonly frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    private readonly apiUrl = (process.env.API_URL || 'http://localhost:3010').replace(/\/$/, '');

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) {}

    public isConfigured(): boolean {
        return Boolean(this.accessToken && !this.accessToken.includes('...') && this.accessToken.length > 10);
    }

    public getProPrice(): number {
        return Number(process.env.MP_PRO_PRICE_ARS) || 8500;
    }

    public getCreatorPrice(): number {
        return Number(process.env.MP_CREATOR_PRICE_ARS) || 29900;
    }

    async cancelPreapproval(preapprovalId: string) {
        if (!this.isConfigured()) throw new BadRequestException('Mercado Pago no está configurado.');
        const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            this.logger.error('Error canceling Mercado Pago subscription:', data);
            throw new BadRequestException(data.message || 'Mercado Pago no pudo cancelar la renovación.');
        }
        return data;
    }

    async createPreference(userId: string, planType: 'pro' | 'creator', autoRenew = false) {
        if (!this.isConfigured()) {
            throw new BadRequestException(
                'Mercado Pago aún no está configurado. Por favor ingresá tu MP_ACCESS_TOKEN en el archivo .env del servidor.',
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, username: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const isPro = planType === 'pro';
        const plan = isPro ? 'PRO' : 'CREATOR';
        const existingPlan = await this.prisma.subscription.findFirst({
            where: {
                userId,
                planType: { in: isPro ? ['PRO', 'pro_investor'] : ['CREATOR', 'pro_creator'] },
                status: { in: ['ACTIVE', 'PENDING', 'PAST_DUE'] },
                OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
            },
        });
        if (existingPlan) {
            throw new BadRequestException(`Ya tenés un plan ${plan} activo o pendiente. Gestionálo desde Configuración.`);
        }

        const title = isPro ? 'Finix PRO - Membresía Mensual' : 'Finix Creador - Membresía Mensual';
        const price = isPro ? this.getProPrice() : this.getCreatorPrice();

        const externalReference = `${autoRenew ? 'FINIX_RECURRING' : 'FINIX_ONE_TIME'}:${user.id}:${plan}:${Date.now()}`;

        if (autoRenew) {
            const localSubscription = await this.prisma.subscription.create({
                data: { userId: user.id, planType: plan, status: 'PENDING', mercadoPagoExternalReference: externalReference },
            });
            try {
                const response = await fetch('https://api.mercadopago.com/preapproval', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        reason: `Finix ${plan} - renovación mensual`,
                        external_reference: externalReference,
                        payer_email: user.email,
                        auto_recurring: {
                            frequency: 1,
                            frequency_type: 'months',
                            transaction_amount: price,
                            currency_id: 'ARS',
                        },
                        back_url: `${this.frontendUrl}/pricing?status=pending`,
                        status: 'pending',
                    }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    this.logger.error('Error creating Mercado Pago subscription:', data);
                    await this.prisma.subscription.update({ where: { id: localSubscription.id }, data: { status: 'CANCELED' } });
                    throw new BadRequestException(data.message || 'Mercado Pago no pudo iniciar la renovación automática.');
                }

                await this.prisma.subscription.update({
                    where: { id: localSubscription.id },
                    data: { mercadoPagoPreapprovalId: String(data.id) },
                });
                return { id: data.id, init_point: data.init_point, autoRenew: true };
            } catch (error: any) {
                await this.prisma.subscription.updateMany({
                    where: { id: localSubscription.id, status: 'PENDING', mercadoPagoPreapprovalId: null },
                    data: { status: 'CANCELED' },
                }).catch(() => undefined);
                throw error;
            }
        }

        const preferencePayload = {
            items: [
                {
                    id: isPro ? 'finix_pro_monthly' : 'finix_creator_monthly',
                    title,
                    description: isPro
                        ? 'Acceso ilimitado a análisis fundamentales, cotizaciones en tiempo real y noticias financieras.'
                        : 'Acceso completo PRO + Creación de comunidades propias y herramientas de monetización.',
                    quantity: 1,
                    currency_id: 'ARS',
                    unit_price: price,
                },
            ],
            payer: {
                email: user.email,
                name: user.username,
            },
            back_urls: {
                success: `${this.frontendUrl}/pro?status=approved`,
                failure: `${this.frontendUrl}/pro?status=failure`,
                pending: `${this.frontendUrl}/pro?status=pending`,
            },
            auto_return: 'approved',
            external_reference: externalReference,
            notification_url: `${this.apiUrl}/api/mercadopago/webhook`,
            statement_descriptor: 'FINIX PRO',
            metadata: {
                user_id: user.id,
                plan,
                billing: 'ONE_TIME',
            },
        };

        try {
            const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferencePayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                this.logger.error('Error creating Mercado Pago preference:', errorData);
                throw new BadRequestException(
                    errorData.message || 'Error al comunicarse con Mercado Pago',
                );
            }

            const data = await response.json();
            return {
                id: data.id,
                init_point: data.init_point,
                sandbox_init_point: data.sandbox_init_point,
                publicKey: this.publicKey,
            };
        } catch (err: any) {
            this.logger.error('Mercado Pago preference error:', err);
            throw new BadRequestException(err.message || 'Error al generar checkout de Mercado Pago');
        }
    }

    async createCommunityPreference(userId: string, communityId: string, planId: string) {
        if (!this.isConfigured()) throw new BadRequestException('Mercado Pago no está configurado en Finix.');
        const community = await this.prisma.community.findUnique({ where: { id: communityId }, include: { plans: true, creator: { select: { email: true } } } });
        const plan = community?.plans.find(item => item.id === planId);
        const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, username: true } });
        if (!community || !plan || !buyer) throw new NotFoundException('Comunidad, plan o usuario no encontrado.');
        if (Number(plan.price) <= 0) throw new BadRequestException('Este plan no requiere pago.');

        const reference = `COMMUNITY:${community.id}:${plan.id}:${userId}:${Date.now()}`;
        const payload = {
            items: [{ id: plan.id, title: `${community.name} - ${plan.name}`, quantity: 1, currency_id: 'ARS', unit_price: Number(plan.price) }],
            payer: { email: buyer.email, name: buyer.username },
            external_reference: reference,
            marketplace_fee: Number(plan.price) * 0.05,
            back_urls: { success: `${this.frontendUrl}/comunidades/${community.slug || community.id}?payment=approved`, failure: `${this.frontendUrl}/comunidades/${community.slug || community.id}?payment=failure`, pending: `${this.frontendUrl}/comunidades/${community.slug || community.id}?payment=pending` },
            auto_return: 'approved',
            notification_url: `${this.apiUrl}/api/mercadopago/webhook`,
        };
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', { method: 'POST', headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new BadRequestException('Mercado Pago no pudo crear el checkout de la comunidad.');
        const data = await response.json();
        return { id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point, commissionRate: 0.05 };
    }

    async handleWebhook(body: any, query: any) {
        const topic = query?.topic || query?.type || body?.type || body?.topic;
        const paymentId = query?.id || query?.['data.id'] || body?.data?.id;

        this.logger.log(`Mercado Pago webhook received: topic=${topic}, paymentId=${paymentId}`);

        if ((topic === 'payment' || topic === 'merchant_order') && paymentId) {
            await this.processPayment(String(paymentId));
        }
        if (topic === 'subscription_preapproval' && paymentId) {
            await this.processPreapproval(String(paymentId));
        }

        return { received: true };
    }

    private async processPreapproval(preapprovalId: string) {
        if (!this.isConfigured()) return;
        const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        if (!response.ok) {
            this.logger.warn(`Could not fetch Mercado Pago subscription ${preapprovalId}`);
            return;
        }
        const preapproval = await response.json();
        const local = await this.prisma.subscription.findUnique({ where: { mercadoPagoPreapprovalId: preapprovalId } })
            || (preapproval.external_reference
                ? await this.prisma.subscription.findFirst({ where: { mercadoPagoExternalReference: preapproval.external_reference } })
                : null);
        if (!local) return;
        if (!local.mercadoPagoPreapprovalId) {
            await this.prisma.subscription.update({ where: { id: local.id }, data: { mercadoPagoPreapprovalId: preapprovalId } });
        }

        if (preapproval.status === 'authorized') {
            // Payment webhooks, not authorization alone, grant paid access.
            if (local.status !== 'ACTIVE' || !local.endDate || local.endDate <= new Date()) {
                await this.prisma.subscription.update({ where: { id: local.id }, data: { status: 'PENDING' } });
            }
            return;
        }
        if (preapproval.status === 'cancelled' || preapproval.status === 'paused') {
            const stillPaid = Boolean(local.endDate && local.endDate > new Date());
            await this.prisma.subscription.update({
                where: { id: local.id },
                data: { status: stillPaid ? 'ACTIVE' : 'CANCELED', cancelAtPeriodEnd: true },
            });
            if (!stillPaid) await this.refreshUserEntitlements(local.userId);
        }
    }

    async processPayment(paymentId: string) {
        if (!this.isConfigured()) return;

        try {
            const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });

            if (!res.ok) {
                this.logger.warn(`Could not fetch payment ${paymentId} from Mercado Pago`);
                return;
            }

            const payment = await res.json();
            this.logger.log(`Payment ${paymentId} status: ${payment.status}`);

            if (payment.status === 'approved') {
                const extRef = payment.external_reference || '';
                if (extRef.startsWith('COMMUNITY:')) {
                    await this.activateCommunityPayment(payment, extRef);
                    return;
                }
                const preapprovalId = payment.preapproval_id ? String(payment.preapproval_id) : null;
                const localSubscription = preapprovalId
                    ? await this.prisma.subscription.findUnique({ where: { mercadoPagoPreapprovalId: preapprovalId } })
                    : extRef.startsWith('FINIX_RECURRING:')
                        ? await this.prisma.subscription.findFirst({ where: { mercadoPagoExternalReference: extRef } })
                        : null;
                let userId = localSubscription?.userId;
                let targetPlan = localSubscription ? this.normalizePlanType(localSubscription.planType) : null;
                if (!userId && extRef.startsWith('FINIX_ONE_TIME:')) {
                    const [, referenceUserId, referencePlan] = extRef.split(':');
                    userId = referenceUserId;
                    targetPlan = referencePlan === 'CREATOR' ? 'CREATOR' : 'PRO';
                }
                if (!userId && /^[^:]+:(PRO|CREATOR):\d+$/.test(extRef)) {
                    const [referenceUserId, referencePlan] = extRef.split(':');
                    userId = referenceUserId;
                    targetPlan = referencePlan as 'PRO' | 'CREATOR';
                }

                if (userId && targetPlan) {
                    await this.activateUserPlan(userId, targetPlan, String(payment.id), preapprovalId || undefined);
                    this.logger.log(`User ${userId} upgraded to ${targetPlan} via payment ${paymentId}`);
                }
            }
        } catch (err: any) {
            this.logger.error(`Error processing Mercado Pago payment ${paymentId}:`, err);
        }
    }

    private async activateCommunityPayment(payment: any, reference: string) {
        const [, communityId, planId, userId] = reference.split(':');
        const community = await this.prisma.community.findUnique({ where: { id: communityId } });
        const plan = await this.prisma.communityPlan.findUnique({ where: { id: planId } });
        if (!community || !plan) return;
        const amount = Number(payment.transaction_amount || plan.price);
        const commission = Number((amount * 0.05).toFixed(2));
        const providerId = String(payment.id);
        const periodDays = plan.interval === 'yearly' || plan.interval === 'year' ? 365 : 30;
        await this.prisma.$transaction(async tx => {
            await tx.communityPayment.upsert({ where: { stripePaymentId: providerId }, update: { status: 'SUCCEEDED' }, create: { communityId, userId, creatorId: community.creatorId, amount: new Prisma.Decimal(amount), commissionAmount: new Prisma.Decimal(commission), creatorAmount: new Prisma.Decimal(amount - commission), stripePaymentId: providerId, status: 'SUCCEEDED', billingType: plan.interval || 'monthly' } });
            await tx.communityMember.upsert({ where: { communityId_userId: { communityId, userId } }, update: { planId, subscriptionStatus: 'ACTIVE', paymentStatus: 'SUCCEEDED', expiresAt: new Date(Date.now() + periodDays * 86400000) }, create: { communityId, userId, planId, subscriptionStatus: 'ACTIVE', paymentStatus: 'SUCCEEDED', expiresAt: new Date(Date.now() + periodDays * 86400000) } });
        });
    }

    private normalizePlanType(value: string): 'PRO' | 'CREATOR' | null {
        const type = value.toUpperCase();
        if (type === 'PRO' || type === 'PRO_INVESTOR') return 'PRO';
        if (type === 'CREATOR' || type === 'PRO_CREATOR') return 'CREATOR';
        return null;
    }

    private addOneMonth(from: Date) {
        const result = new Date(from);
        const day = result.getUTCDate();
        result.setUTCDate(1);
        result.setUTCMonth(result.getUTCMonth() + 1);
        const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
        result.setUTCDate(Math.min(day, lastDay));
        return result;
    }

    private async refreshUserEntitlements(userId: string) {
        const now = new Date();
        const activeSubscriptions = await this.prisma.subscription.findMany({
            where: { userId, status: 'ACTIVE', endDate: { gt: now } },
            select: { planType: true },
        });
        const activePlans = new Set(activeSubscriptions.map((s) => this.normalizePlanType(s.planType)).filter(Boolean));
        const plan = activePlans.has('CREATOR') ? 'CREATOR' : activePlans.has('PRO') ? 'PRO' : 'FREE';
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                plan,
                subscriptionStatus: plan === 'FREE' ? 'EXPIRED' : 'ACTIVE',
                accountType: plan === 'CREATOR' ? 'CREATOR' : plan === 'PRO' ? 'PRO' : 'BASIC',
                isCreator: plan === 'CREATOR',
            },
        });
    }

    async activateUserPlan(userId: string, plan: 'PRO' | 'CREATOR', paymentId: string, preapprovalId?: string) {
        const existingPayment = await this.prisma.subscription.findUnique({
            where: { mercadoPagoPaymentId: paymentId },
        });
        if (existingPayment) return;

        const subscription = preapprovalId
            ? await this.prisma.subscription.findUnique({ where: { mercadoPagoPreapprovalId: preapprovalId } })
            : null;
        const periodStart = subscription?.endDate && subscription.endDate > new Date() ? subscription.endDate : new Date();
        const endDate = this.addOneMonth(periodStart);

        const updateData: any = {
            plan,
            subscriptionStatus: 'ACTIVE',
            accountType: plan === 'CREATOR' ? 'CREATOR' : 'PRO',
        };
        if (plan === 'CREATOR') {
            updateData.isCreator = true;
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { username: true, email: true },
        });

        if (subscription) {
            await this.prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: 'ACTIVE', startDate: subscription.startDate || new Date(), endDate, mercadoPagoPaymentId: paymentId },
            });
        } else {
            await this.prisma.subscription.create({
                data: {
                    userId,
                    planType: plan,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate,
                    mercadoPagoPaymentId: paymentId,
                },
            });
        }

        // Notify admin about paid upgrade
        this.mailService.sendAdminAlert({
            eventType: 'PAYMENT_RECEIVED',
            title: `Nuevo Pago Recibido en Mercado Pago (Plan ${plan})`,
            badgeText: 'PAGO MERCADO PAGO',
            badgeColor: '#059669',
            summary: `Se ha procesado y acreditado un pago con Mercado Pago para activar el plan ${plan}.`,
            details: [
                { label: 'Usuario', value: `@${updated.username} (${updated.email})` },
                { label: 'Plan Activado', value: plan },
                { label: 'Pasarela', value: 'Mercado Pago' },
                { label: 'ID Usuario', value: userId },
                { label: 'Fecha y Hora', value: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) },
            ],
            actionUrl: `${this.mailService.getAdminUrl()}/users`,
            actionLabel: 'Ver Usuario en Admin',
        });

        // Create notification for the user
        try {
            await this.prisma.notification.create({
                data: {
                    userId,
                    type: 'SUBSCRIPTION_ACTIVE',
                    title: `¡Bienvenido a Finix ${plan}!`,
                    message: `Tu membresía ${plan} ha sido activada exitosamente con Mercado Pago.`,
                },
            });
        } catch {}
    }

    async getStatus(paymentId: string, userId: string) {
        if (!this.isConfigured()) {
            return { configured: false };
        }

        try {
            const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });

            if (!res.ok) return { status: 'unknown' };
            const payment = await res.json();
            const externalReference = String(payment.external_reference || '');
            if (!externalReference.startsWith(`${userId}:`)) {
                return { status: 'unknown' };
            }
            return {
                id: payment.id,
                status: payment.status,
                status_detail: payment.status_detail,
                date_approved: payment.date_approved,
                transaction_amount: payment.transaction_amount,
            };
        } catch {
            return { status: 'unknown' };
        }
    }
}
