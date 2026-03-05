import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

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
    sendMessage(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: { content: string },
    ) {
        return this.messagesService.sendMessage(req.user.id, id, body.content);
    }

    /** POST /api/messages/conversations/:id/read */
    @Post('conversations/:id/read')
    markAsRead(@Param('id') id: string, @Request() req: any) {
        return this.messagesService.markAsRead(id, req.user.id);
    }

    /** DELETE /api/messages/conversations/:id */
    @Delete('conversations/:id')
    deleteConversation(@Param('id') id: string, @Request() req: any) {
        return this.messagesService.deleteConversation(id, req.user.id);
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
