import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user.dto';

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
    async updateProfile(@Request() req, @Body() updateData: UpdateProfileDto) {
        return this.userService.updateProfile(req.user.id, updateData);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/password')
    async changePassword(@Request() req, @Body() changePasswordData: ChangePasswordDto) {
        return this.userService.changePassword(req.user.id, changePasswordData.currentPassword, changePasswordData.newPassword);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/portfolio-visibility')
    async updatePortfolioVisibility(@Request() req, @Body() body: { isPortfolioPublic: boolean }) {
        return this.userService.updateProfile(req.user.id, { isPortfolioPublic: body.isPortfolioPublic });
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/preferences')
    async updatePreferences(@Request() req, @Body() body: { preferences: any }) {
        return this.userService.updateProfile(req.user.id, { preferences: body.preferences });
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/privacy')
    async updatePrivacy(@Request() req, @Body() body: {
        isProfilePublic?: boolean;
        isPortfolioPublic?: boolean;
        acceptingFollowers?: boolean;
        allowComments?: boolean;
        allowMentions?: boolean;
    }) {
        return this.userService.updateProfile(req.user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('recommendations')
    async getRecommendedUsers(@Request() req, @Query('limit') limit?: string) {
        return this.userService.getTopTraders();
    }

    @UseGuards(JwtAuthGuard)
    @Get('ranking')
    async getUserRanking(@Request() req) {
        return this.userService.getUserStats(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('ranking/leaderboard')
    async getRankingLeaderboard(@Query('limit') limit?: string) {
        return this.userService.getTopTraders();
    }

    @Get('search')
    async searchUsers(@Query('q') query: string) {
        return this.userService.searchUsers(query);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':username/follow')
    async toggleFollowPost(@Param('username') username: string, @Request() req) {
        return this.userService.toggleFollow(req.user.id, username);
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
