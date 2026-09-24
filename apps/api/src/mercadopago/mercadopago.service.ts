import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class MercadoPagoService {
    private readonly logger = new Logger(MercadoPagoService.name);
    private readonly accessToken = process.env.MP_ACCESS_TOKEN || '';
    private readonly publicKey = process.env.MP_PUBLIC_KEY || '';
    private readonly frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    private readonly apiUrl = (process.env.API_URL || 'http://localhost:3010').replace(/\/$/, '');
    private readonly environment = (process.env.MP_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox')).toLowerCase();

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) {}

    public isConfigured(): boolean {
        const validToken = /^(APP_USR|TEST)-/.test(this.accessToken)
            && !this.accessToken.includes('...')
            && this.accessToken.length > 20;
        const environmentMatches = this.environment !== 'production' || this.isProductionCredential();
        return validToken && environmentMatches;
    }

    public isProductionCredential(): boolean {
        return this.accessToken.startsWith('APP_USR-');
    }

    public isCheckoutReady(): boolean {
        return this.isConfigured()
            && (process.env.NODE_ENV !== 'production' || Boolean(process.env.MP_WEBHOOK_SECRET?.trim()));
    }

    private ensureCheckoutReady() {
        if (!this.isConfigured()) {
            throw new ServiceUnavailableException('Mercado Pago no está configurado con credenciales válidas para este entorno.');
        }
        if (!this.isCheckoutReady()) {
            throw new ServiceUnavailableException('Mercado Pago requiere MP_WEBHOOK_SECRET en producción para acreditar los pagos automáticamente.');
        }
    }

    private get notificationUrl() {
        return `${this.apiUrl.replace(/\/api$/, '')}/api/mercadopago/webhook`;
    }

    private async providerGet(path: string) {
        const response = await fetch(`https://api.mercadopago.com${path}`, {
            headers: { Authorization: `Bearer ${this.accessToken}` }, signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new ServiceUnavailableException('No se pudo verificar el pago con Mercado Pago. Reintentá en unos momentos.');
        return response.json();
    }

    private async recordPaymentOnce(paymentId: string, userId: string, apply: (worker: MercadoPagoService) => Promise<void>) {
        await this.prisma.$transaction(async tx => {
            await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `mp:user:${userId}`);
            const key = `mp:payment:${paymentId}`;
            if (await tx.paymentLog.findUnique({ where: { stripeEventId: key } })) return;
            await apply(new MercadoPagoService(tx as unknown as PrismaService, this.mailService));
            await tx.paymentLog.create({ data: { stripeEventId: key, userId, type: 'MP_PAYMENT', status: 'PROCESSED' } });
        }, { timeout: 20000 });
    }

    public getProPrice(): number {
        return Number(process.env.MP_PRO_PRICE_ARS) || 6300;
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
        this.ensureCheckoutReady();

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
                        back_url: `${this.frontendUrl}/payment-result?provider=mercadopago&reference=${encodeURIComponent(externalReference)}`,
                        notification_url: this.notificationUrl,
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
                success: `${this.frontendUrl}/payment-result?provider=mercadopago`,
                failure: `${this.frontendUrl}/payment-result?provider=mercadopago`,
                pending: `${this.frontendUrl}/payment-result?provider=mercadopago`,
            },
            auto_return: 'approved',
            external_reference: externalReference,
            notification_url: this.notificationUrl,
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
        this.ensureCheckoutReady();
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
            back_urls: { success: `${this.frontendUrl}/payment-result?provider=mercadopago&community=${community.id}`, failure: `${this.frontendUrl}/payment-result?provider=mercadopago&community=${community.id}`, pending: `${this.frontendUrl}/payment-result?provider=mercadopago&community=${community.id}` },
            auto_return: 'approved',
            notification_url: this.notificationUrl,
        };
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', { method: 'POST', headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new BadRequestException('Mercado Pago no pudo crear el checkout de la comunidad.');
        const data = await response.json();
        return { id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point, commissionRate: 0.05 };
    }

    async handleWebhook(body: any, query: any, signature?: string, requestId?: string) {
        const secret = process.env.MP_WEBHOOK_SECRET;
        if (!secret) throw new ServiceUnavailableException('Verificación de notificaciones no configurada.');
        const parts = Object.fromEntries(String(signature || '').split(',').map(part => part.trim().split('=')));
        const dataId = String(query?.['data.id'] || '').toLowerCase();
        const manifest = `${dataId ? `id:${dataId};` : ''}${requestId ? `request-id:${requestId};` : ''}ts:${parts.ts};`;
        const expected = createHmac('sha256', secret).update(manifest).digest();
        const supplied = Buffer.from(parts.v1 || '', 'hex');
        if (!parts.ts || supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) {
            throw new UnauthorizedException('Firma de Mercado Pago inválida.');
        }
        const topic = query?.topic || query?.type || body?.type || body?.topic;
        const paymentId = query?.['data.id'] || body?.data?.id;
        if (body?.data?.id != null && dataId && String(body.data.id).toLowerCase() !== dataId) throw new UnauthorizedException('Notificación inválida.');

        this.logger.log(`Mercado Pago webhook received: topic=${topic}, paymentId=${paymentId}`);

        if (topic === 'payment' && paymentId) {
            await this.processPayment(String(paymentId));
        }
        if (topic === 'subscription_preapproval' && paymentId) {
            await this.processPreapproval(String(paymentId));
        }
        if (topic === 'subscription_authorized_payment' && paymentId) {
            const invoice = await this.providerGet(`/authorized_payments/${encodeURIComponent(paymentId)}`);
            if (invoice.payment?.id) await this.processPayment(String(invoice.payment.id), String(invoice.preapproval_id));
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

    async processPayment(paymentId: string, knownPreapprovalId?: string) {
        if (!this.isConfigured()) return;

        try {
            const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });

            if (!res.ok) {
                throw new ServiceUnavailableException('No se pudo verificar el pago.');
            }

            const payment = await res.json();
            this.logger.log(`Payment ${paymentId} status: ${payment.status}`);

            if (payment.status === 'approved') {
                const extRef = payment.external_reference || '';
                if (extRef.startsWith('COMMUNITY:')) {
                    await this.activateCommunityPayment(payment, extRef);
                    return;
                }
                const preapprovalId = payment.preapproval_id ? String(payment.preapproval_id) : knownPreapprovalId || null;
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
                    targetPlan = this.normalizePlanType(referencePlan);
                }
                if (!userId && /^[^:]+:(PRO|CREATOR):\d+$/.test(extRef)) {
                    const [referenceUserId, referencePlan] = extRef.split(':');
                    userId = referenceUserId;
                    targetPlan = referencePlan as 'PRO' | 'CREATOR';
                }

                if (userId && targetPlan) {
                    const expected = targetPlan === 'CREATOR' ? this.getCreatorPrice() : this.getProPrice();
                    if (payment.currency_id !== 'ARS' || Number(payment.transaction_amount) !== expected) throw new BadRequestException('El monto o la moneda no corresponde al plan.');
                    await this.activateUserPlan(
                        userId,
                        targetPlan,
                        String(payment.id),
                        preapprovalId || localSubscription?.mercadoPagoPreapprovalId || undefined,
                        Number(payment.transaction_amount),
                    );
                    this.logger.log(`User ${userId} upgraded to ${targetPlan} via payment ${paymentId}`);
                }
            }
        } catch (err: any) {
            this.logger.error(`Error processing Mercado Pago payment ${paymentId}:`, err);
            throw err;
        }
    }

    private async activateCommunityPayment(payment: any, reference: string) {
        const [, communityId, planId, userId] = reference.split(':');
        await this.recordPaymentOnce(String(payment.id), userId, worker => worker.applyCommunityPayment(payment, communityId, planId, userId));
    }

    private async applyCommunityPayment(payment: any, communityId: string, planId: string, userId: string) {
        const community = await this.prisma.community.findUnique({ where: { id: communityId } });
        const plan = await this.prisma.communityPlan.findUnique({ where: { id: planId } });
        if (!community || !plan || plan.communityId !== communityId) throw new BadRequestException('Plan de comunidad inválido.');
        const amount = Number(payment.transaction_amount);
        if (payment.currency_id !== 'ARS' || amount !== Number(plan.price) || amount <= 0) throw new BadRequestException('Importe o moneda incorrectos.');
        const setting = await this.prisma.platformSetting.findUnique({ where: { key: 'COMMUNITY_COMMISSION_RATE' } });
        const rate = setting ? Number(setting.value) : 0.10;
        if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new BadRequestException('Comisión inválida.');
        const commission = Number((amount * rate).toFixed(2));
        const creatorAmount = amount - commission;
        // Legacy payments also count as processed; do not renew them on redelivery.
        if (await this.prisma.communityPayment.findUnique({ where: { stripePaymentId: String(payment.id) } })) return;
        const member = await this.prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } });
        const approvedAt = new Date(payment.date_approved || payment.date_created);
        if (!Number.isFinite(approvedAt.getTime())) throw new BadRequestException('Fecha de pago inválida.');
        let expiresAt = member?.expiresAt && member.expiresAt > approvedAt ? member.expiresAt : approvedAt;
        for (let month = 0; month < (['year', 'yearly'].includes(plan.interval) ? 12 : 1); month++) expiresAt = this.addOneMonth(expiresAt);
        const record = await this.prisma.communityPayment.create({ data: { communityId, userId, creatorId: community.creatorId, amount: new Prisma.Decimal(amount), commissionAmount: new Prisma.Decimal(commission), creatorAmount: new Prisma.Decimal(creatorAmount), stripePaymentId: `mp:${payment.id}`, status: 'SUCCEEDED', billingType: plan.interval || 'monthly' } });
        const membershipData = { planId, subscriptionStatus: 'ACTIVE', paymentStatus: 'SUCCEEDED', expiresAt, stripePaymentId: `mp:${payment.id}` };
        await this.prisma.communityMember.upsert({ where: { communityId_userId: { communityId, userId } }, update: membershipData, create: { communityId, userId, ...membershipData } });
        await this.prisma.finixRevenue.create({ data: { type: 'COMMUNITY', paymentId: record.id, communityId, userId, creatorId: community.creatorId, totalAmount: amount, commissionAmount: commission, creatorAmount, status: 'PENDING' } });
        await this.prisma.creatorBalance.upsert({ where: { creatorId: community.creatorId }, create: { creatorId: community.creatorId, pendingBalance: creatorAmount }, update: { pendingBalance: { increment: creatorAmount } } });
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

    async activateUserPlan(userId: string, plan: 'PRO' | 'CREATOR', paymentId: string, preapprovalId?: string, amount = 0) {
        await this.recordPaymentOnce(paymentId, userId, worker => worker.applyUserPlan(userId, plan, paymentId, preapprovalId, amount));
    }

    private async applyUserPlan(userId: string, plan: 'PRO' | 'CREATOR', paymentId: string, preapprovalId?: string, amount = 0) {
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

        let localSubscription = subscription;
        if (localSubscription) {
            await this.prisma.subscription.update({
                where: { id: localSubscription.id },
                data: { status: 'ACTIVE', startDate: localSubscription.startDate || new Date(), endDate, mercadoPagoPaymentId: paymentId },
            });
        } else {
            localSubscription = await this.prisma.subscription.create({
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

        // Keep plan revenue in the same ledger used by Stripe. The payment log
        // and the transaction lock make this safe when Mercado Pago retries a
        // webhook or the reconciliation loop sees the same invoice again.
        await this.prisma.finixRevenue.create({
            data: {
                type: 'PLAN',
                userId,
                subscriptionId: localSubscription.id,
                totalAmount: new Prisma.Decimal(amount),
                commissionAmount: new Prisma.Decimal(amount),
                creatorAmount: new Prisma.Decimal(0),
                status: 'PAID_OUT',
            },
        });

        // Recompute across both providers so a PRO payment cannot downgrade Creator.
        await this.refreshUserEntitlements(userId);

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
            const parts = externalReference.split(':');
            const referenceUserId = parts[0] === 'COMMUNITY' ? parts[3]
                : ['FINIX_ONE_TIME', 'FINIX_RECURRING'].includes(parts[0]) ? parts[1] : parts[0];
            if (referenceUserId !== userId) {
                return { status: 'unknown' };
            }
            // The browser return is not proof of payment. Verify with MP, then
            // reconcile through the same idempotent path as the webhook.
            if (payment.status === 'approved') await this.processPayment(String(payment.id));
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

    async getRecurringStatus(reference: string, userId: string) {
        const local = await this.prisma.subscription.findFirst({ where: { userId, mercadoPagoExternalReference: reference } });
        if (!local?.mercadoPagoPreapprovalId) throw new NotFoundException('Suscripción no encontrada.');
        const invoices = await this.providerGet(`/authorized_payments/search?preapproval_id=${encodeURIComponent(local.mercadoPagoPreapprovalId)}`);
        for (const invoice of invoices.results || []) {
            if (invoice.payment?.id && invoice.payment.status === 'approved') {
                await this.processPayment(String(invoice.payment.id), local.mercadoPagoPreapprovalId);
            }
        }
        const updated = await this.prisma.subscription.findUnique({ where: { id: local.id } });
        return { status: updated?.status === 'ACTIVE' && updated.endDate && updated.endDate > new Date() ? 'approved' : updated?.status === 'CANCELED' ? 'cancelled' : 'pending' };
    }

    /**
     * Webhooks are the primary source of truth. This reconciliation loop is a
     * safety net for temporary webhook outages and catches monthly authorized
     * payments after the initial checkout.
     */
    @Interval(5 * 60_000)
    async reconcileRecurringSubscriptions() {
        if (!this.isConfigured()) return;

        const subscriptions = await this.prisma.subscription.findMany({
            where: {
                mercadoPagoPreapprovalId: { not: null },
                status: { in: ['ACTIVE', 'PENDING', 'PAST_DUE', 'EXPIRED'] },
            },
            select: { mercadoPagoPreapprovalId: true },
            take: 200,
        });

        for (const subscription of subscriptions) {
            const preapprovalId = subscription.mercadoPagoPreapprovalId;
            if (!preapprovalId) continue;
            try {
                const invoices = await this.providerGet(`/authorized_payments/search?preapproval_id=${encodeURIComponent(preapprovalId)}`);
                for (const invoice of invoices.results || []) {
                    if (invoice.payment?.id && invoice.payment.status === 'approved') {
                        await this.processPayment(String(invoice.payment.id), preapprovalId);
                    }
                }
            } catch (error: any) {
                this.logger.warn(`No se pudo reconciliar la suscripción de Mercado Pago ${preapprovalId}: ${error?.message || 'error desconocido'}`);
            }
        }
    }
}
