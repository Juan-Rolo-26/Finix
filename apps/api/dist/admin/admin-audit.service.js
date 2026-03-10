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
var AdminAuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AdminAuditService = AdminAuditService_1 = class AdminAuditService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AdminAuditService_1.name);
    }
    buildAuditData(req, input) {
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
    async logFromRequest(req, input) {
        const data = this.buildAuditData(req, input);
        if (!data) {
            return;
        }
        await this.prisma.adminAuditLog.create({ data });
    }
    async logDirect(input) {
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
        }
        catch (error) {
            this.logger.warn(`No se pudo registrar log admin directo (${input.action})`);
        }
    }
    extractRequestMeta(req) {
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
    stringifyMetadata(metadata) {
        if (!metadata) {
            return null;
        }
        try {
            return JSON.stringify(metadata);
        }
        catch {
            return JSON.stringify({ error: 'metadata_serialization_failed' });
        }
    }
};
exports.AdminAuditService = AdminAuditService;
exports.AdminAuditService = AdminAuditService = AdminAuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminAuditService);
//# sourceMappingURL=admin-audit.service.js.map