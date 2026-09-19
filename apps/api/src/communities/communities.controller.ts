import {
    Body, Controller, Delete, Get, Param, Patch, Post,
    Query, Request, UseGuards,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import {
    CreateCommunityDto,
    CreateCommunityPostDto,
    CreateCommunityResourceDto,
    UpdateCommunityDto,
    CreateEventDto,
    CommunityPlanDto,
    CreateSectionDto,
    UpdateSectionDto,
    ReorderSectionsDto,
    CreateReportDto,
    ResolveReportDto,
    CreateJoinRequestDto,
    ReviewJoinRequestDto,
    CreateInviteDto,
    ManageMemberDto,
    SubscribeCommunityDto,
    PayWithCardDto,
} from './dto/create-community.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('communities')
export class CommunitiesController {
    constructor(private readonly communitiesService: CommunitiesService) { }

    // ─── Discovery ────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get()
    findAll(@Query() query: any, @Request() req: any) {
        return this.communitiesService.findAll(query, req.user?.id);
    }

    // ─── My Communities ───────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('me/created')
    myCommunities(@Request() req: any) {
        return this.communitiesService.getMyCommunities(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/joined')
    myJoinedCommunities(@Request() req: any) {
        return this.communitiesService.getJoinedCommunities(req.user.id);
    }

    // ─── Invites Public Inspection ────────────────────────────────────────────

    @Get('invites/:code')
    getInvite(@Param('code') code: string) {
        return this.communitiesService.getInvite(code);
    }

    @UseGuards(JwtAuthGuard)
    @Post('invites/:code/accept')
    acceptInvite(@Param('code') code: string, @Request() req: any) {
        return this.communitiesService.acceptInvite(code, req.user.id);
    }

    // ─── Detail ───────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.findOne(id, req.user?.id);
    }

    // ─── CRUD (CREATOR PLAN GATED) ────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() dto: CreateCommunityDto) {
        return this.communitiesService.create(req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateCommunityDto) {
        return this.communitiesService.update(id, req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.remove(id, req.user.id);
    }

    // ─── Sections ─────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/sections')
    listSections(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.listSections(id, req.user?.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/sections')
    createSection(@Param('id') id: string, @Request() req: any, @Body() dto: CreateSectionDto) {
        return this.communitiesService.createSection(id, req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/sections/reorder')
    reorderSections(@Param('id') id: string, @Request() req: any, @Body() dto: ReorderSectionsDto) {
        return this.communitiesService.reorderSections(id, req.user.id, dto.sectionIds);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/sections/:sectionId')
    updateSection(
        @Param('id') id: string,
        @Param('sectionId') sectionId: string,
        @Request() req: any,
        @Body() dto: UpdateSectionDto,
    ) {
        return this.communitiesService.updateSection(id, sectionId, req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/sections/:sectionId')
    deleteSection(
        @Param('id') id: string,
        @Param('sectionId') sectionId: string,
        @Request() req: any,
    ) {
        return this.communitiesService.deleteSection(id, sectionId, req.user.id);
    }

    // ─── Members ─────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/join')
    join(@Param('id') id: string, @Request() req: any, @Body() body: { planId?: string }) {
        return this.communitiesService.joinFree(req.user.id, id, body?.planId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/leave')
    leave(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.leave(req.user.id, id);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/members')
    getMembers(@Param('id') id: string, @Query() query: any) {
        return this.communitiesService.getMembers(id, query);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/members/:userId/role')
    manageMemberRole(
        @Param('id') id: string,
        @Param('userId') targetUserId: string,
        @Request() req: any,
        @Body() body: ManageMemberDto,
    ) {
        return this.communitiesService.manageMemberRole(id, targetUserId, body.role, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/members/:userId')
    removeMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
        return this.communitiesService.removeMember(id, userId, req.user.id);
    }

    // ─── Subscriptions & Payments ─────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/checkout')
    createCheckout(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: SubscribeCommunityDto,
    ) {
        return this.communitiesService.createCheckoutSession(req.user.id, id, body.planId, body.provider || 'stripe');
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/pay-card')
    payWithCard(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: PayWithCardDto,
    ) {
        return this.communitiesService.processCardPayment(req.user.id, id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/cancel-subscription')
    cancelSubscription(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.cancelSubscription(req.user.id, id);
    }

    // ─── Posts ────────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/posts')
    listPosts(@Param('id') id: string, @Request() req: any, @Query() query: any) {
        return this.communitiesService.listPosts(id, req.user?.id, query);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/posts')
    createPost(@Param('id') id: string, @Request() req: any, @Body() dto: CreateCommunityPostDto) {
        return this.communitiesService.createPost(req.user.id, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/posts/:postId/pin')
    pinPost(
        @Param('id') id: string,
        @Param('postId') postId: string,
        @Request() req: any,
        @Body() body: { isPinned: boolean },
    ) {
        return this.communitiesService.pinPost(id, postId, req.user.id, Boolean(body.isPinned));
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/posts/:postId')
    deletePost(@Param('id') id: string, @Param('postId') postId: string, @Request() req: any) {
        return this.communitiesService.deletePost(id, postId, req.user.id);
    }

    // ─── Moderation & Reports ─────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/reports')
    createReport(@Param('id') id: string, @Request() req: any, @Body() dto: CreateReportDto) {
        return this.communitiesService.createReport(id, req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/reports')
    listReports(@Param('id') id: string, @Request() req: any, @Query('status') status: string) {
        return this.communitiesService.listReports(id, req.user.id, status || 'PENDING');
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/reports/:reportId')
    resolveReport(
        @Param('id') id: string,
        @Param('reportId') reportId: string,
        @Request() req: any,
        @Body() dto: ResolveReportDto,
    ) {
        return this.communitiesService.resolveReport(id, reportId, req.user.id, dto);
    }

    // ─── Join Requests ────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/join-requests')
    createJoinRequest(@Param('id') id: string, @Request() req: any, @Body() dto: CreateJoinRequestDto) {
        return this.communitiesService.createJoinRequest(id, req.user.id, dto.note);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/join-requests')
    listJoinRequests(@Param('id') id: string, @Request() req: any, @Query('status') status: string) {
        return this.communitiesService.listJoinRequests(id, req.user.id, status || 'PENDING');
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/join-requests/:requestId')
    reviewJoinRequest(
        @Param('id') id: string,
        @Param('requestId') requestId: string,
        @Request() req: any,
        @Body() dto: ReviewJoinRequestDto,
    ) {
        return this.communitiesService.reviewJoinRequest(id, requestId, dto.status, req.user.id);
    }

    // ─── Invites ──────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/invites')
    createInvite(@Param('id') id: string, @Request() req: any, @Body() dto: CreateInviteDto) {
        return this.communitiesService.createInvite(id, req.user.id, dto);
    }

    // ─── Plans ───────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/plans')
    createPlan(@Param('id') id: string, @Request() req: any, @Body() dto: CommunityPlanDto) {
        return this.communitiesService.createPlan(id, req.user.id, Object.assign(dto, { communityId: id }));
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/plans/:planId')
    deletePlan(@Param('id') id: string, @Param('planId') planId: string, @Request() req: any) {
        return this.communitiesService.deletePlan(id, planId, req.user.id);
    }

    // ─── Resources ───────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/resources')
    listResources(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.listResources(id, req.user?.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/resources')
    createResource(@Param('id') id: string, @Request() req: any, @Body() dto: CreateCommunityResourceDto) {
        return this.communitiesService.createResource(id, req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/resources/:resourceId')
    deleteResource(@Param('id') id: string, @Param('resourceId') resourceId: string, @Request() req: any) {
        return this.communitiesService.deleteResource(id, resourceId, req.user.id);
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/events')
    listEvents(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.listEvents(id, req.user?.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/events')
    createEvent(@Param('id') id: string, @Request() req: any, @Body() dto: CreateEventDto) {
        return this.communitiesService.createEvent(id, req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/events/:eventId')
    deleteEvent(@Param('id') id: string, @Param('eventId') eventId: string, @Request() req: any) {
        return this.communitiesService.deleteEvent(id, eventId, req.user.id);
    }

    // ─── Creator Studio & Analytics ───────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get(':id/analytics')
    getAnalytics(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.getAnalytics(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/finances')
    getFinancials(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.getFinancials(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/payment-gateway')
    updatePaymentGateway(@Param('id') id: string, @Request() req: any, @Body() body: any) {
        return this.communitiesService.updatePaymentGateway(id, req.user.id, body);
    }

    // ─── Platform Admin Operations ────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Patch(':id/featured')
    setFeatured(@Param('id') id: string, @Request() req: any, @Body() body: { isFeatured: boolean }) {
        return this.communitiesService.setFeatured(id, req.user.id, Boolean(body.isFeatured));
    }
}
