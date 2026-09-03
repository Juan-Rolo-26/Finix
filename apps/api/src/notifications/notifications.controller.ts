import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async getNotifications(
        @Req() req: any,
        @Query('unreadOnly') unreadOnly?: string,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('category') category?: string
    ) {
        return this.notificationsService.getNotifications(req.user.id, {
            unreadOnly: unreadOnly === 'true',
            limit: limit ? parseInt(limit) : 20,
            cursor,
            category: category || 'ALL'
        });
    }

    @Get('unread-count')
    async getUnreadCount(@Req() req: any) {
        return this.notificationsService.countUnread(req.user.id);
    }

    @Patch(':id/read')
    async markAsRead(@Req() req: any, @Param('id') id: string) {
        return this.notificationsService.markAsRead(req.user.id, id);
    }

    @Patch('read-all')
    async markAllAsRead(@Req() req: any, @Body('category') category?: string) {
        return this.notificationsService.markAllAsRead(req.user.id, category);
    }

    @Delete(':id')
    async deleteNotification(@Req() req: any, @Param('id') id: string) {
        return this.notificationsService.deleteNotification(req.user.id, id);
    }

    @Get('preferences')
    async getPreferences(@Req() req: any) {
        return this.notificationsService.getPreferences(req.user.id);
    }

    @Patch('preferences')
    async updatePreferences(@Req() req: any, @Body() prefs: any) {
        return this.notificationsService.updatePreferences(req.user.id, prefs);
    }
}
