import {
    BadRequestException,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Patch,
    Query,
    Body,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from './admin.guard';
import { PrismaService } from '../prisma.service';
import {
    AdminAuditLogsQueryDto,
    AdminPostsQueryDto,
    AdminResolveReportDto,
    AdminUpdatePostDto,
    AdminUpdateUserDto,
    AdminUsersQueryDto,
} from './dto/admin-management.dto';
import { AdminPermissionsGuard } from './permissions.guard';
import { RequireAdminPermissions } from './permissions.decorator';
import { AdminPermission, hasAdminPermission } from './admin-permissions';
import { AdminAuditService } from './admin-audit.service';
import { AdminManagementService } from './admin-management.service';

type AdminRequest = Request & {
    user?: {
        id: string;
        email: string;
        role: string;
        sessionId?: string;
    };
};

@Controller('admin')
@UseGuards(AdminGuard, AdminPermissionsGuard)
export class AdminController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly adminAuditService: AdminAuditService,
        private readonly adminManagementService: AdminManagementService,
    ) { }

    @Get('kpis')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
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

    @Get('users')
    @RequireAdminPermissions(AdminPermission.USERS_READ)
    async getUsers(@Query() query: AdminUsersQueryDto) {
        const whereClause: any = {};
        if (query.search) {
            whereClause.OR = [
                { username: { contains: query.search } },
                { email: { contains: query.search } },
            ];
        }
        if (query.role) whereClause.role = query.role;
        if (query.status) whereClause.status = query.status;

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

    @Patch('users/:id')
    @RequireAdminPermissions(AdminPermission.USERS_MODERATE)
    async updateUser(@Param('id') id: string, @Body() body: AdminUpdateUserDto, @Req() req: AdminRequest) {
        const adminUser = req.user;
        if (!adminUser?.id) {
            throw new ForbiddenException('Sesión admin inválida');
        }

        const updateData: any = {};
        if (body.status !== undefined) updateData.status = body.status;
        if (body.shadowbanned !== undefined) updateData.shadowbanned = body.shadowbanned;
        if (body.role !== undefined) updateData.role = body.role;

        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('No se enviaron campos válidos para actualizar');
        }

        const roleChangeRequested = typeof body.role === 'string';
        if (roleChangeRequested && !this.canChangeRoles(adminUser)) {
            throw new ForbiddenException('Requiere permiso para cambio de rol');
        }

        if (id === adminUser.id && roleChangeRequested && body.role && !this.isAdminRole(body.role)) {
            throw new ForbiddenException('No puedes quitarte acceso admin a ti mismo');
        }

        let action = 'UPDATE_USER';
        if (roleChangeRequested) {
            action = 'CHANGE_ROLE';
        } else if (body.status === 'BANNED') {
            action = 'BAN_USER';
        } else if (body.status === 'ACTIVE') {
            action = 'UNBAN_USER';
        } else if (body.shadowbanned !== undefined) {
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

    @Delete('users/:id')
    @RequireAdminPermissions(AdminPermission.USERS_DELETE)
    async deleteUser(@Param('id') id: string, @Req() req: AdminRequest) {
        const adminUser = req.user;
        if (!adminUser?.id) {
            throw new ForbiddenException('Sesión admin inválida');
        }

        const targetUser = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
            },
        });

        if (!targetUser) {
            throw new BadRequestException('Usuario no encontrado');
        }

        this.assertCanDeleteUser(adminUser, targetUser);

        const auditData = this.adminAuditService.buildAuditData(req, {
            action: 'DELETE_USER_PERMANENT',
            targetId: id,
            metadata: {
                username: targetUser.username,
                email: targetUser.email,
                role: targetUser.role,
                mode: 'permanent',
            },
        });

        const deletedUser = await this.adminManagementService.deleteUserPermanently(id, auditData);
        return { data: deletedUser };
    }

    @Get('posts')
    @RequireAdminPermissions(AdminPermission.POSTS_READ)
    async getPosts(@Query() query: AdminPostsQueryDto) {
        const whereClause: any = { deletedAt: null };
        if (query.search) {
            whereClause.content = { contains: query.search };
        }
        if (query.visibility) whereClause.visibility = query.visibility;

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

    @Patch('posts/:id')
    @RequireAdminPermissions(AdminPermission.POSTS_MODERATE)
    async updatePost(@Param('id') id: string, @Body() body: AdminUpdatePostDto, @Req() req: AdminRequest) {
        const updateData: any = {};
        if (body.visibility) updateData.visibility = body.visibility;
        if (body.deleted === true) updateData.deletedAt = new Date();

        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('No se enviaron cambios para el post');
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

    @Delete('posts/:id')
    @RequireAdminPermissions(AdminPermission.POSTS_DELETE)
    async deletePost(@Param('id') id: string, @Req() req: AdminRequest) {
        const existingPost = await this.prisma.post.findUnique({
            where: { id },
            select: {
                id: true,
                authorId: true,
                content: true,
            },
        });

        if (!existingPost) {
            throw new BadRequestException('Publicación no encontrada');
        }

        const auditData = this.adminAuditService.buildAuditData(req, {
            action: 'DELETE_POST_PERMANENT',
            targetId: id,
            metadata: {
                authorId: existingPost.authorId,
                contentPreview: existingPost.content.slice(0, 140),
                mode: 'permanent',
            },
        });

        const deletedPost = await this.adminManagementService.deletePostPermanently(id, auditData);
        return { data: deletedPost };
    }

    @Get('reports')
    @RequireAdminPermissions(AdminPermission.REPORTS_READ)
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

    @Patch('reports/:id')
    @RequireAdminPermissions(AdminPermission.REPORTS_RESOLVE)
    async resolveReport(@Param('id') id: string, @Body() body: AdminResolveReportDto, @Req() req: AdminRequest) {
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

    @Get('audit-logs')
    @RequireAdminPermissions(AdminPermission.LOGS_READ)
    async getAuditLogs(@Query() query: AdminAuditLogsQueryDto) {
        const whereClause: any = {};

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

    private canChangeRoles(user: { id: string; email: string; role: string }) {
        if (this.isOwner(user)) {
            return true;
        }

        return hasAdminPermission(user.role, AdminPermission.USERS_ROLE_CHANGE);
    }

    private isOwner(user: { id: string; email: string }) {
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

    private isAdminRole(role: string) {
        const normalized = role.toUpperCase();
        return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
    }

    private assertCanDeleteUser(
        adminUser: { id: string; email: string; role: string },
        targetUser: { id: string; email: string; role: string },
    ) {
        if (targetUser.id === adminUser.id) {
            throw new ForbiddenException('No puedes eliminar tu propia cuenta admin');
        }

        if (this.isOwner(targetUser)) {
            throw new ForbiddenException('No puedes eliminar la cuenta owner');
        }

        if (this.isAdminRole(targetUser.role) && !this.isOwner(adminUser)) {
            throw new ForbiddenException('Solo el owner puede eliminar otras cuentas admin');
        }
    }
}
