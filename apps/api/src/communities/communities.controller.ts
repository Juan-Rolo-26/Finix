import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import {
    CreateCommunityDto,
    CreateCommunityPostDto,
    CreateCommunityResourceDto,
    UpdateCommunityDto,
} from './dto/create-community.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { RequirePaidCommunityAccessGuard } from '../access/require-paid-community-access.guard';
import { RequireCreatorGuard } from '../access/require-creator.guard';

@Controller('communities')
export class CommunitiesController {
    constructor(private readonly communitiesService: CommunitiesService) { }

    @UseGuards(JwtAuthGuard, RequireCreatorGuard)
    @Post()
    create(@Request() req: any, @Body() createCommunityDto: CreateCommunityDto) {
        return this.communitiesService.create(req.user.id, createCommunityDto);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.communitiesService.findAll(query);
    }

    @UseGuards(JwtAuthGuard, RequireCreatorGuard)
    @Get('mine')
    myCommunities(@Request() req: any) {
        return this.communitiesService.getMyCommunities(req.user.id);
    }

    @UseGuards(JwtAuthGuard, RequireCreatorGuard)
    @Get('creator/stats')
    creatorStats(@Request() req: any) {
        return this.communitiesService.getCreatorStats(req.user.id);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/posts')
    listPosts(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.listPosts(id, req.user?.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/posts')
    createPost(@Param('id') id: string, @Request() req: any, @Body() dto: CreateCommunityPostDto) {
        return this.communitiesService.createPost(req.user.id, id, dto);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/resources')
    listResources(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.listResources(id, req.user?.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/resources')
    createResource(@Param('id') id: string, @Request() req: any, @Body() dto: CreateCommunityResourceDto) {
        return this.communitiesService.createResource(req.user.id, id, dto);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/stats')
    getCommunityStats(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.getCommunityStats(id, req.user?.id);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.findOne(id, req.user?.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/join')
    join(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.joinFree(req.user.id, id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/subscribe')
    subscribe(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.createSubscriptionSession(req.user.id, id);
    }

    @UseGuards(JwtAuthGuard, RequirePaidCommunityAccessGuard)
    @Get(':id/private-access')
    checkPaidAccess() {
        return { access: true };
    }

    @UseGuards(JwtAuthGuard, RequireCreatorGuard)
    @Get(':id/members')
    members(@Param('id') id: string, @Request() req: any) {
        return this.communitiesService.getCommunityMembers(req.user.id, id);
    }

    @UseGuards(JwtAuthGuard, RequireCreatorGuard)
    @Patch(':id/pricing')
    updatePricing(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateCommunityDto) {
        return this.communitiesService.updatePricing(req.user.id, id, dto);
    }

    @UseGuards(JwtAuthGuard, RequireCreatorGuard)
    @Delete(':id/members/:memberUserId')
    removeMember(
        @Param('id') id: string,
        @Param('memberUserId') memberUserId: string,
        @Request() req: any,
    ) {
        return this.communitiesService.removeMember(req.user.id, id, memberUserId);
    }
}
