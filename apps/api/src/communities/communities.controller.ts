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

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.findOne(id, req.user?.id);
    }

    // ─── My communities ───────────────────────────────────────────────────────

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

    // ─── CRUD ─────────────────────────────────────────────────────────────────

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
    @Delete(':id/members/:userId')
    removeMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
        return this.communitiesService.removeMember(id, userId, req.user.id);
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
    @Delete(':id/posts/:postId')
    deletePost(@Param('id') id: string, @Param('postId') postId: string, @Request() req: any) {
        return this.communitiesService.deletePost(id, postId, req.user.id);
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

    // ─── Analytics (creator dashboard) ───────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get(':id/analytics')
    getAnalytics(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.getAnalytics(id, req.user.id);
    }
}
