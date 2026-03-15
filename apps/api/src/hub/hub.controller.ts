import {
    Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards, Patch,
} from '@nestjs/common';
import { HubService } from './hub.service';
import {
    CreateChannelDto, UpdateChannelDto, CreateMessageDto, CreatePostDto,
    CreateCommentDto, CreateEventDto, CreateResourceDto, PinDto,
} from './dto/hub.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('hub')
export class HubController {
    constructor(private readonly hubService: HubService) { }

    // ── Channels ──────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('channels')
    getChannels() {
        return this.hubService.getChannels();
    }

    @UseGuards(JwtAuthGuard)
    @Post('channels')
    createChannel(@Request() req: any, @Body() dto: CreateChannelDto) {
        return this.hubService.createChannel(req.user.role, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('channels/:id')
    updateChannel(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateChannelDto) {
        return this.hubService.updateChannel(req.user.role, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('channels/:id')
    deleteChannel(@Request() req: any, @Param('id') id: string) {
        return this.hubService.deleteChannel(req.user.role, id);
    }

    // ── Seed (admin only — idempotent) ────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post('seed')
    seedChannels() {
        return this.hubService.seedChannels();
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('channels/:id/messages')
    getMessages(@Param('id') id: string, @Query('cursor') cursor?: string) {
        return this.hubService.getMessages(id, cursor);
    }

    @UseGuards(JwtAuthGuard)
    @Post('channels/:id/messages')
    sendMessage(@Request() req: any, @Param('id') id: string, @Body() dto: CreateMessageDto) {
        return this.hubService.sendMessage(req.user.id, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('messages/:id/pin')
    pinMessage(@Request() req: any, @Param('id') id: string, @Body() dto: PinDto) {
        return this.hubService.pinMessage(req.user.role, id, dto.pinned);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('messages/:id')
    deleteMessage(@Request() req: any, @Param('id') id: string) {
        return this.hubService.deleteMessage(req.user.id, req.user.role, id);
    }

    // ── Posts (Feed) ──────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('posts')
    getAllPosts(@Query('cursor') cursor?: string) {
        return this.hubService.getAllPosts(cursor);
    }

    @UseGuards(JwtAuthGuard)
    @Get('channels/:id/posts')
    getPosts(@Param('id') id: string, @Query('cursor') cursor?: string) {
        return this.hubService.getPosts(id, cursor);
    }

    @UseGuards(JwtAuthGuard)
    @Post('channels/:id/posts')
    createPost(@Request() req: any, @Param('id') id: string, @Body() dto: CreatePostDto) {
        return this.hubService.createPost(req.user.id, req.user.role, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('posts/:id/pin')
    pinPost(@Request() req: any, @Param('id') id: string, @Body() dto: PinDto) {
        return this.hubService.pinPost(req.user.role, id, dto.pinned);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('posts/:id')
    deletePost(@Request() req: any, @Param('id') id: string) {
        return this.hubService.deletePost(req.user.id, req.user.role, id);
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('posts/:id/comments')
    getComments(@Param('id') id: string) {
        return this.hubService.getComments(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('posts/:id/comments')
    addComment(@Request() req: any, @Param('id') id: string, @Body() dto: CreateCommentDto) {
        return this.hubService.addComment(req.user.id, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('comments/:id')
    deleteComment(@Request() req: any, @Param('id') id: string) {
        return this.hubService.deleteComment(req.user.id, req.user.role, id);
    }

    // ── Events ────────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('events')
    getEvents() {
        return this.hubService.getEvents();
    }

    @UseGuards(JwtAuthGuard)
    @Post('events')
    createEvent(@Request() req: any, @Body() dto: CreateEventDto) {
        return this.hubService.createEvent(req.user.id, req.user.role, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('events/:id')
    deleteEvent(@Request() req: any, @Param('id') id: string) {
        return this.hubService.deleteEvent(req.user.role, id);
    }

    // ── Resources ─────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('resources')
    getResources() {
        return this.hubService.getResources();
    }

    @UseGuards(JwtAuthGuard)
    @Post('resources')
    createResource(@Request() req: any, @Body() dto: CreateResourceDto) {
        return this.hubService.createResource(req.user.id, req.user.role, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('resources/:id')
    deleteResource(@Request() req: any, @Param('id') id: string) {
        return this.hubService.deleteResource(req.user.role, id);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('admin/stats')
    getAdminStats(@Request() req: any) {
        return this.hubService.getAdminStats(req.user.role);
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/members')
    getAdminMembers(@Request() req: any) {
        return this.hubService.getAdminMembers(req.user.role);
    }
}
