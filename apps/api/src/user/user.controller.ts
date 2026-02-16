import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
    @Get('me/stats')
    async getMyStats(@Request() req) {
        return this.userService.getUserStats(req.user.id);
    }

    @Get(':username')
    async getUserProfile(@Param('username') username: string) {
        return this.userService.getUserProfile(username);
    }
}
