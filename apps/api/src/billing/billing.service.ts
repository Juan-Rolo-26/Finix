import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccessControlService } from '../access/access-control.service';
import { StripeService } from '../stripe/stripe.service';

const DEFAULT_COMMISSION_RATE = 0.10;

@Injectable()
export class BillingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly accessControlService: AccessControlService,
        private readonly stripeService: StripeService,
    ) { }

    async getPaymentOverview(userId: string) {
        const [user, subscription, balance] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    plan: true,
                    subscriptionStatus: true,
                    createdAt: true,
                },
            }),
            this.prisma.subscription.findFirst({
                where: { userId, planType: 'PRO' },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.creatorBalance.findUnique({
                where: { creatorId: userId },
                select: {
                    availableBalance: true,
                    pendingBalance: true,
                },
            }),
        ]);

        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }

        const [invoices, commissionRate, creatorSummary] = await Promise.all([
            this.safeListInvoices(userId),
            this.getCommissionRate(),
            this.getCreatorSummary(userId).catch(() => null),
        ]);

        return {
            currentPlan: user.plan,
            subscriptionStatus: user.subscriptionStatus,
            nextBillingDate: subscription?.endDate || null,
            cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
            proPriceUsdMonthly: 15,
            commissionRate,
            invoices,
            creator: creatorSummary ? {
                ...creatorSummary,
                balance: {
                    available: Number(balance?.availableBalance || 0),
                    pending: Number(balance?.pendingBalance || 0),
                },
            } : null,
        };
    }

    async getPaymentHistory(userId: string) {
        const [communityPayments, invoices] = await Promise.all([
            this.prisma.communityPayment.findMany({
                where: { userId },
                include: {
                    community: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
            this.safeListInvoices(userId),
        ]);

        return {
            invoices,
            communityPayments: communityPayments.map((payment) => ({
                id: payment.id,
                communityId: payment.communityId,
                communityName: payment.community.name,
                amount: Number(payment.amount),
                status: payment.status,
                billingType: payment.billingType,
                createdAt: payment.createdAt,
            })),
        };
    }

    async cancelProSubscription(userId: string) {
        return this.stripeService.cancelSubscription(userId);
    }

    async getCreatorSummary(userId: string) {
        await this.accessControlService.requirePro(userId);

        const communities = await this.prisma.community.findMany({
            where: { creatorId: userId },
            select: {
                id: true,
                name: true,
                members: {
                    select: {
                        subscriptionStatus: true,
                    },
                },
            },
        });

        const communityIds = communities.map((community) => community.id);
        if (communityIds.length === 0) {
            return {
                communitiesCount: 0,
                activeMembers: 0,
                totalRevenue: 0,
                totalCommissionPaid: 0,
                monthlyRevenue: 0,
                monthlyGrowthPercent: 0,
                earningsByCommunity: [],
            };
        }

        const now = new Date();
        const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const payments = await this.prisma.communityPayment.findMany({
            where: {
                communityId: { in: communityIds },
                createdAt: { gte: startPreviousMonth },
            },
            select: {
                communityId: true,
                creatorAmount: true,
                commissionAmount: true,
                createdAt: true,
            },
        });

        let totalRevenue = 0;
        let totalCommissionPaid = 0;
        let currentMonthRevenue = 0;
        let previousMonthRevenue = 0;

        const byCommunity = new Map<string, { total: number; commission: number; payments: number }>();

        for (const payment of payments) {
            const creatorAmount = Number(payment.creatorAmount);
            const commissionAmount = Number(payment.commissionAmount);

            totalRevenue += creatorAmount;
            totalCommissionPaid += commissionAmount;

            if (!byCommunity.has(payment.communityId)) {
                byCommunity.set(payment.communityId, { total: 0, commission: 0, payments: 0 });
            }
            const summary = byCommunity.get(payment.communityId)!;
            summary.total += creatorAmount;
            summary.commission += commissionAmount;
            summary.payments += 1;

            if (payment.createdAt >= startCurrentMonth) {
                currentMonthRevenue += creatorAmount;
            } else {
                previousMonthRevenue += creatorAmount;
            }
        }

        const monthlyGrowthPercent = previousMonthRevenue > 0
            ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
            : (currentMonthRevenue > 0 ? 100 : 0);

        const communityMap = new Map(communities.map((community) => [community.id, community.name]));

        const earningsByCommunity = Array.from(byCommunity.entries())
            .map(([communityId, summary]) => ({
                communityId,
                communityName: communityMap.get(communityId) || 'Comunidad',
                revenue: summary.total,
                commission: summary.commission,
                payments: summary.payments,
            }))
            .sort((a, b) => b.revenue - a.revenue);

        const activeMembers = communities.reduce((acc, community) => {
            return acc + community.members.filter((member) => member.subscriptionStatus === 'ACTIVE').length;
        }, 0);

        return {
            communitiesCount: communities.length,
            activeMembers,
            totalRevenue: this.round(totalRevenue),
            totalCommissionPaid: this.round(totalCommissionPaid),
            monthlyRevenue: this.round(currentMonthRevenue),
            monthlyGrowthPercent: this.round(monthlyGrowthPercent),
            earningsByCommunity,
        };
    }

    async settlePendingBalance(userId: string) {
        await this.accessControlService.requirePro(userId);

        const balance = await this.prisma.creatorBalance.upsert({
            where: { creatorId: userId },
            create: {
                creatorId: userId,
                availableBalance: 0,
                pendingBalance: 0,
            },
            update: {},
        });

        const pending = Number(balance.pendingBalance);
        if (pending <= 0) {
            return {
                availableBalance: Number(balance.availableBalance),
                pendingBalance: pending,
                movedAmount: 0,
            };
        }

        const updated = await this.prisma.creatorBalance.update({
            where: { creatorId: userId },
            data: {
                availableBalance: { increment: pending },
                pendingBalance: 0,
            },
        });

        return {
            availableBalance: Number(updated.availableBalance),
            pendingBalance: Number(updated.pendingBalance),
            movedAmount: pending,
        };
    }

    async requestPayout(userId: string, amount: number) {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new BadRequestException('El monto de payout es inválido.');
        }

        await this.accessControlService.requirePro(userId);
        await this.settlePendingBalance(userId);

        const balance = await this.prisma.creatorBalance.findUnique({
            where: { creatorId: userId },
        });

        if (!balance) {
            throw new BadRequestException('No existe balance para este creador.');
        }

        const available = Number(balance.availableBalance);
        if (amount > available) {
            throw new BadRequestException('No tienes balance disponible suficiente para este payout.');
        }

        return this.prisma.$transaction(async (tx) => {
            const updatedBalance = await tx.creatorBalance.update({
                where: { id: balance.id },
                data: {
                    availableBalance: { decrement: amount },
                },
            });

            const payout = await tx.payout.create({
                data: {
                    creatorBalanceId: balance.id,
                    amount,
                    status: 'PENDING',
                },
            });

            return {
                payout: {
                    id: payout.id,
                    amount: Number(payout.amount),
                    status: payout.status,
                    createdAt: payout.createdAt,
                },
                balance: {
                    availableBalance: Number(updatedBalance.availableBalance),
                    pendingBalance: Number(updatedBalance.pendingBalance),
                },
            };
        });
    }

    async listPayouts(userId: string) {
        await this.accessControlService.requirePro(userId);

        const creatorBalance = await this.prisma.creatorBalance.findUnique({
            where: { creatorId: userId },
            select: { id: true },
        });

        if (!creatorBalance) {
            return [];
        }

        const payouts = await this.prisma.payout.findMany({
            where: { creatorBalanceId: creatorBalance.id },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        return payouts.map((payout) => ({
            id: payout.id,
            amount: Number(payout.amount),
            status: payout.status,
            stripePayoutId: payout.stripePayoutId,
            createdAt: payout.createdAt,
            processedAt: payout.processedAt,
        }));
    }

    async getAdminSettings() {
        const settings = await this.prisma.platformSetting.findMany({
            where: {
                key: {
                    in: ['COMMUNITY_COMMISSION_RATE', 'PRO_MONTHLY_PRICE_USD'],
                },
            },
            orderBy: { key: 'asc' },
        });

        const mapped = settings.reduce<Record<string, string>>((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});

        if (!mapped.COMMUNITY_COMMISSION_RATE) {
            mapped.COMMUNITY_COMMISSION_RATE = String(DEFAULT_COMMISSION_RATE);
        }

        if (!mapped.PRO_MONTHLY_PRICE_USD) {
            mapped.PRO_MONTHLY_PRICE_USD = '15';
        }

        return mapped;
    }

    async updateCommissionRate(rate: number) {
        if (!Number.isFinite(rate) || rate <= 0 || rate >= 1) {
            throw new BadRequestException('La comisión debe estar entre 0 y 1 (ej. 0.15).');
        }

        const normalized = this.round(rate);

        const setting = await this.prisma.platformSetting.upsert({
            where: { key: 'COMMUNITY_COMMISSION_RATE' },
            create: {
                key: 'COMMUNITY_COMMISSION_RATE',
                value: String(normalized),
                description: 'Comisión global de Finix para comunidades pagas.',
            },
            update: {
                value: String(normalized),
            },
        });

        return {
            key: setting.key,
            value: Number(setting.value),
        };
    }

    private async getCommissionRate() {
        const setting = await this.prisma.platformSetting.findUnique({
            where: { key: 'COMMUNITY_COMMISSION_RATE' },
            select: { value: true },
        });
        if (!setting) {
            return DEFAULT_COMMISSION_RATE;
        }
        const parsed = Number(setting.value);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
            return DEFAULT_COMMISSION_RATE;
        }
        return parsed;
    }

    private async safeListInvoices(userId: string) {
        try {
            return await this.stripeService.listInvoices(userId);
        } catch {
            return [];
        }
    }

    private round(value: number) {
        return Math.round(value * 100) / 100;
    }
}
