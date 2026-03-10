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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_guard_1 = require("./admin.guard");
const prisma_service_1 = require("../prisma.service");
const admin_management_dto_1 = require("./dto/admin-management.dto");
const permissions_guard_1 = require("./permissions.guard");
const permissions_decorator_1 = require("./permissions.decorator");
const admin_permissions_1 = require("./admin-permissions");
const admin_audit_service_1 = require("./admin-audit.service");
let AdminController = class AdminController {
    constructor(prisma, adminAuditService) {
        this.prisma = prisma;
        this.adminAuditService = adminAuditService;
    }
    async getKPIs() {
        const totalUsers = await this.prisma.user.count();
        const activeUsersCount = await this.prisma.user.count({ where: { status: 'ACTIVE' } });
        const totalPosts = await this.prisma.post.count({ where: { deletedAt: null } });
        const pendingReports = await this.prisma.report.count({ where: { status: 'OPEN' } });
        return {
            kpis: {
                totalUsers,
                activeUsersCount,
                totalPosts,
                pendingReports,
            },
        };
    }
    async getUsers(query) {
        const whereClause = {};
        if (query.search) {
            whereClause.OR = [
                { username: { contains: query.search } },
                { email: { contains: query.search } },
            ];
        }
        if (query.role)
            whereClause.role = query.role;
        if (query.status)
            whereClause.status = query.status;
        const skip = (query.page - 1) * query.limit;
        const users = await this.prisma.user.findMany({
            where: whereClause,
            take: query.limit,
            skip,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                shadowbanned: true,
                lastLogin: true,
                createdAt: true,
                flags: true,
            },
        });
        const total = await this.prisma.user.count({ where: whereClause });
        return { data: users, total, page: query.page, limit: query.limit };
    }
    async updateUser(id, body, req) {
        const adminUser = req.user;
        if (!adminUser?.id) {
            throw new common_1.ForbiddenException('Sesión admin inválida');
        }
        const updateData = {};
        if (body.status !== undefined)
            updateData.status = body.status;
        if (body.shadowbanned !== undefined)
            updateData.shadowbanned = body.shadowbanned;
        if (body.role !== undefined)
            updateData.role = body.role;
        if (Object.keys(updateData).length === 0) {
            throw new common_1.BadRequestException('No se enviaron campos válidos para actualizar');
        }
        const roleChangeRequested = typeof body.role === 'string';
        if (roleChangeRequested && !this.canChangeRoles(adminUser)) {
            throw new common_1.ForbiddenException('Requiere permiso para cambio de rol');
        }
        if (id === adminUser.id && roleChangeRequested && body.role && !this.isAdminRole(body.role)) {
            throw new common_1.ForbiddenException('No puedes quitarte acceso admin a ti mismo');
        }
        let action = 'UPDATE_USER';
        if (roleChangeRequested) {
            action = 'CHANGE_ROLE';
        }
        else if (body.status === 'BANNED') {
            action = 'BAN_USER';
        }
        else if (body.status === 'ACTIVE') {
            action = 'UNBAN_USER';
        }
        else if (body.shadowbanned !== undefined) {
            action = body.shadowbanned ? 'SHADOWBAN_USER' : 'UNSHADOWBAN_USER';
        }
        const auditData = this.adminAuditService.buildAuditData(req, {
            action,
            targetId: id,
            metadata: updateData,
        });
        const updatedUser = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id },
                data: updateData,
            });
            if (auditData) {
                await tx.adminAuditLog.create({ data: auditData });
            }
            return user;
        });
        return { data: updatedUser };
    }
    async getPosts(query) {
        const whereClause = { deletedAt: null };
        if (query.search) {
            whereClause.content = { contains: query.search };
        }
        if (query.visibility)
            whereClause.visibility = query.visibility;
        const skip = (query.page - 1) * query.limit;
        const posts = await this.prisma.post.findMany({
            where: whereClause,
            take: query.limit,
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true },
                },
                _count: {
                    select: { likes: true, comments: true, reports: true },
                },
            },
        });
        const total = await this.prisma.post.count({ where: whereClause });
        return { data: posts, total, page: query.page, limit: query.limit };
    }
    async updatePost(id, body, req) {
        const updateData = {};
        if (body.visibility)
            updateData.visibility = body.visibility;
        if (body.deleted === true)
            updateData.deletedAt = new Date();
        if (Object.keys(updateData).length === 0) {
            throw new common_1.BadRequestException('No se enviaron cambios para el post');
        }
        const action = body.deleted
            ? 'DELETE_POST'
            : (body.visibility === 'HIDDEN' ? 'HIDE_POST' : 'UPDATE_POST');
        const auditData = this.adminAuditService.buildAuditData(req, {
            action,
            targetId: id,
            metadata: {
                visibility: body.visibility,
                deleted: body.deleted,
            },
        });
        const updatedPost = await this.prisma.$transaction(async (tx) => {
            const post = await tx.post.update({
                where: { id },
                data: updateData,
            });
            if (auditData) {
                await tx.adminAuditLog.create({ data: auditData });
            }
            return post;
        });
        return { data: updatedPost };
    }
    async getReports() {
        const reports = await this.prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: {
                    select: { id: true, username: true },
                },
            },
        });
        return { data: reports };
    }
    async resolveReport(id, body, req) {
        const status = body.status || 'RESOLVED';
        const auditData = this.adminAuditService.buildAuditData(req, {
            action: 'RESOLVE_REPORT',
            targetId: id,
            metadata: {
                status,
                resolutionNote: body.resolutionNote || null,
            },
        });
        const updatedReport = await this.prisma.$transaction(async (tx) => {
            const report = await tx.report.update({
                where: { id },
                data: {
                    status,
                    resolutionNote: body.resolutionNote || null,
                },
            });
            if (auditData) {
                await tx.adminAuditLog.create({ data: auditData });
            }
            return report;
        });
        return { data: updatedReport };
    }
    async getAuditLogs(query) {
        const whereClause = {};
        if (query.action) {
            whereClause.action = query.action;
        }
        if (query.adminId) {
            whereClause.actorId = query.adminId;
        }
        if (query.from || query.to) {
            whereClause.createdAt = {};
            if (query.from) {
                whereClause.createdAt.gte = new Date(query.from);
            }
            if (query.to) {
                whereClause.createdAt.lte = new Date(query.to);
            }
        }
        const skip = (query.page - 1) * query.limit;
        const [logs, total] = await this.prisma.$transaction([
            this.prisma.adminAuditLog.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: query.limit,
                skip,
                include: {
                    actor: {
                        select: { id: true, username: true, email: true, role: true },
                    },
                },
            }),
            this.prisma.adminAuditLog.count({ where: whereClause }),
        ]);
        return {
            data: logs,
            total,
            page: query.page,
            limit: query.limit,
        };
    }
    canChangeRoles(user) {
        if (this.isOwner(user)) {
            return true;
        }
        return (0, admin_permissions_1.hasAdminPermission)(user.role, admin_permissions_1.AdminPermission.USERS_ROLE_CHANGE);
    }
    isOwner(user) {
        const ownerId = (process.env.ADMIN_OWNER_USER_ID || '').trim();
        if (ownerId && user.id === ownerId) {
            return true;
        }
        const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || '').trim().toLowerCase();
        if (ownerEmail && user.email.toLowerCase() === ownerEmail) {
            return true;
        }
        return false;
    }
    isAdminRole(role) {
        const normalized = role.toUpperCase();
        return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('kpis'),
    (0, permissions_decorator_1.RequireAdminPermissions)(admin_permissions_1.AdminPermission.DASHBOARD_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getKPIs", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, permissions_decorator_1.RequireAdminPermissions)(admin_permissions_1.AdminPermission.USERS_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_management_dto_1.AdminUsersQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, permissions_decorator_1.RequireAdminPermissions)(admin_permissions_1.AdminPermission.USERS_MODERATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_management_dto_1.AdminUpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('posts'),
    (0, permissions_decorator_1.RequireAdminPermissions)(admin_permissions_1.AdminPermission.POSTS_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_management_dto_1.AdminPostsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Patch)('posts/:id'),
    (0, permissions_decorator_1.RequireAdminPermissions)(admin_permissions_1.AdminPermission.POSTS_MODERATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_management_dto_1.AdminUpdatePostDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePost", null);
__decorate([
    (0, common_1.Get)('reports'),
    (0, permissions_decorator_1.RequireAdminPermissions)(admin_permissions_1.AdminPermission.REPORTS_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getReports", null);
__decorate([
    (0, common_1.Patch)('reports/:id'),
    (0, permissions_decorator_1.RequireAdminPermissions)(admin_permissions_1.AdminPermission.REPORTS_RESOLVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_management_dto_1.AdminResolveReportDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolveReport", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, permissions_decorator_1.RequireAdminPermissions)(admin_permissions_1.AdminPermission.LOGS_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_management_dto_1.AdminAuditLogsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard, permissions_guard_1.AdminPermissionsGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        admin_audit_service_1.AdminAuditService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map