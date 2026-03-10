import { Controller, Get, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('users')
export class UserController {
    constructor(private userService: UserService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMyProfile(@Request() req) {
        return this.userService.getCurrentUserProfile(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    async updateProfile(@Request() req, @Body() updateData: any) {
        return this.userService.updateProfile(req.user.id, updateData);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/password')
    async updatePassword(
        @Request() req,
        @Body() body: { currentPassword?: string; newPassword?: string }
    ) {
        return this.userService.changePassword(req.user.id, body.currentPassword || '', body.newPassword || '');
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/notifications')
    async getMyNotifications(@Request() req) {
        return this.userService.getNotifications(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/notifications/unread-count')
    async getMyUnreadNotificationsCount(@Request() req) {
        return this.userService.getUnreadNotificationsCount(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/notifications/read-all')
    async markMyNotificationsAsRead(@Request() req) {
        return this.userService.markAllNotificationsAsRead(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/stats')
    async getMyStats(@Request() req) {
        return this.userService.getUserStats(req.user.id);
    }

    @Get('top-traders')
    async getTopTraders() {
        return this.userService.getTopTraders();
    }

    @Get('search')
    async searchUsers(@Query('q') query: string) {
        return this.userService.searchUsers(query);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':username/follow')
    async toggleFollow(@Param('username') username: string, @Request() req) {
        return this.userService.toggleFollow(req.user.id, username);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':username')
    async getUserProfile(@Param('username') username: string, @Request() req) {
        return this.userService.getUserProfile(username, req.user?.id);
    }
}
