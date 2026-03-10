import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { Request } from 'express';

interface AuditMetadata {
    [key: string]: unknown;
}

interface BuildAuditInput {
    action: string;
    targetId?: string | null;
    metadata?: AuditMetadata;
}

interface DirectAuditInput extends BuildAuditInput {
    actorId: string;
    sessionId?: string | null;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AdminAuditService {
    private readonly logger = new Logger(AdminAuditService.name);

    constructor(private readonly prisma: PrismaService) { }

    buildAuditData(req: Request & { user?: any }, input: BuildAuditInput) {
        const actorId = req.user?.id;
        if (!actorId) {
            return null;
        }

        const { ipAddress, userAgent } = this.extractRequestMeta(req);

        return {
            action: input.action,
            actorId,
            targetId: input.targetId || null,
            sessionId: req.user?.sessionId || null,
            ipAddress,
            userAgent,
            metadata: this.stringifyMetadata(input.metadata),
        };
    }

    async logFromRequest(req: Request & { user?: any }, input: BuildAuditInput) {
        const data = this.buildAuditData(req, input);
        if (!data) {
            return;
        }

        await this.prisma.adminAuditLog.create({ data });
    }

    async logDirect(input: DirectAuditInput) {
        try {
            await this.prisma.adminAuditLog.create({
                data: {
                    action: input.action,
                    actorId: input.actorId,
                    targetId: input.targetId || null,
                    sessionId: input.sessionId || null,
                    ipAddress: input.ipAddress || null,
                    userAgent: input.userAgent || null,
                    metadata: this.stringifyMetadata(input.metadata),
                },
            });
        } catch (error) {
            this.logger.warn(`No se pudo registrar log admin directo (${input.action})`);
        }
    }

    extractRequestMeta(req: Request) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const rawIp = typeof forwardedFor === 'string'
            ? forwardedFor.split(',')[0].trim()
            : req.ip || req.socket.remoteAddress || 'unknown';
        const userAgentHeader = req.headers['user-agent'];

        return {
            ipAddress: rawIp,
            userAgent: Array.isArray(userAgentHeader) ? userAgentHeader.join(' ') : (userAgentHeader || null),
        };
    }

    private stringifyMetadata(metadata?: AuditMetadata) {
        if (!metadata) {
            return null;
        }

        try {
            return JSON.stringify(metadata);
        } catch {
            return JSON.stringify({ error: 'metadata_serialization_failed' });
        }
    }
}
