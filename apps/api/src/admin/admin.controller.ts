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
    Post,
    UseGuards,
    Req,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { extname } from 'path';
import { readFileSync, unlinkSync } from 'fs';
import { AdminGuard } from './admin.guard';
import { PrismaService } from '../prisma.service';
import {
    AdminAuditLogsQueryDto,
    AdminPostsQueryDto,
    AdminResolveReportDto,
    AdminSendProEmailDto,
    AdminUpdatePostDto,
    AdminUpdateUserDto,
    AdminUsersQueryDto,
} from './dto/admin-management.dto';
import { AdminPermissionsGuard } from './permissions.guard';
import { RequireAdminPermissions } from './permissions.decorator';
import { AdminPermission, hasAdminPermission } from './admin-permissions';
import { AdminAuditService } from './admin-audit.service';
import { AdminManagementService } from './admin-management.service';
import { NewsService } from '../news/news.service';
import { AnalysisService } from '../analysis/analysis.service';
import { ProEmailCampaignService } from './pro-email-campaign.service';
import { ValueCreationService } from '../market/value-creation.service';
import { EmailMarketingService } from './email-marketing.service';
import { buildUploadPublicPath, getUploadFolder } from '../uploads/upload-url.util';

type AdminRequest = Request & {
    user?: {
        id: string;
        email: string;
        role: string;
        sessionId?: string;
    };
};

const ANALYSIS_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_ANALYSIS_IMAGE_BYTES = 15 * 1024 * 1024;

function hasExpectedAnalysisImageSignature(path: string, mimeType: string) {
    const header = readFileSync(path).subarray(0, 16);
    if (mimeType === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    if (mimeType === 'image/png') return header.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    if (mimeType === 'image/gif') return header.subarray(0, 6).toString('ascii') === 'GIF87a' || header.subarray(0, 6).toString('ascii') === 'GIF89a';
    if (mimeType === 'image/webp') return header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
    return false;
}

const analysisSnapshotStorage = diskStorage({
    destination: (_req, _file, cb) => cb(null, getUploadFolder('analysis')),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
    },
});

@Controller('admin')
@UseGuards(AdminGuard, AdminPermissionsGuard)
export class AdminController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly adminAuditService: AdminAuditService,
        private readonly adminManagementService: AdminManagementService,
        private readonly newsService: NewsService,
        private readonly analysisService: AnalysisService,
        private readonly proEmailCampaignService: ProEmailCampaignService,
        private readonly valueCreationService: ValueCreationService,
        private readonly emailMarketingService: EmailMarketingService,
    ) { }

    @Get('email-marketing/dashboard')
    @RequireAdminPermissions(AdminPermission.EMAIL_VIEW)
    async getEmailMarketingDashboard() { return this.emailMarketingService.dashboard(); }

    @Get('email-marketing/templates')
    @RequireAdminPermissions(AdminPermission.EMAIL_VIEW)
    async getEmailTemplates() { return this.emailMarketingService.templates(); }

    @Post('email-marketing/preview')
    @RequireAdminPermissions(AdminPermission.EMAIL_CREATE)
    previewEmail(@Body() body: unknown) { return this.emailMarketingService.preview(body); }

    @Post('email-marketing/test')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @RequireAdminPermissions(AdminPermission.EMAIL_SEND)
    testEmail(@Body() body: any) { return this.emailMarketingService.test(body.campaign, body.email); }

    @Post('email-marketing/media')
    @Throttle({ default: { limit: 15, ttl: 60000 } })
    @RequireAdminPermissions(AdminPermission.EMAIL_CREATE)
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
    uploadEmailImage(@Req() req: AdminRequest, @UploadedFile() file: { buffer: Buffer }) {
        return this.emailMarketingService.upload(req.user!.id, file?.buffer);
    }

    @Post('email-marketing/campaigns')
    @RequireAdminPermissions(AdminPermission.EMAIL_CREATE, AdminPermission.EMAIL_SEND)
    async createEmailMarketingCampaign(@Req() req: AdminRequest, @Body() body: any) {
        const result = await this.emailMarketingService.createCampaign(req.user!.id, body);
        await this.adminAuditService.logFromRequest(req, { action: 'CREATE_EMAIL_CAMPAIGN', targetId: result.id, metadata: { audience: result.audience, recipientCount: result.recipientCount, status: result.status } });
        return result;
    }

    @Post('email-marketing/campaigns/:id/process')
    @RequireAdminPermissions(AdminPermission.EMAIL_SEND)
    async processEmailMarketingCampaign(@Param('id') id: string) { return this.emailMarketingService.processBatch(id); }

    @Get('email-marketing/campaigns/:id')
    @RequireAdminPermissions(AdminPermission.EMAIL_VIEW)
    async getEmailCampaignDetail(@Param('id') id: string) {
        return this.emailMarketingService.getCampaignDetail(id);
    }

    @Post('email-marketing/campaigns/:id/retry')
    @RequireAdminPermissions(AdminPermission.EMAIL_SEND)
    async retryEmailCampaign(@Param('id') id: string) {
        return this.emailMarketingService.retryFailedRecipients(id);
    }

    @Get('email-marketing/analysis-details/:id')
    @RequireAdminPermissions(AdminPermission.EMAIL_VIEW)
    async getAnalysisDetailsForEmail(@Param('id') id: string) {
        return this.emailMarketingService.getAnalysisDetailsForEmail(id);
    }

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

    // ============================================
    // PRO INVESTMENT EMAIL CAMPAIGNS
    // ============================================

    @Get('pro-email/summary')
    @RequireAdminPermissions(AdminPermission.EMAIL_BROADCAST)
    async getProEmailSummary() {
        return this.proEmailCampaignService.getSummary();
    }

    @Post('pro-email/campaigns')
    @RequireAdminPermissions(AdminPermission.EMAIL_BROADCAST)
    async sendProEmailCampaign(
        @Req() req: AdminRequest,
        @Body() body: AdminSendProEmailDto,
    ) {
        const result = await this.proEmailCampaignService.sendCampaign(req.user!.id, body);
        await this.adminAuditService.logFromRequest(req, {
            action: 'SEND_PRO_EMAIL_CAMPAIGN',
            targetId: result.campaign.id,
            metadata: {
                recipientCount: result.recipientCount,
                sentCount: result.sentCount,
                failedCount: result.failedCount,
                subject: body.subject,
            },
        });
        return result;
    }

    // ============================================
    // MANUAL NEWS MANAGEMENT
    // ============================================

    @Get('news')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async getAdminNews() {
        // Return only admin added news
        const news = await this.prisma.news.findMany({
            where: {
                source: {
                    name: 'Finix Admin',
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return { data: news };
    }

    @Post('news/scrape')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ) // or separate permission for writing content
    async addManualNews(@Body() body: { url: string; categoryId?: string }) {
        if (!body.url) throw new BadRequestException('Se requiere una URL');
        try {
            const result = await this.newsService.addManualNews(body.url, body.categoryId);
            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    @Delete('news/:id')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async deleteManualNews(@Param('id') id: string) {
        await this.prisma.news.delete({ where: { id } });
        return { success: true };
    }

    // ============================================
    // ASSET ANALYSIS MANAGEMENT (FINIX PRO CMS)
    // ============================================

    @Get('analysis')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async getAnalyses() {
        const analyses = await this.analysisService.getAdminList();
        return { data: analyses };
    }

    @Get('analysis/tradingview/fetch')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async fetchTradingViewData(@Query('symbol') symbol: string) {
        const data = await this.analysisService.fetchTradingViewAssetData(symbol);
        return { data };
    }

    @Get('analysis/value-creation/fetch')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async fetchValueCreationData(@Query('symbol') symbol: string) {
        const cleanSymbol = String(symbol || '').trim().split(':').pop() || '';
        if (!cleanSymbol) throw new BadRequestException('Se requiere un ticker');
        const data = await this.valueCreationService.getTickerValueCreation(cleanSymbol);
        if (!data) throw new BadRequestException(`No hay cobertura ROIC-WACC disponible para ${cleanSymbol.toUpperCase()}`);
        return { data };
    }

    @Post('analysis/upload-snapshot')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: analysisSnapshotStorage,
            limits: { fileSize: MAX_ANALYSIS_IMAGE_BYTES, files: 1 },
            fileFilter: (_req, file, cb) => {
                if (!ANALYSIS_IMAGE_MIMES.includes(file.mimetype)) {
                    return cb(new BadRequestException('Solo se permiten capturas JPG, PNG, WEBP o GIF'), false);
                }
                cb(null, true);
            },
        }),
    )
    uploadAnalysisSnapshot(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No se recibió ninguna captura');

        if (!hasExpectedAnalysisImageSignature(file.path, file.mimetype)) {
            try { unlinkSync(file.path); } catch { /* best effort cleanup */ }
            throw new BadRequestException('El contenido de la captura no coincide con su tipo declarado');
        }

        return {
            url: buildUploadPublicPath('analysis', file.filename),
            mediaType: 'image',
            originalName: file.originalname,
            size: file.size,
        };
    }

    @Get('analysis/:id')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async getAnalysisById(@Param('id') id: string) {
        const analysis = await this.analysisService.getAdminById(id);
        return { data: analysis };
    }

    @Post('analysis')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async createAnalysis(@Req() req: AdminRequest, @Body() body: any) {
        const analysis = await this.analysisService.createAnalysis(body, req.user?.id);
        return { data: analysis };
    }

    @Patch('analysis/:id')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async updateAnalysis(@Param('id') id: string, @Req() req: AdminRequest, @Body() body: any) {
        const analysis = await this.analysisService.updateAnalysis(id, body, req.user?.id);
        return { data: analysis };
    }

    @Patch('analysis/:id/status')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async updateAnalysisStatus(@Param('id') id: string, @Req() req: AdminRequest, @Body() body: { status: string }) {
        const analysis = await this.analysisService.updateStatus(id, body.status, req.user?.id);
        return { data: analysis };
    }

    @Delete('analysis/:id')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async deleteAnalysis(@Param('id') id: string, @Req() req: AdminRequest) {
        await this.analysisService.deleteAnalysis(id, req.user?.id);
        return { success: true };
    }

    @Post('analysis/seed-sample')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async seedSampleAnalysis(@Req() req: AdminRequest) {
        const result = await this.analysisService.seedAppleSample(req.user?.id);
        return result;
    }

    // ============================================
    // VERIFICATION REQUESTS
    // ============================================

    @Get('verifications')
    @RequireAdminPermissions(AdminPermission.USERS_READ)
    async getVerifications() {
        const verifications = await this.prisma.financialAdvisorVerification.findMany({
            include: { user: { select: { username: true, email: true, id: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return { data: verifications };
    }

    @Patch('verifications/:id/status')
    @RequireAdminPermissions(AdminPermission.USERS_MODERATE)
    async updateVerificationStatus(
        @Param('id') id: string,
        @Body() body: { status: string; reason?: string },
        @Req() req: AdminRequest
    ) {
        if (!['approved', 'rejected', 'pending', 'suspended'].includes(body.status)) {
            throw new BadRequestException('Estado inválido');
        }

        const adminId = req.user?.id;

        const updated = await this.prisma.$transaction(async (tx) => {
            const current = await tx.financialAdvisorVerification.findUnique({ where: { id } });
            if (!current) throw new BadRequestException('Request no encontrado');

            const verification = await tx.financialAdvisorVerification.update({
                where: { id },
                data: {
                    status: body.status,
                    reviewedById: adminId,
                    reviewedAt: new Date(),
                    rejectionReason: body.reason,
                }
            });

            // If approved, update user's profile
            if (body.status === 'approved') {
                await tx.user.update({
                    where: { id: verification.userId },
                    data: {
                        isVerified: true,
                        financialAdvisorVerified: true,
                    }
                });
            } else if (body.status === 'rejected' || body.status === 'suspended') {
                await tx.user.update({
                    where: { id: verification.userId },
                    data: {
                        isVerified: false,
                        financialAdvisorVerified: false,
                    }
                });
            }

            // Create audit log
            await tx.financialVerificationAuditLog.create({
                data: {
                    verificationId: id,
                    adminId,
                    action: 'UPDATE_STATUS',
                    previousStatus: current.status,
                    newStatus: body.status,
                    reason: body.reason
                }
            });

            return verification;
        });

        return { data: updated };
    }

    // ============================================
    // NEW ADMIN SECTIONS
    // ============================================

    @Get('statistics')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async getDetailedStatistics() {
        // We aggregate more stats for the advanced statistics page
        const [
            totalUsers,
            proUsers,
            totalPosts,
            totalCommunities,
            totalRevenue,
            usersLast7Days,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { accountType: 'PRO' } }),
            this.prisma.post.count({ where: { deletedAt: null } }),
            this.prisma.community.count(),
            this.prisma.finixRevenue.aggregate({ _sum: { totalAmount: true } }),
            this.prisma.user.count({
                where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
            })
        ]);

        return {
            data: {
                totalUsers,
                proUsers,
                totalPosts,
                totalCommunities,
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                usersLast7Days,
            }
        };
    }

    @Get('communities')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async getCommunities(@Query('page') page: string = '1', @Query('limit') limit: string = '20') {
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        const communities = await this.prisma.community.findMany({
            take: limitNumber,
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: { id: true, username: true, email: true }
                },
                _count: {
                    select: { members: true, posts: true }
                }
            }
        });

        const total = await this.prisma.community.count();

        return { data: communities, total, page: pageNumber, limit: limitNumber };
    }

    @Get('communities/:id')
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async getCommunity(@Param('id') id: string) {
        const community = await this.prisma.community.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, username: true, email: true } },
                members: { include: { user: { select: { id: true, username: true, email: true } } }, orderBy: { joinedAt: 'asc' } },
                posts: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50, include: { author: { select: { username: true } } } },
                _count: { select: { members: true, posts: true, reports: true } },
            },
        });
        if (!community) throw new BadRequestException('Comunidad no encontrada');
        return community;
    }

    @Patch('communities/:id/status')
    @RequireAdminPermissions(AdminPermission.POSTS_MODERATE)
    async updateCommunityStatus(@Param('id') id: string, @Body('status') status: string) {
        const allowed = ['PUBLISHED', 'SUSPENDED', 'ARCHIVED'];
        if (!allowed.includes(status)) throw new BadRequestException('Estado de comunidad inválido');
        return this.prisma.community.update({ where: { id }, data: { status } });
    }

    @Patch('communities/:id/feature')
    @RequireAdminPermissions(AdminPermission.POSTS_MODERATE)
    async featureCommunity(@Param('id') id: string, @Body('isFeatured') isFeatured: boolean) {
        return this.prisma.community.update({ where: { id }, data: { isFeatured: Boolean(isFeatured) } });
    }

    @Delete('communities/:id')
    @RequireAdminPermissions(AdminPermission.POSTS_DELETE)
    async deleteCommunity(@Param('id') id: string) {
        await this.prisma.community.update({ where: { id }, data: { status: 'ARCHIVED' } });
        return { success: true, message: 'Comunidad archivada correctamente' };
    }

    @Get('pro-users')
    @RequireAdminPermissions(AdminPermission.USERS_READ)
    async getProUsers(@Query('page') page: string = '1', @Query('limit') limit: string = '20') {
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        const users = await this.prisma.user.findMany({
            where: {
                OR: [
                    { accountType: 'PRO' },
                    { plan: 'PRO' },
                    { subscriptions: { some: { status: 'ACTIVE' } } }
                ]
            },
            take: limitNumber,
            skip,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                accountType: true,
                plan: true,
                aiUsageThisMonth: true,
                aiUsageLimit: true,
                createdAt: true,
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, status: true, planType: true }
                }
            }
        });

        const total = await this.prisma.user.count({
            where: {
                OR: [
                    { accountType: 'PRO' },
                    { plan: 'PRO' },
                    { subscriptions: { some: { status: 'ACTIVE' } } }
                ]
            }
        });

        return { data: users, total, page: pageNumber, limit: limitNumber };
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

        const pageNumber = parseInt(String(query.page), 10) || 1;
        const limitNumber = parseInt(String(query.limit), 10) || 50;
        const skip = (pageNumber - 1) * limitNumber;

        const users = await this.prisma.user.findMany({
            where: whereClause,
            take: limitNumber,
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

        return { data: users, total, page: pageNumber, limit: limitNumber };
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
        if (query.type) whereClause.type = query.type;
        if (query.author) {
            whereClause.author = { username: { contains: query.author } };
        }
        if (query.hasReports === 'true') {
            whereClause.reports = { some: {} };
        }

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
                media: {
                    select: { url: true, mediaType: true },
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
            take: 50,
            include: {
                reporter: {
                    select: {
                        username: true,
                        id: true,
                        avatarUrl: true,
                        email: true,
                    }
                }
            }
        });

        const postIds = reports.filter(r => r.targetType === 'POST').map(r => r.targetId);
        const userIds = reports.filter(r => r.targetType === 'USER').map(r => r.targetId);
        const commentIds = reports.filter(r => r.targetType === 'COMMENT').map(r => r.targetId);

        const [posts, users, comments] = await Promise.all([
            postIds.length > 0
                ? this.prisma.post.findMany({
                    where: { id: { in: postIds } },
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                                status: true,
                                role: true,
                            },
                        },
                        media: {
                            select: { url: true, mediaType: true },
                        },
                        _count: {
                            select: { likes: true, comments: true },
                        },
                    },
                })
                : [],
            userIds.length > 0
                ? this.prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        avatarUrl: true,
                        role: true,
                        status: true,
                        accountType: true,
                        createdAt: true,
                        _count: {
                            select: { posts: true },
                        },
                    },
                })
                : [],
            commentIds.length > 0
                ? this.prisma.comment.findMany({
                    where: { id: { in: commentIds } },
                    include: {
                        author: {
                            select: { id: true, username: true, avatarUrl: true, status: true },
                        },
                        post: {
                            select: { id: true, content: true },
                        },
                    },
                })
                : [],
        ]);

        const postMap = new Map<string, any>();
        posts.forEach(p => postMap.set(p.id, p));
        const userMap = new Map<string, any>();
        users.forEach(u => userMap.set(u.id, u));
        const commentMap = new Map<string, any>();
        comments.forEach(c => commentMap.set(c.id, c));

        const enriched = reports.map(r => {
            let target: any = null;
            if (r.targetType === 'POST') {
                target = postMap.get(r.targetId) || null;
            } else if (r.targetType === 'USER') {
                target = userMap.get(r.targetId) || null;
            } else if (r.targetType === 'COMMENT') {
                target = commentMap.get(r.targetId) || null;
            }
            return {
                ...r,
                target,
            };
        });

        return { data: enriched };
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
