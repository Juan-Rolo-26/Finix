import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

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

    async createPreference(userId: string, planType: 'pro' | 'creator') {
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
        const title = isPro ? 'Finix PRO - Membresía Mensual' : 'Finix Creador - Membresía Mensual';
        const defaultPrice = isPro ? 6500 : 29900;
        const price = isPro
            ? Number(process.env.MP_PRO_PRICE_ARS) || defaultPrice
            : Number(process.env.MP_CREATOR_PRICE_ARS) || defaultPrice;

        const externalReference = `${user.id}:${isPro ? 'PRO' : 'CREATOR'}:${Date.now()}`;

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
                plan: isPro ? 'PRO' : 'CREATOR',
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

    async handleWebhook(body: any, query: any) {
        const topic = query?.topic || query?.type || body?.type || body?.topic;
        const paymentId = query?.id || query?.['data.id'] || body?.data?.id;

        this.logger.log(`Mercado Pago webhook received: topic=${topic}, paymentId=${paymentId}`);

        if ((topic === 'payment' || topic === 'merchant_order') && paymentId) {
            await this.processPayment(String(paymentId));
        }

        return { received: true };
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
                const [userId, plan] = extRef.split(':');

                if (userId) {
                    const targetPlan = plan === 'CREATOR' ? 'CREATOR' : 'PRO';
                    await this.activateUserPlan(userId, targetPlan);
                    this.logger.log(`User ${userId} upgraded to ${targetPlan} via payment ${paymentId}`);
                }
            }
        } catch (err: any) {
            this.logger.error(`Error processing Mercado Pago payment ${paymentId}:`, err);
        }
    }

    async activateUserPlan(userId: string, plan: 'PRO' | 'CREATOR') {
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

    async getStatus(paymentId: string) {
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
