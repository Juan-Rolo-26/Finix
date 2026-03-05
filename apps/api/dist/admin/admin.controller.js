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
let AdminController = class AdminController {
    constructor(prisma) {
        this.prisma = prisma;
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
        const { search, role, status, page = '1', limit = '50' } = query;
        const whereClause = {};
        if (search) {
            whereClause.OR = [
                { username: { contains: search } },
                { email: { contains: search } },
            ];
        }
        if (role)
            whereClause.role = role;
        if (status)
            whereClause.status = status;
        const skip = (Number(page) - 1) * Number(limit);
        const users = await this.prisma.user.findMany({
            where: whereClause,
            take: Number(limit),
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
        return { data: users, total, page: Number(page), limit: Number(limit) };
    }
    async updateUser(id, body, req) {
        const { status, shadowbanned, role } = body;
        const adminUser = req.user;
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { status, shadowbanned, role },
        });
        await this.prisma.adminAuditLog.create({
            data: {
                action: status === 'BANNED' ? 'BAN_USER' : 'UPDATE_USER',
                actorId: adminUser.id,
                targetId: id,
                metadata: JSON.stringify({ status, shadowbanned, role }),
            },
        });
        return { data: updatedUser };
    }
    async getPosts(query) {
        const { search, visibility, page = '1', limit = '50' } = query;
        const whereClause = { deletedAt: null };
        if (search) {
            whereClause.content = { contains: search };
        }
        if (visibility)
            whereClause.visibility = visibility;
        const skip = (Number(page) - 1) * Number(limit);
        const posts = await this.prisma.post.findMany({
            where: whereClause,
            take: Number(limit),
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
        return { data: posts, total, page: Number(page), limit: Number(limit) };
    }
    async updatePost(id, body, req) {
        const { visibility, deleted } = body;
        const adminUser = req.user;
        const updateData = {};
        if (visibility)
            updateData.visibility = visibility;
        if (deleted === true)
            updateData.deletedAt = new Date();
        const updatedPost = await this.prisma.post.update({
            where: { id },
            data: updateData,
        });
        await this.prisma.adminAuditLog.create({
            data: {
                action: deleted ? 'DELETE_POST' : (visibility === 'HIDDEN' ? 'HIDE_POST' : 'UPDATE_POST'),
                actorId: adminUser.id,
                targetId: id,
                metadata: JSON.stringify({ visibility, deleted }),
            },
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
        const { status, resolutionNote } = body;
        const adminUser = req.user;
        const updatedReport = await this.prisma.report.update({
            where: { id },
            data: { status, resolutionNote },
        });
        await this.prisma.adminAuditLog.create({
            data: {
                action: 'RESOLVE_REPORT',
                actorId: adminUser.id,
                targetId: id,
                metadata: JSON.stringify({ status, resolutionNote }),
            },
        });
        return { data: updatedReport };
    }
    async getAuditLogs() {
        const logs = await this.prisma.adminAuditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                actor: {
                    select: { id: true, username: true },
                },
            },
        });
        return { data: logs };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('kpis'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getKPIs", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('posts'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Patch)('posts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePost", null);
__decorate([
    (0, common_1.Get)('reports'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getReports", null);
__decorate([
    (0, common_1.Patch)('reports/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolveReport", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map