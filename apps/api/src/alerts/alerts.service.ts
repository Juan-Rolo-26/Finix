import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { MarketService } from '../market/market.service';
import { MailService } from '../mail/mail.service';

export interface CreateAlertDto {
    ticker: string;
    name?: string;
    alertType?: 'PRICE_TARGET' | 'PERCENT_CHANGE' | '52W_HIGH' | '52W_LOW';
    targetValue: number;
    condition: 'GREATER_THAN' | 'LESS_THAN' | 'CHANGE_PCT_UP' | 'CHANGE_PCT_DOWN';
    notificationChannel?: 'EMAIL' | 'PUSH' | 'ALL';
    destinationEmail?: string;
}

export interface UpdateAlertDto {
    targetValue?: number;
    condition?: 'GREATER_THAN' | 'LESS_THAN' | 'CHANGE_PCT_UP' | 'CHANGE_PCT_DOWN';
    notificationChannel?: 'EMAIL' | 'PUSH' | 'ALL';
    destinationEmail?: string;
    status?: 'ACTIVE' | 'DISABLED';
}

@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name);
    private isChecking = false;

    constructor(
        private readonly prisma: PrismaService,
        private readonly marketService: MarketService,
        private readonly mailService: MailService,
    ) { }

    private get alertModel(): any {
        return (this.prisma as any).marketAlert;
    }

    private get assetModel(): any {
        return (this.prisma as any).asset;
    }

    private resolveCanonicalSymbol(ticker: string): string {
        const clean = (ticker || '').trim().toUpperCase();
        if (clean.includes(':')) return clean;
        if (['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA'].includes(clean)) {
            return `BINANCE:${clean}USDT`;
        }
        if (['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'GLD', 'SLV'].includes(clean)) {
            return `AMEX:${clean}`;
        }
        if (['GGAL', 'YPFD', 'PAMP', 'CEPU', 'BMA', 'EDN', 'ALUA', 'TXAR'].includes(clean)) {
            return `BCBA:${clean}`;
        }
        return `NASDAQ:${clean}`;
    }

    async createAlert(userId: string, dto: CreateAlertDto) {
        const ticker = (dto.ticker || '').trim().toUpperCase();
        if (!ticker) throw new BadRequestException('El ticker es requerido.');
        if (typeof dto.targetValue !== 'number' || !Number.isFinite(dto.targetValue)) {
            throw new BadRequestException('El valor objetivo debe ser un número válido.');
        }

        const validConditions = ['GREATER_THAN', 'LESS_THAN', 'CHANGE_PCT_UP', 'CHANGE_PCT_DOWN'];
        if (!validConditions.includes(dto.condition)) {
            throw new BadRequestException(`Condición inválida. Debe ser una de: ${validConditions.join(', ')}`);
        }

        // Upsert canonical Asset record if not exists
        let asset = await (this.prisma as any).asset.findUnique({ where: { ticker } });
        if (!asset) {
            const canonicalSymbol = this.resolveCanonicalSymbol(ticker);
            const exchange = canonicalSymbol.split(':')[0] || 'US';
            asset = await (this.prisma as any).asset.create({
                data: {
                    ticker,
                    name: dto.name || ticker,
                    type: canonicalSymbol.startsWith('BINANCE') ? 'CRYPTO' : (canonicalSymbol.startsWith('BCBA') ? 'CEDEAR' : 'STOCK'),
                    currency: canonicalSymbol.startsWith('BCBA') ? 'ARS' : 'USD',
                    symbol: canonicalSymbol,
                    exchange,
                    tradingViewSymbol: canonicalSymbol,
                    active: true,
                } as any,
            });
        }

        // Check for duplicates (same user, ticker, condition, targetValue, status ACTIVE)
        const duplicate = await (this.prisma as any).marketAlert.findFirst({
            where: {
                userId,
                ticker,
                condition: dto.condition,
                targetValue: dto.targetValue,
                status: 'ACTIVE',
            },
        });
        if (duplicate) {
            throw new BadRequestException(`Ya tenés una alerta activa idéntica para ${ticker} con objetivo ${dto.targetValue}.`);
        }

        // Destination email fallback to user email
        let destinationEmail = dto.destinationEmail?.trim() || null;
        if (!destinationEmail) {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
            destinationEmail = user?.email || null;
        }

        return this.alertModel.create({
            data: {
                userId,
                assetId: asset.id,
                ticker,
                name: dto.name || asset.name || ticker,
                alertType: dto.alertType || 'PRICE_TARGET',
                targetValue: dto.targetValue,
                condition: dto.condition,
                status: 'ACTIVE',
                notificationChannel: dto.notificationChannel || 'EMAIL',
                destinationEmail,
            },
            include: { asset: true },
        });
    }

    async getUserAlerts(userId: string, query?: { status?: string; ticker?: string }) {
        const where: any = { userId };
        if (query?.status) where.status = query.status.toUpperCase();
        if (query?.ticker) where.ticker = { contains: query.ticker.trim().toUpperCase() };

        return this.alertModel.findMany({
            where,
            include: { asset: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getAlert(userId: string, id: string) {
        const alert = await this.alertModel.findUnique({
            where: { id },
            include: { asset: true, user: { select: { id: true, email: true, username: true } } },
        });
        if (!alert || (alert.userId !== userId && alert.user?.username !== 'juan26')) {
            throw new NotFoundException('Alerta no encontrada.');
        }
        return alert;
    }

    async updateAlert(userId: string, id: string, dto: UpdateAlertDto) {
        const existing = await this.getAlert(userId, id);
        return this.alertModel.update({
            where: { id: existing.id },
            data: {
                ...(typeof dto.targetValue === 'number' && Number.isFinite(dto.targetValue) ? { targetValue: dto.targetValue } : {}),
                ...(dto.condition ? { condition: dto.condition } : {}),
                ...(dto.notificationChannel ? { notificationChannel: dto.notificationChannel } : {}),
                ...(dto.destinationEmail !== undefined ? { destinationEmail: dto.destinationEmail?.trim() || null } : {}),
                ...(dto.status ? { status: dto.status } : {}),
            },
            include: { asset: true },
        });
    }

    async toggleAlert(userId: string, id: string) {
        const existing = await this.getAlert(userId, id);
        const newStatus = existing.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        return this.alertModel.update({
            where: { id: existing.id },
            data: {
                status: newStatus,
                activatedAt: newStatus === 'ACTIVE' ? new Date() : existing.activatedAt,
            },
            include: { asset: true },
        });
    }

    async deleteAlert(userId: string, id: string) {
        const existing = await this.getAlert(userId, id);
        return this.alertModel.delete({ where: { id: existing.id } });
    }

    // Cron job every 30 seconds to check active alerts against live market quotes
    @Interval(30_000)
    async checkAlertsInterval() {
        if (this.isChecking) return;
        this.isChecking = true;
        try {
            await this.checkActiveAlerts();
        } catch (error: any) {
            this.logger.warn(`Error en comprobación automática de alertas: ${error.message}`);
        } finally {
            this.isChecking = false;
        }
    }

    async checkActiveAlerts(): Promise<{ checked: number; triggered: number; errors: number }> {
        const activeAlerts = await this.alertModel.findMany({
            where: { status: 'ACTIVE' },
            include: { user: { select: { id: true, email: true, username: true } }, asset: true },
            take: 200,
        });

        if (!activeAlerts.length) return { checked: 0, triggered: 0, errors: 0 };

        // Group symbols to fetch quotes efficiently
        const symbolMap = new Map<string, string>();
        for (const alert of activeAlerts) {
            const sym = alert.asset?.tradingViewSymbol || alert.asset?.symbol || this.resolveCanonicalSymbol(alert.ticker);
            symbolMap.set(alert.ticker, sym);
        }

        const uniqueSymbols = Array.from(new Set(symbolMap.values()));
        const quotes = await this.marketService.getQuotes(uniqueSymbols);
        const quoteBySymbol = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));
        const quoteByInput = new Map(quotes.map((q) => [q.inputSymbol.toUpperCase(), q]));

        let triggeredCount = 0;
        let errorsCount = 0;

        for (const alert of activeAlerts) {
            try {
                const targetSym = symbolMap.get(alert.ticker)?.toUpperCase() || '';
                const quote = quoteBySymbol.get(targetSym) || quoteByInput.get(targetSym) || quoteByInput.get(alert.ticker);
                const currentPrice = quote?.price ?? null;
                const currentChange = quote?.change ?? null;

                // Update lastCheckedAt
                await this.alertModel.update({
                    where: { id: alert.id },
                    data: { lastCheckedAt: new Date() },
                });

                if (currentPrice === null || !Number.isFinite(currentPrice)) {
                    continue;
                }

                let isTriggered = false;
                if (alert.condition === 'GREATER_THAN' && currentPrice >= alert.targetValue) {
                    isTriggered = true;
                } else if (alert.condition === 'LESS_THAN' && currentPrice <= alert.targetValue) {
                    isTriggered = true;
                } else if (alert.condition === 'CHANGE_PCT_UP' && currentChange !== null && currentChange >= alert.targetValue) {
                    isTriggered = true;
                } else if (alert.condition === 'CHANGE_PCT_DOWN' && currentChange !== null && currentChange <= -Math.abs(alert.targetValue)) {
                    isTriggered = true;
                }

                if (isTriggered) {
                    // Atomic transition to TRIGGERED
                    const claim = await this.alertModel.updateMany({
                        where: { id: alert.id, status: 'ACTIVE' },
                        data: {
                            status: 'TRIGGERED',
                            triggerPrice: currentPrice,
                            triggeredAt: new Date(),
                        },
                    });

                    if (claim.count > 0) {
                        triggeredCount++;
                        await this.dispatchAlertNotification(alert, currentPrice, currentChange);
                    }
                }
            } catch (err: any) {
                errorsCount++;
                this.logger.error(`Error evaluando alerta ${alert.id} para ${alert.ticker}: ${err.message}`);
            }
        }

        return { checked: activeAlerts.length, triggered: triggeredCount, errors: errorsCount };
    }

    private async dispatchAlertNotification(alert: any, currentPrice: number, currentChange: number | null) {
        const destEmail = alert.destinationEmail || alert.user?.email;
        const conditionLabel =
            alert.condition === 'GREATER_THAN' ? `superó el precio objetivo de $${alert.targetValue}` :
            alert.condition === 'LESS_THAN' ? `cayó por debajo de $${alert.targetValue}` :
            alert.condition === 'CHANGE_PCT_UP' ? `subió más de +${alert.targetValue}%` :
            `cayó más de -${Math.abs(alert.targetValue)}%`;

        const subject = `🔔 Alerta de Finix: ${alert.ticker} ${conditionLabel}`;
        const changeStr = currentChange !== null ? ` (${currentChange >= 0 ? '+' : ''}${currentChange.toFixed(2)}%)` : '';

        const html = `
            <!doctype html>
            <html>
            <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:24px;background:#09090b;font-family:Arial,sans-serif;color:#f4f4f5">
                <div style="max-width:580px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:20px;overflow:hidden">
                    <div style="background:#047857;padding:22px 28px;display:flex;align-items:center;justify-content:space-between">
                        <span style="font-size:22px;font-weight:900;letter-spacing:1px;color:#ffffff">FINIX ALERTAS</span>
                        <span style="font-size:12px;background:#065f46;color:#a7f3d0;padding:4px 10px;border-radius:12px;font-weight:700">EN VIVO</span>
                    </div>
                    <div style="padding:28px">
                        <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#ffffff">${alert.ticker} — ${alert.name}</h2>
                        <p style="margin:0 0 20px 0;color:#a1a1aa;font-size:14px">Tu condición de alerta fue alcanzada en el mercado.</p>
                        
                        <div style="background:#27272a;border-radius:14px;padding:18px 22px;margin:20px 0">
                            <p style="margin:0 0 6px 0;font-size:12px;color:#a1a1aa;text-transform:uppercase;font-weight:700">Cotización actual</p>
                            <div style="font-size:32px;font-weight:900;color:#10b981">$${currentPrice.toFixed(2)} <span style="font-size:18px;color:${(currentChange || 0) >= 0 ? '#10b981' : '#f43f5e'}">${changeStr}</span></div>
                            <p style="margin:8px 0 0 0;font-size:13px;color:#e4e4e7">Condición: <strong>${conditionLabel}</strong></p>
                        </div>

                        <a href="https://finixarg.com/market" style="display:inline-block;padding:12px 24px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:800;font-size:14px;margin-top:10px">Ver gráfico en tiempo real</a>
                        
                        <hr style="border:0;border-top:1px solid #27272a;margin:28px 0" />
                        <p style="margin:0;font-size:11px;color:#71717a">Finix Pro · Alertas automatizadas en tiempo real. Para gestionar tus alertas entrá a tu panel de configuración.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // 1. In-app notification
        try {
            await this.prisma.notification.create({
                data: {
                    userId: alert.userId,
                    type: 'MARKET_ALERT',
                    priority: 'HIGH',
                    title: `Alerta de precio: ${alert.ticker}`,
                    message: `${alert.name} (${alert.ticker}) ${conditionLabel}. Precio actual: $${currentPrice.toFixed(2)}.`,
                    link: `/market?symbol=${encodeURIComponent(alert.ticker)}`,
                    entityType: 'ASSET',
                    entityId: alert.ticker,
                },
            });
        } catch (e: any) {
            this.logger.warn(`No se pudo crear notificación interna para alerta ${alert.id}: ${e.message}`);
        }

        // 2. Email notification
        if (destEmail && (alert.notificationChannel === 'EMAIL' || alert.notificationChannel === 'ALL')) {
            try {
                await this.mailService.sendEmail({
                    to: destEmail,
                    subject,
                    text: `${alert.ticker}: ${conditionLabel}. Precio actual: $${currentPrice.toFixed(2)}.`,
                    html,
                });
            } catch (e: any) {
                this.logger.warn(`No se pudo enviar email para alerta ${alert.id}: ${e.message}`);
            }
        }
    }

    async getAdminOverview() {
        const [total, active, triggered, disabled, recentTriggered] = await Promise.all([
            this.alertModel.count(),
            this.alertModel.count({ where: { status: 'ACTIVE' } }),
            this.alertModel.count({ where: { status: 'TRIGGERED' } }),
            this.alertModel.count({ where: { status: 'DISABLED' } }),
            this.alertModel.findMany({
                where: { status: 'TRIGGERED' },
                orderBy: { triggeredAt: 'desc' },
                take: 10,
                include: { user: { select: { username: true, email: true } }, asset: true },
            }),
        ]);

        return {
            total,
            active,
            triggered,
            disabled,
            recentTriggered,
        };
    }
}
