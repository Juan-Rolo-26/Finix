import { Controller, Get, Patch, Query, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { PrismaService } from '../prisma.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('kpis')
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
    async getUsers(@Query() query: any) {
        const { search, role, status, page = '1', limit = '50' } = query;

        const whereClause: any = {};
        if (search) {
            whereClause.OR = [
                { username: { contains: search } },
                { email: { contains: search } },
            ];
        }
        if (role) whereClause.role = role;
        if (status) whereClause.status = status;

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

    @Patch('users/:id')
    async updateUser(@Param('id') id: string, @Body() body: any, @Req() req: any) {
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

    @Get('posts')
    async getPosts(@Query() query: any) {
        const { search, visibility, page = '1', limit = '50' } = query;

        const whereClause: any = { deletedAt: null };
        if (search) {
            whereClause.content = { contains: search };
        }
        if (visibility) whereClause.visibility = visibility;

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

    @Patch('posts/:id')
    async updatePost(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        const { visibility, deleted } = body;
        const adminUser = req.user;

        const updateData: any = {};
        if (visibility) updateData.visibility = visibility;
        if (deleted === true) updateData.deletedAt = new Date();

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

    @Get('reports')
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
    async resolveReport(@Param('id') id: string, @Body() body: any, @Req() req: any) {
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

    @Get('audit-logs')
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
}
