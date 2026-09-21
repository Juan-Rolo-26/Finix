import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import * as webpush from 'web-push';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';

const endpointSchema = z.string().url().max(2048).refine(value => {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.port && !url.username && !url.password &&
        (url.hostname === 'fcm.googleapis.com' || url.hostname === 'updates.push.services.mozilla.com' || url.hostname.endsWith('.push.services.mozilla.com') || url.hostname === 'web.push.apple.com');
});
const subscriptionSchema = z.object({ endpoint: endpointSchema, keys: z.object({ p256dh: z.string().regex(/^[A-Za-z0-9_-]{87,88}$/), auth: z.string().regex(/^[A-Za-z0-9_-]{22,24}$/) }) });

@Injectable()
export class PushService {
    private busy = false;
    private readonly logger = new Logger(PushService.name);
    constructor(private readonly prisma: PrismaService) {}
    config() { return { enabled: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT), publicKey: process.env.VAPID_PUBLIC_KEY || null }; }
    async subscribe(userId: string, raw: unknown) {
        if (!this.config().enabled) throw new BadRequestException('Notificaciones push no configuradas en el servidor.');
        const parsed = subscriptionSchema.safeParse(raw);
        if (!parsed.success) throw new BadRequestException('Suscripcion push invalida.');
        const { endpoint, keys } = parsed.data;
        const existing = await this.prisma.pushSubscription.findUnique({ where: { endpoint } });
        if (!existing && await this.prisma.pushSubscription.count({ where: { userId } }) >= 10) throw new BadRequestException('Limite de dispositivos alcanzado.');
        if (existing && existing.userId !== userId) throw new BadRequestException('Este dispositivo esta vinculado a otra cuenta. Desactiva su suscripcion primero.');
        return this.prisma.pushSubscription.upsert({ where: { endpoint }, update: { p256dh: keys.p256dh, auth: keys.auth, failures: 0, nextAttemptAt: new Date() }, create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }, select: { id: true } });
    }
    async remove(userId: string, endpoint: unknown) {
        if (typeof endpoint !== 'string') throw new BadRequestException('Endpoint requerido.');
        await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
        return { removed: true };
    }
    async status(userId: string, endpoint: string) {
        if (typeof endpoint !== 'string' || endpoint.length > 2048) throw new BadRequestException('Endpoint invalido.');
        return { subscribed: Boolean(await this.prisma.pushSubscription.findFirst({ where: { userId, endpoint, failures: { lt: 5 } }, select: { id: true } })) };
    }
    async test(userId: string) {
        await this.prisma.notification.create({ data: { userId, type: 'SYSTEM_ALERT', title: 'Notificaciones de Finix activadas', message: 'Este dispositivo ya puede recibir avisos.', link: '/notifications', priority: 'NORMAL' } });
        return { queued: true };
    }
    @Interval(10000)
    async deliver() {
        if (this.busy || !this.config().enabled) return;
        this.busy = true;
        try {
            const devices = await this.prisma.pushSubscription.findMany({ where: { user: { status: 'ACTIVE' }, nextAttemptAt: { lte: new Date() }, failures: { lt: 5 } }, take: 20, orderBy: { nextAttemptAt: 'asc' } });
            for (const device of devices) {
                const lease = randomUUID();
                const claimed = await this.prisma.pushSubscription.updateMany({ where: { id: device.id, nextAttemptAt: { lte: new Date() } }, data: { lease, nextAttemptAt: new Date(Date.now() + 120000) } });
                if (!claimed.count) continue;
                const notification = await this.prisma.notification.findFirst({ where: { userId: device.userId, OR: [{ createdAt: { gt: device.cursorAt } }, { createdAt: device.cursorAt, id: { gt: device.cursorId } }] }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
                try {
                    if (notification) {
                        const link = notification.link?.startsWith('/') && !notification.link.startsWith('//') ? notification.link : '/notifications';
                        await webpush.sendNotification({ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } }, JSON.stringify({ title: 'Finix', body: 'Tenes una nueva notificacion.', url: link, tag: notification.id }), { TTL: 3600, timeout: 15000, vapidDetails: { subject: process.env.VAPID_SUBJECT!, publicKey: process.env.VAPID_PUBLIC_KEY!, privateKey: process.env.VAPID_PRIVATE_KEY! } });
                    }
                    await this.prisma.pushSubscription.updateMany({ where: { id: device.id, lease }, data: { failures: 0, nextAttemptAt: new Date(Date.now() + 10000), ...(notification ? { cursorAt: notification.createdAt, cursorId: notification.id } : {}) } });
                } catch (e) {
                    const code = (e as { statusCode?: number }).statusCode;
                    if (code === 404 || code === 410) await this.prisma.pushSubscription.deleteMany({ where: { id: device.id, lease } });
                    else await this.prisma.pushSubscription.updateMany({ where: { id: device.id, lease }, data: { failures: { increment: 1 }, nextAttemptAt: new Date(Date.now() + 60000 * 2 ** device.failures) } });
                }
            }
        } catch { this.logger.error('Fallo de cola push; reintento pendiente.'); }
        finally { this.busy = false; }
    }
}
