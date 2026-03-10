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
export declare class AdminAuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    buildAuditData(req: Request & {
        user?: any;
    }, input: BuildAuditInput): {
        action: string;
        actorId: any;
        targetId: string;
        sessionId: any;
        ipAddress: string;
        userAgent: string;
        metadata: string;
    };
    logFromRequest(req: Request & {
        user?: any;
    }, input: BuildAuditInput): Promise<void>;
    logDirect(input: DirectAuditInput): Promise<void>;
    extractRequestMeta(req: Request): {
        ipAddress: string;
        userAgent: string;
    };
    private stringifyMetadata;
}
export {};
