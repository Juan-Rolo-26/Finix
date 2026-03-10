import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsGateway } from '../events.gateway';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(
        private readonly messagesService: MessagesService,
        private readonly eventsGateway: EventsGateway,
    ) { }

    /** GET /api/messages/conversations */
    @Get('conversations')
    getConversations(@Request() req: any) {
        return this.messagesService.getConversations(req.user.id);
    }

    /** POST /api/messages/conversations - create or get conversation with another user */
    @Post('conversations')
    createOrGetConversation(@Request() req: any, @Body() body: { userId: string }) {
        return this.messagesService.getOrCreateConversation(req.user.id, body.userId);
    }

    /** GET /api/messages/conversations/:id/messages */
    @Get('conversations/:id/messages')
    getMessages(
        @Param('id') id: string,
        @Request() req: any,
        @Query('cursor') cursor?: string,
    ) {
        return this.messagesService.getMessages(id, req.user.id, cursor);
    }

    /** POST /api/messages/conversations/:id/messages */
    @Post('conversations/:id/messages')
    async sendMessage(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: {
            content?: string;
            attachment?: {
                type: 'image' | 'post' | 'chart' | 'story';
                url?: string;
                postId?: string;
                meta?: Record<string, any>;
            } | null;
        },
    ) {
        const message = await this.messagesService.sendMessage(req.user.id, id, body);

        try {
            this.eventsGateway.emitNewMessage(id, message);
        } catch {
            // The message is already persisted; realtime delivery is best-effort.
        }

        return message;
    }

    /** POST /api/messages/conversations/:id/read */
    @Post('conversations/:id/read')
    markAsRead(@Param('id') id: string, @Request() req: any) {
        return this.messagesService.markAsRead(id, req.user.id);
    }

    /** GET /api/messages/unread-count */
    @Get('unread-count')
    getUnreadCount(@Request() req: any) {
        return this.messagesService.getUnreadCount(req.user.id);
    }

    /** GET /api/messages/search-users?q=query */
    @Get('search-users')
    searchUsers(@Query('q') q: string, @Request() req: any) {
        return this.messagesService.searchUsers(q || '', req.user.id);
    }
}
